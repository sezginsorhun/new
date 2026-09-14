/**
 * VARSAYILAN SİTE AYARLARI
 * Admin panelinden değiştirilebilir. Veritabanında kayıt yoksa bunlar geçerlidir.
 * Para alanları KURUŞ cinsindendir.
 */

export const DEFAULT_SETTINGS = {
  site_name: "Alenora",
  site_tagline: "Her tende güzel",

  // --- Kargo (kuruş) ---
  shipping_fee: "4990", // 49,90 TL
  free_shipping_threshold: "75000", // 750 TL üzeri ücretsiz
  cod_fee: "1500", // kapıda ödeme hizmet bedeli 15 TL

  // --- İletişim ---
  contact_phone: "0850 000 00 00",
  contact_email: "info@alenora.com",
  contact_address: "Merkez Mah. Örnek Cad. No:1, Şişli / İstanbul",
  instagram_url: "https://instagram.com/",
  whatsapp_number: "",

  // --- Ödeme yöntemleri (1 açık / 0 kapalı) ---
  payment_credit_card: "1",
  payment_bank_transfer: "1",
  payment_cod: "1",
  bank_accounts:
    "Ziraat Bankası — TR00 0000 0000 0000 0000 0000 00 — Alenora Tekstil Ltd. Şti.",

  // --- Taksit ---
  max_installment: "9",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
