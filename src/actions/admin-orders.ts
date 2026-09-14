"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { markOrderPaid, restoreStockForOrder } from "@/lib/orders";
import { cancelPayment, refundPayment } from "@/lib/iyzico";
import { sendShippingNotice } from "@/lib/mail";
import { toIyzicoPrice } from "@/lib/money";

export type OrderActionState = { ok: boolean; message: string } | null;

const ALLOWED_STATUSES = [
  "PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "FAILED",
] as const;

type OrderStatus = (typeof ALLOWED_STATUSES)[number];

/** Sipariş durumunu değiştirir; iptal/iade durumunda stoğu geri ekler. */
export async function updateOrderStatusAction(orderId: string, status: string) {
  await requireAdmin();
  if (!ALLOWED_STATUSES.includes(status as OrderStatus)) {
    return { ok: false, message: "Geçersiz durum." };
  }

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) return { ok: false, message: "Sipariş bulunamadı." };

  const next = status as OrderStatus;

  // Havale onayı: PENDING -> PAID iken stok zaten rezerve edilmiş olabilir
  if (next === "PAID" && order.paymentMethod !== "CREDIT_CARD" && order.status === "PENDING") {
    await db
      .update(orders)
      .set({ status: "PAID", paymentStatus: "SUCCESS", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    revalidatePath(`/admin/siparisler/${orderId}`);
    revalidatePath("/admin/siparisler");
    return { ok: true, message: "Ödeme onaylandı." };
  }

  // Kartlı siparişte PAID'e geçiş -> stok düşümü de yapılır
  if (next === "PAID" && order.status !== "PAID") {
    await markOrderPaid(orderId);
    revalidatePath(`/admin/siparisler/${orderId}`);
    revalidatePath("/admin/siparisler");
    return { ok: true, message: "Sipariş ödendi olarak işaretlendi." };
  }

  // İptal / iade -> stok geri
  const wasStockTaken = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"].includes(order.status) ||
    (order.status === "PENDING" && order.paymentMethod !== "CREDIT_CARD");

  if ((next === "CANCELLED" || next === "REFUNDED") && wasStockTaken) {
    await restoreStockForOrder(orderId, next === "REFUNDED" ? "RETURN" : "CANCEL");
  }

  await db
    .update(orders)
    .set({
      status: next,
      paymentStatus:
        next === "REFUNDED" ? "REFUNDED" : next === "CANCELLED" ? "FAILED" : order.paymentStatus,
      deliveredAt: next === "DELIVERED" ? new Date() : order.deliveredAt,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
  return { ok: true, message: "Durum güncellendi." };
}

/** Kargo bilgisi girer ve müşteriye mail atar. */
export async function setShippingAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  await requireAdmin();

  const orderId = String(formData.get("orderId") ?? "");
  const company = String(formData.get("shippingCompany") ?? "").trim();
  const tracking = String(formData.get("trackingNumber") ?? "").trim();

  if (!company || !tracking) {
    return { ok: false, message: "Kargo firması ve takip numarası zorunlu." };
  }

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) return { ok: false, message: "Sipariş bulunamadı." };

  await db
    .update(orders)
    .set({
      shippingCompany: company,
      trackingNumber: tracking,
      status: "SHIPPED",
      shippedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  await sendShippingNotice(order.email, order.orderNumber, company, tracking);

  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
  return { ok: true, message: "Kargo bilgisi kaydedildi ve müşteriye bildirildi." };
}

/** Yönetici notu */
export async function setAdminNoteAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const note = String(formData.get("adminNote") ?? "").slice(0, 2000);

  await db.update(orders).set({ adminNote: note }).where(eq(orders.id, orderId));
  revalidatePath(`/admin/siparisler/${orderId}`);
  return { ok: true, message: "Not kaydedildi." };
}

/**
 * iyzico üzerinden iade/iptal.
 * Gün sonu kapanmadıysa iptal (cancel), kapandıysa iade (refund) gerekir.
 * Önce iptal denenir, olmazsa iade denenir.
 */
export async function refundOrderAction(orderId: string) {
  await requireAdmin();

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) return { ok: false, message: "Sipariş bulunamadı." };
  if (order.paymentMethod !== "CREDIT_CARD") {
    return {
      ok: false,
      message: "Bu sipariş kartla ödenmemiş. İadeyi elden/banka yoluyla yapıp durumu 'İade Edildi' olarak işaretle.",
    };
  }

  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt))
    .limit(1);

  const payment = paymentRows[0];
  if (!payment?.iyzicoPaymentId) {
    return { ok: false, message: "Bu sipariş için iyzico ödeme kaydı yok." };
  }

  // 1) İptal dene
  const cancelResult = await cancelPayment(
    payment.iyzicoPaymentId,
    payment.conversationId ?? orderId,
  );

  let succeeded = cancelResult.ok;
  let note = cancelResult.ok ? "iyzico: ödeme iptal edildi" : cancelResult.error;

  // 2) Olmadıysa iade dene
  if (!succeeded && payment.iyzicoTransactionId) {
    const refundResult = await refundPayment(
      payment.iyzicoTransactionId,
      toIyzicoPrice(order.grandTotal),
      payment.conversationId ?? orderId,
    );
    succeeded = refundResult.ok;
    note = refundResult.ok ? "iyzico: ödeme iade edildi" : refundResult.error;
  }

  if (!succeeded) {
    return { ok: false, message: `İade başarısız: ${note}` };
  }

  await db
    .update(payments)
    .set({ status: "REFUNDED" })
    .where(eq(payments.id, payment.id));

  await restoreStockForOrder(orderId, "RETURN");

  await db
    .update(orders)
    .set({
      status: "REFUNDED",
      paymentStatus: "REFUNDED",
      adminNote: `${order.adminNote ?? ""}\n${note}`.trim().slice(0, 2000),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
  return { ok: true, message: "İade tamamlandı ve stok geri eklendi." };
}
