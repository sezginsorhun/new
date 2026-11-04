/**
 * ÖDEME SAĞLAYICI SEÇİMİ
 *
 * `PAYMENT_PROVIDER` ortam değişkeni hangi sanal POS'un kullanılacağını
 * belirler. Tanımlı değilse "iyzico" varsayılır (mevcut kurulum bozulmasın).
 *
 *   PAYMENT_PROVIDER=iyzico   → iyzico sanal POS
 *   PAYMENT_PROVIDER=yok      → kartla ödeme kapalı; havale/EFT ve kapıda
 *                               ödeme çalışmaya devam eder
 *
 * YENİ SAĞLAYICI EKLEMEK
 *   1. `src/lib/payment/<ad>-provider.ts` dosyasını yaz; `PaymentProvider`
 *      arayüzünü uygula (örnek: iyzico-provider.ts).
 *   2. Aşağıdaki PROVIDERS kaydına ekle.
 *   3. `PAYMENT_PROVIDER=<ad>` yap.
 * Sepet, sipariş, iade ve panel kodunda HİÇBİR değişiklik gerekmez.
 */

import "server-only";
import { iyzicoProvider } from "./iyzico-provider";
import type { PaymentProvider, PaymentProviderId } from "./types";

export * from "./types";

/**
 * Hiçbir sanal POS kurulu değilken kullanılan sağlayıcı.
 * Çağrılan her şey "kapalı" yanıtı döner — çökmez, sessizce başarısız olmaz,
 * müşteriye ne yapacağını söyleyen bir mesaj verir.
 */
const KAPALI_MESAJ =
  "Kartla ödeme şu an kullanılamıyor. Havale/EFT veya kapıda ödeme ile devam edebilirsin.";

const noneProvider: PaymentProvider = {
  id: "yok",
  label: "Tanımlı değil",
  supportsInstallments: false,
  isConfigured: () => false,
  isTestMode: () => false,
  async retrieveInstallments() {
    return { ok: false, error: KAPALI_MESAJ };
  },
  async start3DSecure() {
    return { ok: false, error: KAPALI_MESAJ };
  },
  async complete3DSecure() {
    return { ok: false, error: KAPALI_MESAJ };
  },
  async cancel() {
    return { ok: false, error: KAPALI_MESAJ };
  },
  async refund() {
    return { ok: false, error: KAPALI_MESAJ };
  },
  verificationMessages: {},
};

const PROVIDERS: Record<PaymentProviderId, PaymentProvider> = {
  iyzico: iyzicoProvider,
  yok: noneProvider,
};

/** Ayarlardaki sağlayıcı. Tanınmayan bir değer yazılmışsa iyzico'ya düşer. */
export function getPaymentProvider(): PaymentProvider {
  const raw = (process.env.PAYMENT_PROVIDER || "iyzico").trim().toLowerCase();
  return PROVIDERS[raw as PaymentProviderId] ?? PROVIDERS.iyzico;
}

/**
 * Kartla ödeme müşteriye gösterilsin mi?
 * Sağlayıcı seçilmiş AMA anahtarları girilmemişse de kapalıdır — yarım
 * yapılandırmayla müşteriyi ödeme ekranında hataya düşürmeyiz.
 */
export function isCardPaymentAvailable(): boolean {
  return getPaymentProvider().isConfigured();
}

/** Panelde göstermek için özet durum. */
export function paymentProviderStatus(): {
  id: PaymentProviderId;
  label: string;
  configured: boolean;
  testMode: boolean;
} {
  const provider = getPaymentProvider();
  return {
    id: provider.id,
    label: provider.label,
    configured: provider.isConfigured(),
    testMode: provider.isConfigured() && provider.isTestMode(),
  };
}
