/**
 * IYZICO SANAL POS ENTEGRASYONU
 *
 * Kimlik doğrulama: IYZWSv2 (HMAC-SHA256)
 *   signature = HMAC_SHA256( randomKey + uriPath + requestBody , secretKey )
 *   Authorization: IYZWSv2 base64("apiKey:...&randomKey:...&signature:...")
 *
 * Akış (3D Secure — yasal olarak Türkiye'de zorunlu):
 *   1) /payment/3dsecure/initialize  -> bankanın 3D sayfasının HTML'i döner
 *   2) Müşteri SMS kodunu girer, banka bizim callbackUrl'imize POST eder
 *   3) /payment/3dsecure/auth        -> ödeme kesinleşir
 *
 * ÖNEMLİ: Kart bilgileri hiçbir zaman veritabanına yazılmaz, loglanmaz.
 */

import "server-only";
import crypto from "crypto";

const BASE_URL = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";
const API_KEY = process.env.IYZICO_API_KEY || "";
const SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";

export function isIyzicoConfigured(): boolean {
  return Boolean(API_KEY && SECRET_KEY && !API_KEY.includes("xxxxx"));
}

/* ------------------------- İMZA / YETKİLENDİRME ------------------------- */

function buildAuthorizationHeader(uriPath: string, body: string) {
  const randomKey = `${Date.now()}${Math.floor(Math.random() * 1_000_000_000)}`;
  const payload = randomKey + uriPath + body;
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payload, "utf8")
    .digest("hex");

  const params = [
    `apiKey:${API_KEY}`,
    `randomKey:${randomKey}`,
    `signature:${signature}`,
  ].join("&");

  return {
    authorization: `IYZWSv2 ${Buffer.from(params).toString("base64")}`,
    randomKey,
  };
}

async function iyzicoRequest<T = IyzicoResponse>(
  uriPath: string,
  payload: Record<string, unknown>,
): Promise<T> {
  if (!isIyzicoConfigured()) {
    throw new Error(
      "iyzico API bilgileri tanımlı değil. .env dosyasında IYZICO_API_KEY ve IYZICO_SECRET_KEY doldurulmalı.",
    );
  }

  const body = JSON.stringify(payload);
  const { authorization, randomKey } = buildAuthorizationHeader(uriPath, body);

  const response = await fetch(`${BASE_URL}${uriPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "x-iyzi-rnd": randomKey,
      "x-iyzi-client-version": "alenora-1.0",
    },
    body,
    cache: "no-store",
  });

  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`iyzico beklenmeyen yanıt (HTTP ${response.status}): ${text.slice(0, 300)}`);
  }
}

/* ------------------------------- TİPLER --------------------------------- */

export type IyzicoResponse = {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  locale?: string;
  systemTime?: number;
  conversationId?: string;
};

export type IyzicoBuyer = {
  id: string;
  name: string;
  surname: string;
  gsmNumber?: string;
  email: string;
  identityNumber: string; // TCKN — zorunlu alan
  registrationAddress: string;
  city: string;
  country: string;
  ip: string;
  zipCode?: string;
};

export type IyzicoAddress = {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode?: string;
};

export type IyzicoBasketItem = {
  id: string;
  name: string;
  category1: string;
  category2?: string;
  itemType: "PHYSICAL" | "VIRTUAL";
  price: string; // "299.90"
};

export type IyzicoCard = {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string; // "12"
  expireYear: string; // "2030"
  cvc: string;
  registerCard?: 0 | 1;
};

/* --------------------- TAKSİT / BIN SORGULAMA --------------------------- */

export type InstallmentOption = {
  installmentNumber: number;
  installmentPrice: string; // aylık tutar
  totalPrice: string; // toplam tutar
};

export type InstallmentDetail = {
  binNumber: string;
  cardType?: string;
  cardAssociation?: string;
  cardFamilyName?: string;
  bankName?: string;
  force3ds?: number;
  installmentPrices: InstallmentOption[];
};

/**
 * Kartın ilk 6-8 hanesine göre taksit seçeneklerini sorgular.
 * Ödeme formunda kart numarası yazılırken çağrılır.
 */
export async function retrieveInstallments(
  binNumber: string,
  priceTl: string,
  conversationId: string,
): Promise<{ ok: boolean; detail?: InstallmentDetail; error?: string }> {
  try {
    const res = await iyzicoRequest<
      IyzicoResponse & { installmentDetails?: InstallmentDetail[] }
    >("/payment/iyzipos/installment", {
      locale: "tr",
      conversationId,
      binNumber,
      price: priceTl,
    });

    if (res.status !== "success" || !res.installmentDetails?.length) {
      return { ok: false, error: res.errorMessage ?? "Taksit bilgisi alınamadı." };
    }
    return { ok: true, detail: res.installmentDetails[0] };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/* ----------------------- 3D SECURE — 1. ADIM ---------------------------- */

export type Initialize3DSInput = {
  conversationId: string;
  basketId: string; // sipariş numarası
  price: string; // ürünler toplamı "299.90"
  paidPrice: string; // kargo/taksit farkı dahil tahsil edilecek tutar
  installment: number;
  callbackUrl: string;
  card: IyzicoCard;
  buyer: IyzicoBuyer;
  shippingAddress: IyzicoAddress;
  billingAddress: IyzicoAddress;
  basketItems: IyzicoBasketItem[];
};

export type Initialize3DSResult =
  | { ok: true; htmlContent: string }
  | { ok: false; errorCode?: string; error: string };

export async function initialize3DSecure(
  input: Initialize3DSInput,
): Promise<Initialize3DSResult> {
  try {
    const res = await iyzicoRequest<IyzicoResponse & { threeDSHtmlContent?: string }>(
      "/payment/3dsecure/initialize",
      {
        locale: "tr",
        conversationId: input.conversationId,
        price: input.price,
        paidPrice: input.paidPrice,
        currency: "TRY",
        installment: input.installment,
        basketId: input.basketId,
        paymentChannel: "WEB",
        paymentGroup: "PRODUCT",
        callbackUrl: input.callbackUrl,
        paymentCard: {
          cardHolderName: input.card.cardHolderName,
          cardNumber: input.card.cardNumber,
          expireMonth: input.card.expireMonth,
          expireYear: input.card.expireYear,
          cvc: input.card.cvc,
          registerCard: 0,
        },
        buyer: input.buyer,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
        basketItems: input.basketItems,
      },
    );

    if (res.status !== "success" || !res.threeDSHtmlContent) {
      return {
        ok: false,
        errorCode: res.errorCode,
        error: res.errorMessage ?? "Ödeme başlatılamadı.",
      };
    }

    // iyzico HTML'i base64 olarak döner
    return {
      ok: true,
      htmlContent: Buffer.from(res.threeDSHtmlContent, "base64").toString("utf8"),
    };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/* ----------------------- 3D SECURE — 2. ADIM ---------------------------- */

export type Complete3DSResult =
  | {
      ok: true;
      paymentId: string;
      paymentTransactionId?: string;
      paidPrice: string;
      installment: number;
      cardFamily?: string;
      cardAssociation?: string;
      lastFourDigits?: string;
      binNumber?: string;
      raw: unknown;
    }
  | { ok: false; errorCode?: string; error: string; raw?: unknown };

export async function complete3DSecure(
  conversationId: string,
  paymentId: string,
  conversationData?: string,
): Promise<Complete3DSResult> {
  try {
    const payload: Record<string, unknown> = {
      locale: "tr",
      conversationId,
      paymentId,
    };
    if (conversationData) payload.conversationData = conversationData;

    const res = await iyzicoRequest<
      IyzicoResponse & {
        paymentId?: string;
        paidPrice?: string;
        installment?: number;
        cardFamily?: string;
        cardAssociation?: string;
        lastFourDigits?: string;
        binNumber?: string;
        itemTransactions?: Array<{ paymentTransactionId?: string }>;
      }
    >("/payment/3dsecure/auth", payload);

    if (res.status !== "success") {
      return {
        ok: false,
        errorCode: res.errorCode,
        error: res.errorMessage ?? "Ödeme tamamlanamadı.",
        raw: res,
      };
    }

    return {
      ok: true,
      paymentId: String(res.paymentId ?? paymentId),
      paymentTransactionId: res.itemTransactions?.[0]?.paymentTransactionId,
      paidPrice: String(res.paidPrice ?? "0"),
      installment: Number(res.installment ?? 1),
      cardFamily: res.cardFamily,
      cardAssociation: res.cardAssociation,
      lastFourDigits: res.lastFourDigits,
      binNumber: res.binNumber,
      raw: res,
    };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/* --------------------------- İPTAL / İADE ------------------------------- */

/** Gün sonu kapanmadan önce tam iptal. */
export async function cancelPayment(
  paymentId: string,
  conversationId: string,
  ip = "127.0.0.1",
) {
  try {
    const res = await iyzicoRequest("/payment/cancel", {
      locale: "tr",
      conversationId,
      paymentId,
      ip,
    });
    return res.status === "success"
      ? { ok: true as const }
      : { ok: false as const, error: res.errorMessage ?? "İptal başarısız." };
  } catch (error) {
    return { ok: false as const, error: (error as Error).message };
  }
}

/** Gün sonu sonrası kısmi veya tam iade. */
export async function refundPayment(
  paymentTransactionId: string,
  priceTl: string,
  conversationId: string,
  ip = "127.0.0.1",
) {
  try {
    const res = await iyzicoRequest("/payment/refund", {
      locale: "tr",
      conversationId,
      paymentTransactionId,
      price: priceTl,
      currency: "TRY",
      ip,
    });
    return res.status === "success"
      ? { ok: true as const }
      : { ok: false as const, error: res.errorMessage ?? "İade başarısız." };
  } catch (error) {
    return { ok: false as const, error: (error as Error).message };
  }
}

/* ------------------------------ YARDIMCI -------------------------------- */

/** iyzico mdStatus kodlarının Türkçe açıklaması */
export const MD_STATUS_MESSAGES: Record<string, string> = {
  "0": "3D Secure imzası geçersiz veya doğrulama başarısız.",
  "2": "Kart sahibi veya bankası sisteme kayıtlı değil.",
  "3": "Kartın bankası sisteme kayıtlı değil.",
  "4": "Kart sahibi doğrulama sistemine kayıt olmayı seçmiş.",
  "5": "Doğrulama yapılamıyor.",
  "6": "3D Secure hatası.",
  "7": "Sistem hatası.",
  "8": "Bilinmeyen kart numarası.",
};
