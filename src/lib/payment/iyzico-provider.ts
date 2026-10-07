/**
 * IYZICO ADAPTÖRÜ
 *
 * `src/lib/iyzico.ts` içindeki ham API çağrılarını ortak arayüze çevirir.
 * Sitenin geri kalanı bu dosyayı da doğrudan çağırmaz — `getPaymentProvider()`
 * üzerinden gelir.
 *
 * Yeni bir sağlayıcı eklerken örnek olarak bu dosyaya bak: yapılacak iş
 * `PaymentProvider` arayüzündeki yedi üyeyi doldurmaktan ibarettir.
 */

import "server-only";
import {
  MD_STATUS_MESSAGES,
  cancelPayment,
  complete3DSecure,
  initialize3DSecure,
  isIyzicoConfigured,
  refundPayment,
  retrieveInstallments,
} from "@/lib/iyzico";
import type {
  Complete3DSecureResult,
  InstallmentInfo,
  PaymentProvider,
  SimpleResult,
  Start3DSecureInput,
  Start3DSecureResult,
} from "./types";

const SANDBOX_HOST = "sandbox-api.iyzipay.com";

export const iyzicoProvider: PaymentProvider = {
  id: "iyzico",
  label: "iyzico",
  supportsInstallments: true,

  isConfigured: () => isIyzicoConfigured(),

  isTestMode: () =>
    (process.env.IYZICO_BASE_URL || SANDBOX_HOST).includes(SANDBOX_HOST),

  async retrieveInstallments(binNumber, priceTl, conversationId) {
    const result = await retrieveInstallments(binNumber, priceTl, conversationId);
    // iyzico'nun alan adları zaten ortak tiple aynı; dönüşüm gerekmiyor.
    return result as { ok: boolean; detail?: InstallmentInfo; error?: string };
  },

  async start3DSecure(input: Start3DSecureInput): Promise<Start3DSecureResult> {
    return initialize3DSecure(input);
  },

  async complete3DSecure(
    conversationId,
    paymentId,
    conversationData,
  ): Promise<Complete3DSecureResult> {
    const result = await complete3DSecure(conversationId, paymentId, conversationData);
    if (!result.ok) return result;
    // iyzico "paymentTransactionId" der; arayüzde adı "transactionId".
    const { paymentTransactionId, ...rest } = result;
    return { ...rest, transactionId: paymentTransactionId };
  },

  async cancel(paymentId, conversationId, ip): Promise<SimpleResult> {
    return cancelPayment(paymentId, conversationId, ip);
  },

  async refund(transactionId, priceTl, conversationId, ip): Promise<SimpleResult> {
    return refundPayment(transactionId, priceTl, conversationId, ip);
  },

  verificationMessages: MD_STATUS_MESSAGES,
};
