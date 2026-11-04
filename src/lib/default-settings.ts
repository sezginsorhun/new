/**
 * VARSAYILAN SİTE AYARLARI
 *
 * Buradaki her satır yönetim panelinden değiştirilebilir. Veritabanında
 * kayıt yoksa bu değerler geçerlidir — yani site hiçbir ayar girilmeden de
 * doğru çalışır.
 *
 * Para alanları KURUŞ cinsindendir (49,90 TL -> 4990).
 * Liste tutan alanlar satır satır yazılır:  "Etiket|/adres"
 */

export const DEFAULT_SETTINGS = {
  site_name: "Alenora",
  site_tagline: "Her tende güzel",
  logo_url: "", // boşsa yazıyla logo gösterilir

  /* --- Üst duyuru şeridi --- */
  announce_enabled: "1",
  // Birden fazla satır yazarsan sırayla döner
  announce_items:
    "750,00 TL üzeri kargo bedava\n14 gün içinde koşulsuz iade\nGizli ve isimsiz paketle gönderim",
  announce_bg: "#141110",
  announce_color: "#ffffff",

  /* --- Menüdeki vurgulu bağlantı --- */
  menu_highlight_label: "İndirim",
  menu_highlight_url: "/indirimli",

  /* --- Kargo (kuruş) --- */
  shipping_fee: "4990",
  free_shipping_threshold: "75000",
  cod_fee: "1500",

  /* --- İletişim --- */
  contact_phone: "0850 000 00 00",
  contact_email: "info@alenora.com",
  contact_address: "Merkez Mah. Örnek Cad. No:1, Şişli / İstanbul",
  instagram_url: "https://instagram.com/",
  facebook_url: "",
  tiktok_url: "",
  youtube_url: "",
  whatsapp_number: "",

  /* --- Alt bilgi (footer) --- */
  footer_about:
    "Nefes alan sertifikalı kumaşlar, iz bırakmayan dikişler ve her bedene yakışan kalıplar.",
  footer_col1_title: "Alışveriş",
  footer_col1_links:
    "Kadın|/kategori/kadin\nErkek|/kategori/erkek\nYeni gelenler|/kategori/kadin\nİndirimdekiler|/indirimli",
  footer_col2_title: "Yardım",
  footer_col2_links:
    "Sipariş takibi|/hesabim/siparisler\nKargo ve teslimat|/sayfa/kargo-teslimat\nİade ve değişim|/sayfa/iade-degisim\nBeden rehberi|/sayfa/beden-rehberi",
  footer_col3_title: "Kurumsal",
  footer_col3_links:
    "Hakkımızda|/sayfa/hakkimizda\nİletişim|/iletisim\nGizlilik politikası|/sayfa/gizlilik\nMesafeli satış sözleşmesi|/sayfa/mesafeli-satis",
  footer_note:
    "Alenora Tekstil Ltd. Şti. · Mersis No: 0000000000000 · ETBİS kayıtlıdır.",

  /* --- Ödeme yöntemleri (1 açık / 0 kapalı) --- */
  payment_credit_card: "1",
  payment_bank_transfer: "1",
  payment_cod: "1",
  bank_accounts:
    "Ziraat Bankası — TR00 0000 0000 0000 0000 0000 00 — Alenora Tekstil Ltd. Şti.",

  /* --- Taksit --- */
  max_installment: "9",

  /* --- Tema (Görünüm → Tema) ---------------------------------------------
   * Buradaki değerler globals.css'teki varsayılanlarla AYNI olmalıdır.
   * Aynı oldukları sürece hiç CSS üretilmez; panelden değiştirildiğinde
   * sadece değişen satır yazılır. İkisini birlikte güncelle.
   */
  theme_brand: "#c62a4e",
  theme_brand_dark: "#a41f3e",
  theme_brand_soft: "#fdeef1",
  theme_ink: "#141110",
  theme_ink_soft: "#5a524e",
  theme_muted: "#8b8380",
  theme_cream: "#ffffff",
  theme_surface_2: "#f6f4f3",
  theme_line: "#e7e3e0",
  theme_radius: "2",
  theme_font_scale: "100",
  /** Serbest CSS. Boşsa hiçbir şey basılmaz. */
  custom_css: "",

  /* --- SEO (Sistem → SEO) -------------------------------------------------
   * Sekme başlığı ve arama sonucu açıklamaları buradan yönetilir.
   * Başlık şablonundaki %s, sayfanın kendi başlığıyla değişir.
   */
  seo_title_template: "%s | Alenora",
  /** Ana sayfanın başlığı — şablona GİRMEZ, olduğu gibi kullanılır. */
  seo_home_title: "Alenora — Yetişkin Ürünleri ve İç Giyim",
  seo_home_description:
    "Cinsel sağlık ürünleri, çift ürünleri ve iç giyim. Gizli ve isimsiz paketle gönderim, 750 TL üzeri ücretsiz kargo.",
  /** Kendi açıklaması olmayan sayfalarda kullanılır. */
  seo_default_description:
    "Alenora — yetişkin ürünleri ve iç giyim. Gizli paketle hızlı gönderim.",
  /** Sosyal medyada paylaşılınca görünen görsel (1200x630 önerilir) */
  seo_og_image: "",
  /** "1" ise arama motorları siteyi dizine ekler. Kapatmak siteyi Google'dan düşürür. */
  seo_index: "1",
  /** Google Search Console doğrulama etiketi (sadece içerik kısmı) */
  seo_google_verification: "",

  /* --- Menü (Görünüm → Menü) ---------------------------------------------
   * Menü kategorilerden otomatik oluşur; buradaki JSON yalnızca üzerine
   * uygulanan düzenlemelerdir (gizle / sırala / yeniden adlandır / özel
   * bağlantı). Boşsa menü tamamen otomatiktir. bkz. src/lib/menu.ts
   */
  menu_overrides: "",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

/** "Etiket|/adres" biçimindeki çok satırlı ayarı listeye çevirir. */
export function parseLinkList(value: string): { label: string; href: string }[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|");
      return { label: (label ?? "").trim(), href: (href ?? "#").trim() };
    })
    .filter((item) => item.label);
}

/** Çok satırlı metni satır listesine çevirir. */
export function parseLines(value: string): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
