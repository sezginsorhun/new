/**
 * SİPARİŞ İŞLEMLERİ
 *
 * Kritik kural: tutarlar ve stok DAİMA sunucuda, veritabanındaki verilerle
 * hesaplanır. Tarayıcıdan gelen fiyat/indirim bilgisine asla güvenilmez.
 */

import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { createId } from "@/lib/id";
import {
  carts,
  cartItems,
  coupons,
  orderItems,
  orders,
  payments,
  productImages,
  productVariants,
  products,
  stockMovements,
  type AddressSnapshot,
} from "@/db/schema";
import { getCartTotals, findCart, validateCoupon } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { buildOrderNumber } from "@/lib/utils";

/* --------------------------- SİPARİŞ NUMARASI --------------------------- */

export async function nextOrderNumber(): Promise<string> {
  // MySQL'de sequence yok. `LAST_INSERT_ID(value + 1)` kalıbı sayacı tek
  // sorguda hem artırır hem de artırılmış değeri bu bağlantıya döndürür.
  // Aynı anda gelen iki sipariş asla aynı numarayı alamaz.
  await db.execute(sql`insert ignore into counters (name, value) values ('order_number', 0)`);
  await db.execute(
    sql`update counters set value = last_insert_id(value + 1) where name = 'order_number'`,
  );
  const result = await db.execute(sql`select last_insert_id() as value`);
  const rows = (Array.isArray(result) ? result[0] : result) as unknown as Array<{
    value: string | number;
  }>;
  return buildOrderNumber(Number(rows[0].value));
}

/* ---------------------------- SİPARİŞ KURMA ----------------------------- */

export type CheckoutInput = {
  email: string;
  phone: string;
  userId: string | null;
  paymentMethod: "CREDIT_CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY";
  installment: number;
  couponCode: string | null;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  customerNote: string | null;
};

export type CreatedOrder = {
  id: string;
  orderNumber: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  items: {
    productName: string;
    variantInfo: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
};

/**
 * Sepetten "ödeme bekleniyor" durumunda sipariş oluşturur.
 * Stok bu aşamada DÜŞMEZ — ödeme onaylanınca düşer (markOrderPaid).
 */
export async function createPendingOrder(
  input: CheckoutInput,
): Promise<{ ok: true; order: CreatedOrder } | { ok: false; error: string }> {
  const totals = await getCartTotals(input.couponCode);
  if (totals.lines.length === 0) {
    return { ok: false, error: "Sepetin boş." };
  }

  // Stok son kontrolü
  for (const line of totals.lines) {
    if (line.quantity > line.stock) {
      return {
        ok: false,
        error: `"${line.productName}" ürününde yeterli stok kalmadı. Sepetini güncelle.`,
      };
    }
  }

  // Kapıda ödeme hizmet bedeli
  const settings = await getSettings();
  const codFee =
    input.paymentMethod === "CASH_ON_DELIVERY" ? Number(settings.cod_fee) || 0 : 0;

  const shippingTotal = totals.shippingTotal + codFee;
  const grandTotal = totals.subtotal - totals.discountTotal + shippingTotal;

  const orderNumber = await nextOrderNumber();

  // MySQL'de RETURNING yok: kimliği önce üretiyoruz ve dönen özeti
  // elimizdeki değerlerden kuruyoruz (ekstra sorguya gerek kalmıyor).
  const orderId = createId();
  const order = {
    id: orderId,
    orderNumber,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    shippingTotal,
    grandTotal,
  };
  await db
    .insert(orders)
    .values({
      id: orderId,
      orderNumber,
      userId: input.userId,
      email: input.email,
      phone: input.phone,
      status: "PENDING",
      paymentMethod: input.paymentMethod,
      paymentStatus: "PENDING",
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      shippingTotal,
      grandTotal,
      couponCode: totals.couponCode,
      installment: input.installment,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress,
      customerNote: input.customerNote,
    });

  // Sipariş satırları — ürün bilgisinin anlık kopyası
  const itemRows = totals.lines.map((line) => ({
    orderId: order.id,
    variantId: line.variantId,
    productSlug: line.productSlug,
    productName: line.productName,
    variantInfo: `${line.colorName} / ${line.size}`,
    sku: line.sku,
    imageUrl: line.imageUrl,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    taxRate: line.taxRate,
    lineTotal: line.lineTotal,
  }));

  await db.insert(orderItems).values(itemRows);

  return {
    ok: true,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      shippingTotal: order.shippingTotal,
      grandTotal: order.grandTotal,
      items: itemRows.map((row) => ({
        productName: row.productName,
        variantInfo: row.variantInfo,
        sku: row.sku,
        unitPrice: row.unitPrice,
        quantity: row.quantity,
        lineTotal: row.lineTotal,
      })),
    },
  };
}

/* ---------------------------- ÖDEME ONAYI ------------------------------- */

/**
 * Ödemesi alınan siparişi işler:
 *  - durumu PAID yapar
 *  - stokları düşer ve stok hareketi yazar
 *  - kupon kullanım sayacını arttırır
 *  - sepeti boşaltır
 * Hepsi tek transaction içinde yapılır: biri başarısız olursa hiçbiri olmaz.
 */
export async function markOrderPaid(orderId: string) {
  await db.transaction(async (tx) => {
    const rows = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = rows[0];
    if (!order) throw new Error("Sipariş bulunamadı.");
    if (order.status === "PAID" || order.status === "PREPARING") return; // zaten işlenmiş

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      if (!item.variantId) continue;

      // Stoğu düş — negatife düşmeyecek şekilde
      await tx
        .update(productVariants)
        .set({ stock: sql`greatest(${productVariants.stock} - ${item.quantity}, 0)` })
        .where(eq(productVariants.id, item.variantId));

      await tx.insert(stockMovements).values({
        variantId: item.variantId,
        type: "SALE",
        quantity: -item.quantity,
        orderId: order.id,
        note: `Satış — ${order.orderNumber}`,
      });

      // Ürünün satış sayacı
      const variant = await tx
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      if (variant[0]) {
        await tx
          .update(products)
          .set({ soldCount: sql`${products.soldCount} + ${item.quantity}` })
          .where(eq(products.id, variant[0].productId));
      }
    }

    if (order.couponCode) {
      await tx
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.code, order.couponCode));
    }

    await tx
      .update(orders)
      .set({ status: "PAID", paymentStatus: "SUCCESS", updatedAt: sql`now()` })
      .where(eq(orders.id, orderId));
  });
}

/** Kapıda ödeme / havale siparişleri için: stok rezerve edilir, ödeme beklenir. */
export async function reserveStockForOrder(orderId: string) {
  await db.transaction(async (tx) => {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const rows = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const order = rows[0];
    if (!order) return;

    for (const item of items) {
      if (!item.variantId) continue;
      await tx
        .update(productVariants)
        .set({ stock: sql`greatest(${productVariants.stock} - ${item.quantity}, 0)` })
        .where(eq(productVariants.id, item.variantId));

      await tx.insert(stockMovements).values({
        variantId: item.variantId,
        type: "SALE",
        quantity: -item.quantity,
        orderId: order.id,
        note: `Rezervasyon — ${order.orderNumber}`,
      });
    }

    if (order.couponCode) {
      await tx
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.code, order.couponCode));
    }
  });
}

/** Ödeme başarısız olduğunda siparişi işaretle. */
export async function markOrderFailed(orderId: string, reason: string) {
  await db
    .update(orders)
    .set({
      status: "FAILED",
      paymentStatus: "FAILED",
      adminNote: reason.slice(0, 500),
      updatedAt: sql`now()`,
    })
    .where(eq(orders.id, orderId));
}

/** Sipariş iptal/iade edilince stoğu geri ekler. */
export async function restoreStockForOrder(
  orderId: string,
  type: "CANCEL" | "RETURN" = "CANCEL",
) {
  await db.transaction(async (tx) => {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      if (!item.variantId) continue;
      await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
        .where(eq(productVariants.id, item.variantId));

      await tx.insert(stockMovements).values({
        variantId: item.variantId,
        type,
        quantity: item.quantity,
        orderId,
        note: type === "CANCEL" ? "Sipariş iptali" : "Müşteri iadesi",
      });
    }
  });
}

/** Sipariş tamamlanınca sepeti boşalt. */
export async function emptyCurrentCart() {
  const cart = await findCart();
  if (!cart) return;
  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  await db.update(carts).set({ updatedAt: sql`now()` }).where(eq(carts.id, cart.id));
}

/* ------------------------------- ÖDEME KAYDI ---------------------------- */

export async function createPaymentRecord(values: {
  orderId: string;
  amount: number;
  conversationId: string;
  installment: number;
  provider?: string;
}) {
  const paymentId = createId();
  await db.insert(payments).values({
    id: paymentId,
    orderId: values.orderId,
    amount: values.amount,
    conversationId: values.conversationId,
    installment: values.installment,
    provider: values.provider ?? "iyzico",
    status: "PENDING",
  });
  const [record] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  return record;
}

export async function updatePaymentRecord(
  paymentRecordId: string,
  values: Partial<typeof payments.$inferInsert>,
) {
  await db.update(payments).set(values).where(eq(payments.id, paymentRecordId));
}

export async function findOrderByNumber(orderNumber: string) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return rows[0] ?? null;
}

export async function getOrderItems(orderId: string) {
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

/* --------------------------- KUPON DOĞRULAMA ---------------------------- */

export async function assertCouponUsable(code: string | null, subtotal: number) {
  if (!code) return null;
  const result = await validateCoupon(code, subtotal);
  return result.ok ? result.coupon : null;
}

/** Ürünün kapak görselini getirir (mail/özet için). */
export async function getProductCover(productId: string) {
  const rows = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(and(eq(productImages.productId, productId), eq(productImages.sortOrder, 0)))
    .limit(1);
  return rows[0]?.url ?? null;
}
