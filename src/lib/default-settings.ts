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

  /* --- İletişim ---
   * Boş bırakılan alan sitede HİÇ gösterilmez. Uydurma bir telefon ya da
   * adres göstermek, boş bırakmaktan çok daha fazla güven kaybettirir. */
  contact_phone: "",
  contact_email: "",
  contact_address: "",
  /** Çalışma saatleri — iletişim sayfasında ve WhatsApp kutusunda görünür */
  contact_hours: "Hafta içi 09:00 – 18:00",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  youtube_url: "",
  whatsapp_number: "",
  /** WhatsApp sipariş mesajının başı; ürün adı, kodu ve bağlantısı sonuna eklenir */
  whatsapp_message: "Merhaba, bu ürünü sipariş etmek istiyorum:",

  /* --- E-posta gönderimi (SMTP) ---
   * Panel → Ayarlar → E-posta gönderimi. Yalnızca süper yönetici değiştirir.
   * Şifre düz metin olarak SAKLANMAZ: smtp_pass_enc AES-GCM ile şifrelidir.
   * Ortam değişkenleri (SMTP_HOST…) tanımlıysa onlar önceliklidir. */
  smtp_host: "smtp.hostinger.com",
  smtp_port: "465",
  smtp_user: "",
  smtp_pass_enc: "",
  mail_from: "",

  /* --- Satıcı (şirket) bilgileri ---
   * Mesafeli satış sözleşmesi, iade koşulları ve footer'daki yasal satır
   * bu alanlardan OTOMATİK doldurulur (6563 sayılı Kanun ve Ticari
   * Reklam ve Haksız Ticari Uygulamalar Yönetmeliği satıcı bilgilerini
   * zorunlu tutar; sanal POS başvurusunda da ilk bakılan yer burasıdır).
   * Boş alanlar sitede hiç yazılmaz. */
  company_title: "",
  company_tax_office: "",
  company_tax_number: "",
  /** Yalnızca şirketler (Ltd./A.Ş.) için. Şahıs işletmesinde boş bırak. */
  company_mersis: "",
  company_kep: "",
  /** ETBİS kayıt numarası/doğrulama. Doluysa footer'da "ETBİS'e kayıtlıdır" yazar. */
  company_etbis: "",

  /* --- Alt bilgi (footer) --- */
  footer_about:
    "Cinsel sağlık ve yetişkin ürünlerinde orijinal, faturalı ürün. Tüm siparişler içeriği belli olmayan düz kolide, isimsiz gönderilir.",
  footer_col1_title: "Alışveriş",
  footer_col1_links:
    "Kadın oyuncakları|/kategori/kadin-oyuncaklari\nErkek oyuncakları|/kategori/erkek-oyuncaklari\nCinsel sağlık|/kategori/cinsel-saglik\nİndirimdekiler|/indirimli",
  footer_col2_title: "Yardım",
  footer_col2_links:
    "Sipariş takibi|/hesabim/siparisler\nKargo ve teslimat|/sayfa/kargo-teslimat\nİade ve değişim|/sayfa/iade-degisim\nSık sorulan sorular|/sayfa/sss",
  footer_col3_title: "Kurumsal",
  footer_col3_links:
    "Hakkımızda|/sayfa/hakkimizda\nİletişim|/iletisim\nKVKK aydınlatma metni|/sayfa/gizlilik-politikasi\nMesafeli satış sözleşmesi|/sayfa/mesafeli-satis\nÖn bilgilendirme formu|/sayfa/on-bilgilendirme",
  /** Boşsa footer'daki yasal satır şirket bilgilerinden otomatik kurulur. */
  footer_note: "",

  /* --- Ödeme yöntemleri (1 açık / 0 kapalı) --- */
  payment_credit_card: "1",
  payment_bank_transfer: "1",
  payment_cod: "1",
  /** Her satıra bir hesap: "Banka — IBAN — Hesap sahibi". Boşsa havale seçeneği gizlenir. */
  bank_accounts: "",

  /* --- Taksit --- */
  max_installment: "9",

  /* --- Tema (Görünüm → Tema) ---------------------------------------------
   * Buradaki değerler globals.css'teki varsayılanlarla AYNI olmalıdır.
   * Aynı oldukları sürece hiç CSS üretilmez; panelden değiştirildiğinde
   * sadece değişen satır yazılır. İkisini birlikte güncelle.
   */
  theme_brand: "#4b2a7b",
  theme_brand_dark: "#391f5f",
  theme_brand_soft: "#f3eefa",
  theme_ink: "#141110",
  theme_ink_soft: "#5a524e",
  theme_muted: "#8b8380",
  theme_cream: "#ffffff",
  theme_surface_2: "#f7f5fa",
  theme_line: "#e8e4ee",
  theme_radius: "8",
  theme_font_scale: "100",
  /** Serbest CSS. Boşsa hiçbir şey basılmaz. */
  custom_css: "",

  /* --- SEO (Sistem → SEO) -------------------------------------------------
   * Sekme başlığı ve arama sonucu açıklamaları buradan yönetilir.
   * Başlık şablonundaki %s, sayfanın kendi başlığıyla değişir.
   */
  seo_title_template: "%s | Alenora",
  /** Ana sayfanın başlığı — şablona GİRMEZ, olduğu gibi kullanılır. */
  seo_home_title: "Alenora — Cinsel Sağlık ve Yetişkin Ürünleri",
  seo_home_description:
    "Orijinal cinsel sağlık ve yetişkin ürünleri. İçeriği belli olmayan düz kolide gizli gönderim, 750 TL üzeri ücretsiz kargo.",
  /** Kendi açıklaması olmayan sayfalarda kullanılır. */
  seo_default_description:
    "Alenora — orijinal cinsel sağlık ve yetişkin ürünleri. Gizli paketle hızlı gönderim.",
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
