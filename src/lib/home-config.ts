/**
 * ANA SAYFA BÖLÜM TİPLERİ VE SABİTLERİ
 *
 * Bu dosya hem sunucuda hem tarayıcıda çalışır (panel formları buradan
 * okur). Veritabanına dokunan işlevler için bkz. src/lib/home.ts
 */

export type SectionType =
  | "hero"
  | "usp"
  | "categories"
  | "products"
  | "promo"
  | "richtext"
  | "newsletter";

export type UspItem = { icon: string; title: string; text: string };

export type SectionConfig = {
  /* hero */
  position?: string;
  autoplayMs?: number;
  showArrows?: boolean;
  showDots?: boolean;
  height?: "short" | "medium" | "tall";

  /* usp */
  items?: UspItem[];

  /* categories */
  source?: "roots" | "children" | "manual" | "featured" | "new" | "discounted" | "bestsellers" | "category";
  categoryIds?: string[];
  categorySlug?: string;
  columns?: number;
  shape?: "square" | "portrait" | "wide";
  /**
   * Kategori kutusunun görünümü.
   *   overlay → görselin üstüne küçük yazı (varsayılan, yer kaplamaz)
   *   card    → görsel üstte, altında büyük başlık ve bir düğme
   * "card" az sayıda kutu için uygundur (2-4); altı kutuyla sayfa uzar.
   */
  tileStyle?: "overlay" | "card";
  /** card stilinde kutunun altındaki düğme yazısı */
  tileButtonLabel?: string;

  /* products */
  limit?: number;
  layout?: "grid" | "rail" | "split" | "full";
  ctaLabel?: string;
  ctaHref?: string;

  /* promo */
  imageUrl?: string;
  mobileImageUrl?: string;
  eyebrow?: string;
  text?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  theme?: "light" | "dark";
  align?: "left" | "center" | "right";
  overlay?: number;

  /* richtext */
  html?: string;
  maxWidth?: number;

  /* ortak */
  background?: "white" | "soft" | "ink";
};

export type HomeSection = {
  id: string;
  type: SectionType;
  title: string | null;
  subtitle: string | null;
  config: SectionConfig;
  sortOrder: number;
  isActive: boolean;
};

/** Panelde bölüm eklerken gösterilecek liste */
export const SECTION_TYPES: { value: SectionType; label: string; description: string }[] = [
  { value: "hero", label: "Carousel (slayt)", description: "Büyük görselli, otomatik dönen tanıtım alanı" },
  { value: "usp", label: "Güven şeridi", description: "Kargo, iade, güvenli ödeme gibi kısa vaatler" },
  { value: "categories", label: "Kategori kutuları", description: "Görselli kategori bağlantıları" },
  { value: "products", label: "Ürün listesi", description: "Öne çıkan / yeni / indirimli / kategori ürünleri" },
  { value: "promo", label: "Tanıtım bandı", description: "Tek büyük görsel + başlık + buton" },
  { value: "richtext", label: "Serbest metin", description: "Başlık ve paragraf — marka hikâyesi gibi" },
  { value: "newsletter", label: "Bülten kaydı", description: "E-posta toplama alanı" },
];

export const PRODUCT_SOURCES: { value: string; label: string }[] = [
  { value: "featured", label: "Öne çıkanlar" },
  { value: "new", label: "Yeni gelenler" },
  { value: "discounted", label: "İndirimdekiler" },
  { value: "bestsellers", label: "En çok satanlar" },
  { value: "category", label: "Belirli bir kategori" },
];

/** Güven şeridinde kullanılabilen simgeler (panelde seçilir) */
export const USP_ICONS = [
  "truck", "refresh", "shield", "leaf", "heart", "package",
  "credit-card", "headphones", "gift", "sparkles", "lock", "clock",
] as const;

/* ------------------------------ VARSAYILANLAR --------------------------- */

export const DEFAULT_SECTIONS: Omit<HomeSection, "id">[] = [
  {
    type: "hero",
    title: null,
    subtitle: null,
    sortOrder: 10,
    isActive: true,
    config: { position: "home_hero", autoplayMs: 6000, showArrows: true, showDots: true, height: "tall" },
  },
  {
    type: "usp",
    title: null,
    subtitle: null,
    sortOrder: 20,
    isActive: true,
    config: {
      items: [
        { icon: "truck", title: "Ücretsiz kargo", text: "750 TL üzeri siparişlerde" },
        { icon: "refresh", title: "14 gün iade", text: "Koşulsuz değişim hakkı" },
        { icon: "shield", title: "Gizli paket", text: "İsimsiz, nötr kutuda gönderim" },
        { icon: "lock", title: "Güvenli ödeme", text: "3D Secure ile korumalı" },
      ],
    },
  },
  {
    type: "categories",
    title: "Kategoriler",
    subtitle: null,
    sortOrder: 30,
    isActive: true,
    config: { source: "children", limit: 6, columns: 6, shape: "portrait", background: "white" },
  },
  {
    type: "products",
    title: "Çok satanlar",
    subtitle: null,
    sortOrder: 40,
    isActive: true,
    config: { source: "bestsellers", limit: 8, layout: "grid", ctaLabel: "Tümünü gör", ctaHref: "/kategori/kadin" },
  },
  {
    type: "promo",
    title: "Yeni sezon dantel serisi",
    subtitle: null,
    sortOrder: 50,
    isActive: true,
    config: {
      eyebrow: "Yeni geldi",
      text: "İnce dantel, esnek destek, gün boyu konfor.",
      buttonLabel: "Koleksiyonu keşfet",
      buttonUrl: "/kategori/kadin",
      theme: "light",
      align: "left",
      overlay: 30,
      layout: "full",
    },
  },
  {
    type: "products",
    title: "İndirimdekiler",
    subtitle: null,
    sortOrder: 60,
    isActive: true,
    config: { source: "discounted", limit: 8, layout: "rail", ctaLabel: "Tüm indirimler", ctaHref: "/indirimli", background: "soft" },
  },
  {
    type: "products",
    title: "Yeni gelenler",
    subtitle: null,
    sortOrder: 70,
    isActive: true,
    config: { source: "new", limit: 8, layout: "grid" },
  },
  {
    type: "newsletter",
    title: "Önce sen haberdar ol",
    subtitle: "Yeni koleksiyon ve kampanyalardan ilk sen haberdar ol. İstediğin an çıkabilirsin.",
    sortOrder: 80,
    isActive: true,
    config: { buttonLabel: "Kaydol", background: "soft" },
  },
];

