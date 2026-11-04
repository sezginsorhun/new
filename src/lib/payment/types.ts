/**
 * ÖDEME SAĞLAYICI ARAYÜZÜ
 *
 * NEDEN BU KATMAN VAR
 * Sanal POS sağlayıcısı değişebilir — banka POS'u, ödeme kuruluşu, başka bir
 * kuruluş. Sitenin geri kalanı hiçbirini tanımamalı: sepet, sipariş ve iade
 * kodu yalnızca aşağıdaki arayüzü bilir. Sağlayıcı değiştiğinde yazılacak
 * tek şey yeni bir adaptör dosyasıdır; `PAYMENT_PROVIDER` ortam değişkeni
 * hangisinin kullanılacağına karar verir.
 *
 * Buradaki tipler bilinçli olarak SAĞLAYICIDAN BAĞIMSIZ adlandırıldı.
 * Bir sağlayıcının alan adı farklıysa (örn. "paymentTransactionId"), bunu
 * kendi adaptörü çevirir — sızdırmaz.
 *
 * 3D SECURE ZORUNLUDUR
 * Türkiye'de kartla internet ödemesinde 3D Secure yasal zorunluluktur, bu
 * yüzden arayüzde "3D'siz ödeme" diye bir yol yok.
 *
 * KART BİLGİSİ
 * Kart numarası / CVC hiçbir zaman veritabanına yazılmaz, loglanmaz, bu
 * katmandan dışarı çıkmaz. Sadece `start3DSecure` çağrısında sağlayıcıya
 * iletilir.
 */

export type PaymentProviderId = "iyzico" | "yok";

/* ------------------------------ girdi tipleri ---------------------------- */

export type PaymentCard = {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string; // "12"
  expireYear: string; // "2030"
  cvc: string;
};

export type PaymentBuyer = {
  id: string;
  name: string;
  surname: string;
  email: string;
  /** TCKN — Türkiye'deki sağlayıcıların çoğu zorunlu tutar */
  identityNumber: string;
  gsmNumber?: string;
  registrationAddress: string;
  city: string;
  country: string;
  ip: string;
  zipCode?: string;
};

export type PaymentAddress = {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode?: string;
};

export type PaymentBasketItem = {
  id: string;
  name: string;
  category1: string;
  category2?: string;
  itemType: "PHYSICAL" | "VIRTUAL";
  /** "299.90" — TL, nokta ayraçlı */
  price: string;
};

export type Start3DSecureInput = {
  conversationId: string;
  /** Sipariş numarası */
  basketId: string;
  /** Ürünler toplamı, "299.90" */
  price: string;
  /** Kargo ve taksit farkı dâhil tahsil edilecek tutar */
  paidPrice: string;
  installment: number;
  callbackUrl: string;
  card: PaymentCard;
  buyer: PaymentBuyer;
  shippingAddress: PaymentAddress;
  billingAddress: PaymentAddress;
  basketItems: PaymentBasketItem[];
};

/* ------------------------------ çıktı tipleri ---------------------------- */

export type Start3DSecureResult =
  | { ok: true; htmlContent: string }
  | { ok: false; errorCode?: string; error: string };

export type Complete3DSecureResult =
  | {
      ok: true;
      /** Sağlayıcıdaki ödeme kimliği — iade/iptal bununla yapılır */
      paymentId: string;
      /** Kısmi iade için işlem kimliği (sağlayıcı veriyorsa) */
      transactionId?: string;
      paidPrice: string;
      installment: number;
      cardFamily?: string;
      cardAssociation?: string;
      lastFourDigits?: string;
      binNumber?: string;
      raw: unknown;
    }
  | { ok: false; errorCode?: string; error: string; raw?: unknown };

export type InstallmentOption = {
  installmentNumber: number;
  /** Aylık taksit tutarı, "99.90" */
  installmentPrice: string;
  /** Toplam tutar, "299.70" */
  totalPrice: string;
};

export type InstallmentInfo = {
  binNumber: string;
  cardType?: string;
  cardAssociation?: string;
  cardFamilyName?: string;
  bankName?: string;
  /** Sağlayıcı bu kart için 3D'yi zorunlu tutuyorsa 1 */
  force3ds?: number;
  installmentPrices: InstallmentOption[];
};

export type SimpleResult = { ok: true } | { ok: false; error: string };

/* -------------------------------- arayüz --------------------------------- */

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  /** Panelde ve müşteriye görünen ad */
  readonly label: string;

  /** Anahtarlar tanımlı mı? Değilse kartla ödeme kapalı gösterilir. */
  isConfigured(): boolean;

  /** Test (sandbox) ortamında mı çalışıyor? Panelde uyarı için. */
  isTestMode(): boolean;

  /** Taksit sorgulama desteği var mı? */
  readonly supportsInstallments: boolean;

  /**
   * Kartın ilk 6-8 hanesine göre taksit seçenekleri.
   * Desteklenmiyorsa boş liste döner — çağıran yer tek çekim gösterir.
   */
  retrieveInstallments(
    binNumber: string,
    priceTl: string,
    conversationId: string,
  ): Promise<{ ok: boolean; detail?: InstallmentInfo; error?: string }>;

  /** 1. adım: bankanın 3D Secure sayfasının HTML'ini döndürür. */
  start3DSecure(input: Start3DSecureInput): Promise<Start3DSecureResult>;

  /** 2. adım: banka callback'inden sonra ödemeyi kesinleştirir. */
  complete3DSecure(
    conversationId: string,
    paymentId: string,
    conversationData?: string,
  ): Promise<Complete3DSecureResult>;

  /** Gün sonu kapanmadan tam iptal. */
  cancel(paymentId: string, conversationId: string, ip?: string): Promise<SimpleResult>;

  /** Gün sonu sonrası kısmi/tam iade. */
  refund(
    transactionId: string,
    priceTl: string,
    conversationId: string,
    ip?: string,
  ): Promise<SimpleResult>;

  /**
   * 3D doğrulama sonucu kodlarının Türkçe karşılığı.
   * Banka "mdStatus" benzeri bir kod döndürdüğünde müşteriye anlaşılır
   * bir mesaj göstermek için.
   */
  readonly verificationMessages: Record<string, string>;
}
