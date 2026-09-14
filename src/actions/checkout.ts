"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, type AddressSnapshot } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCartTotals } from "@/lib/cart";
import {
  createPaymentRecord,
  createPendingOrder,
  emptyCurrentCart,
  markOrderFailed,
  reserveStockForOrder,
} from "@/lib/orders";
import { initialize3DSecure, isIyzicoConfigured } from "@/lib/iyzico";
import { toIyzicoPrice } from "@/lib/money";
import { sendAdminOrderNotice, sendOrderConfirmation } from "@/lib/mail";
import { createId } from "@/lib/id";

/* ------------------------------ DOĞRULAMA ------------------------------- */

const addressSchema = z.object({
  firstName: z.string().trim().min(2, "Ad gir."),
  lastName: z.string().trim().min(2, "Soyad gir."),
  phone: z.string().trim().regex(/^0?5\d{9}$/, "Telefonu 05XXXXXXXXX biçiminde gir."),
  city: z.string().trim().min(2, "İl seç."),
  district: z.string().trim().min(2, "İlçe gir."),
  line1: z.string().trim().min(10, "Açık adresi daha ayrıntılı yaz."),
  zipCode: z.string().trim().optional(),
  isCorporate: z.boolean().optional(),
  companyName: z.string().trim().optional(),
  taxOffice: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
});

const cardSchema = z.object({
  cardHolderName: z.string().trim().min(5, "Kart üzerindeki ismi gir."),
  cardNumber: z
    .string()
    .transform((value) => value.replace(/\s/g, ""))
    .refine((value) => /^\d{15,16}$/.test(value), "Kart numarası 16 haneli olmalı."),
  expireMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, "Ay 01-12 arası olmalı."),
  expireYear: z.string().regex(/^20\d{2}$/, "Yıl 2026 gibi 4 haneli olmalı."),
  cvc: z.string().regex(/^\d{3,4}$/, "CVC 3 haneli olmalı."),
  installment: z.coerce.number().int().min(1).max(12).default(1),
});

const baseSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta gir."),
  phone: z.string().trim().regex(/^0?5\d{9}$/, "Telefonu 05XXXXXXXXX biçiminde gir."),
  identityNumber: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && /^\d{11}$/.test(value) ? value : "11111111111")),
  customerNote: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().optional(),
  acceptsTerms: z.literal(true, {
    message: "Mesafeli satış sözleşmesini ve ön bilgilendirmeyi onaylamalısın.",
  }),
});

export type CheckoutResult =
  | { ok: true; kind: "3ds"; html: string }
  | { ok: true; kind: "done"; orderNumber: string }
  | { ok: false; error: string };

/* ---------------------------- YARDIMCILAR ------------------------------- */

function readAddress(formData: FormData, prefix: "ship" | "bill") {
  return {
    firstName: formData.get(`${prefix}_firstName`),
    lastName: formData.get(`${prefix}_lastName`),
    phone: formData.get(`${prefix}_phone`),
    city: formData.get(`${prefix}_city`),
    district: formData.get(`${prefix}_district`),
    line1: formData.get(`${prefix}_line1`),
    zipCode: formData.get(`${prefix}_zipCode`) || undefined,
    isCorporate: formData.get(`${prefix}_isCorporate`) === "on",
    companyName: formData.get(`${prefix}_companyName`) || undefined,
    taxOffice: formData.get(`${prefix}_taxOffice`) || undefined,
    taxNumber: formData.get(`${prefix}_taxNumber`) || undefined,
  };
}

async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return store.get("x-real-ip") ?? "127.0.0.1";
}

/* ------------------------------ ANA AKIŞ -------------------------------- */

export async function submitCheckout(formData: FormData): Promise<CheckoutResult> {
  /* 1) Temel alanlar */
  const base = baseSchema.safeParse({
    email: formData.get("email"),
    phone: formData.get("phone"),
    identityNumber: formData.get("identityNumber") ?? undefined,
    customerNote: formData.get("customerNote") || undefined,
    couponCode: formData.get("couponCode") || undefined,
    acceptsTerms: formData.get("acceptsTerms") === "on",
  });
  if (!base.success) return { ok: false, error: base.error.issues[0].message };

  /* 2) Adresler */
  const shipParsed = addressSchema.safeParse(readAddress(formData, "ship"));
  if (!shipParsed.success) {
    return { ok: false, error: `Teslimat adresi: ${shipParsed.error.issues[0].message}` };
  }

  const sameBilling = formData.get("sameBilling") === "on";
  let billing: AddressSnapshot = shipParsed.data as AddressSnapshot;
  if (!sameBilling) {
    const billParsed = addressSchema.safeParse(readAddress(formData, "bill"));
    if (!billParsed.success) {
      return { ok: false, error: `Fatura adresi: ${billParsed.error.issues[0].message}` };
    }
    if (
      billParsed.data.isCorporate &&
      !(billParsed.data.companyName && billParsed.data.taxOffice && billParsed.data.taxNumber)
    ) {
      return {
        ok: false,
        error: "Kurumsal fatura için firma adı, vergi dairesi ve vergi numarası zorunlu.",
      };
    }
    billing = billParsed.data as AddressSnapshot;
  }

  /* 3) Ödeme yöntemi */
  const method = String(formData.get("paymentMethod") ?? "");
  if (!["CREDIT_CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY"].includes(method)) {
    return { ok: false, error: "Ödeme yöntemi seç." };
  }
  const paymentMethod = method as "CREDIT_CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY";

  /* 4) Sepet kontrolü */
  const totals = await getCartTotals(base.data.couponCode ?? null);
  if (totals.lines.length === 0) return { ok: false, error: "Sepetin boş." };

  const user = await getCurrentUser();

  /* 5) Kart dışı ödemeler: siparişi doğrudan oluştur */
  if (paymentMethod !== "CREDIT_CARD") {
    const created = await createPendingOrder({
      email: base.data.email,
      phone: base.data.phone,
      userId: user?.id ?? null,
      paymentMethod,
      installment: 1,
      couponCode: base.data.couponCode ?? null,
      shippingAddress: shipParsed.data as AddressSnapshot,
      billingAddress: billing,
      customerNote: base.data.customerNote ?? null,
    });
    if (!created.ok) return { ok: false, error: created.error };

    await reserveStockForOrder(created.order.id);
    await emptyCurrentCart();

    const mailData = {
      orderNumber: created.order.orderNumber,
      email: base.data.email,
      customerName: shipParsed.data.firstName,
      grandTotal: created.order.grandTotal,
      items: created.order.items,
    };
    await sendOrderConfirmation(mailData);
    await sendAdminOrderNotice(mailData);

    return { ok: true, kind: "done", orderNumber: created.order.orderNumber };
  }

  /* 6) Kartlı ödeme */
  if (!isIyzicoConfigured()) {
    return {
      ok: false,
      error:
        "Kredi kartı ödemesi şu an aktif değil (iyzico anahtarları tanımlı değil). Havale/EFT veya kapıda ödeme seçebilirsin.",
    };
  }

  const cardParsed = cardSchema.safeParse({
    cardHolderName: formData.get("cardHolderName"),
    cardNumber: formData.get("cardNumber"),
    expireMonth: formData.get("expireMonth"),
    expireYear: formData.get("expireYear"),
    cvc: formData.get("cvc"),
    installment: formData.get("installment") ?? 1,
  });
  if (!cardParsed.success) return { ok: false, error: cardParsed.error.issues[0].message };

  const created = await createPendingOrder({
    email: base.data.email,
    phone: base.data.phone,
    userId: user?.id ?? null,
    paymentMethod,
    installment: cardParsed.data.installment,
    couponCode: base.data.couponCode ?? null,
    shippingAddress: shipParsed.data as AddressSnapshot,
    billingAddress: billing,
    customerNote: base.data.customerNote ?? null,
  });
  if (!created.ok) return { ok: false, error: created.error };

  const conversationId = createId(20);
  await createPaymentRecord({
    orderId: created.order.id,
    amount: created.order.grandTotal,
    conversationId,
    installment: cardParsed.data.installment,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const ip = await clientIp();

  /**
   * iyzico'da `price` sepet kalemleri toplamı, `paidPrice` ise tahsil edilecek
   * tutardır (kargo + taksit farkı dahil). basketItems toplamı price'a EŞİT olmalı.
   * Kargoyu ayrı bir sepet kalemi olarak eklersek ikisi de tutar.
   */
  const basketItems = created.order.items.map((item, index) => ({
    id: `${created.order.orderNumber}-${index + 1}`,
    name: `${item.productName} (${item.variantInfo})`.slice(0, 100),
    category1: "İç Giyim",
    itemType: "PHYSICAL" as const,
    price: toIyzicoPrice(item.lineTotal),
  }));

  // İndirim varsa kalem fiyatlarını oransal düşür, kargoyu kalem olarak ekle
  const itemsSum = created.order.items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (created.order.discountTotal > 0) {
    let remaining = created.order.discountTotal;
    created.order.items.forEach((item, index) => {
      const share =
        index === created.order.items.length - 1
          ? remaining
          : Math.round((item.lineTotal / itemsSum) * created.order.discountTotal);
      remaining -= share;
      const net = Math.max(item.lineTotal - share, 1);
      basketItems[index].price = toIyzicoPrice(net);
    });
  }
  if (created.order.shippingTotal > 0) {
    basketItems.push({
      id: `${created.order.orderNumber}-kargo`,
      name: "Kargo Bedeli",
      category1: "Kargo",
      itemType: "PHYSICAL" as const,
      price: toIyzicoPrice(created.order.shippingTotal),
    });
  }

  const basketSum = basketItems.reduce((sum, item) => sum + Number(item.price) * 100, 0);

  const result = await initialize3DSecure({
    conversationId,
    basketId: created.order.orderNumber,
    price: toIyzicoPrice(Math.round(basketSum)),
    paidPrice: toIyzicoPrice(created.order.grandTotal),
    installment: cardParsed.data.installment,
    callbackUrl: `${siteUrl}/api/odeme/callback`,
    card: {
      cardHolderName: cardParsed.data.cardHolderName,
      cardNumber: cardParsed.data.cardNumber,
      expireMonth: cardParsed.data.expireMonth,
      expireYear: cardParsed.data.expireYear,
      cvc: cardParsed.data.cvc,
    },
    buyer: {
      id: user?.id ?? `guest-${conversationId}`,
      name: shipParsed.data.firstName,
      surname: shipParsed.data.lastName,
      gsmNumber: `+9${base.data.phone.replace(/\D/g, "").padStart(11, "0")}`,
      email: base.data.email,
      identityNumber: base.data.identityNumber,
      registrationAddress: shipParsed.data.line1,
      city: shipParsed.data.city,
      country: "Turkey",
      ip,
      zipCode: shipParsed.data.zipCode,
    },
    shippingAddress: {
      contactName: `${shipParsed.data.firstName} ${shipParsed.data.lastName}`,
      city: shipParsed.data.city,
      country: "Turkey",
      address: shipParsed.data.line1,
      zipCode: shipParsed.data.zipCode,
    },
    billingAddress: {
      contactName: billing.isCorporate
        ? (billing.companyName ?? `${billing.firstName} ${billing.lastName}`)
        : `${billing.firstName} ${billing.lastName}`,
      city: billing.city,
      country: "Turkey",
      address: billing.line1,
      zipCode: billing.zipCode ?? undefined,
    },
    basketItems,
  });

  if (!result.ok) {
    await markOrderFailed(created.order.id, `${result.errorCode ?? ""} ${result.error}`);
    return { ok: false, error: result.error };
  }

  return { ok: true, kind: "3ds", html: result.htmlContent };
}

/** Havale bildirimi sonrası admin onayı bekleyen siparişin durumunu getirir. */
export async function getOrderStatus(orderNumber: string) {
  const rows = await db
    .select({ status: orders.status, paymentStatus: orders.paymentStatus })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return rows[0] ?? null;
}
