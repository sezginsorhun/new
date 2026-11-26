/**
 * KURULUMDAN KALAN DEMO METİNLERİ — okunurken güncellenir
 *
 * Mağaza önce bir iç giyim demosu olarak kuruldu. Panelden görselleri
 * değiştirilen slaytlarda ve bölümlerde o demonun metinleri ("Pamuklu
 * Konfor Serisi", "Yeni sezon dantel serisi"…) kaldı; bir vibratör
 * görselinin üstünde "nefes alan sertifikalı kumaş" yazması mağazayı sahte
 * gösterir. Ayrıca demo, artık gizlenen /kategori/kadin gibi adreslere
 * bağlantı veriyordu (404).
 *
 * Burada yalnızca BİREBİR bilinen demo metinleri ve adresleri değişir.
 * Panelden yazılmış metne dokunulmaz. Veritabanına yazılmaz: panelde
 * kaydettiğin anda senin metnin geçerli olur.
 */

/** Eski demo kategori adresleri → bugünkü karşılıkları */
const LINK_MAP: Record<string, string> = {
  "/kategori/kadin": "/kategori/kadin-oyuncaklari",
  "/kategori/erkek": "/kategori/erkek-oyuncaklari",
  "/kategori/plaj": "/kategori/cinsel-saglik",
  "/kategori/sutyen": "/kategori/kadin-oyuncaklari",
  "/kategori/kulot": "/kategori/kadin-oyuncaklari",
  "/kategori/boxer": "/kategori/erkek-oyuncaklari",
  "/sayfa/beden-rehberi": "/sayfa/sss",
};

export function fixLegacyLink(url: string | null | undefined): string | null {
  if (!url) return url ?? null;
  const [path, rest = ""] = url.split(/(?=[?#])/);
  const mapped = LINK_MAP[path.replace(/\/$/, "")];
  return mapped ? mapped + rest : url;
}

type SlideCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageAlt: string;
  linkUrl: string;
  buttonLabel: string;
  secondaryLabel: string | null;
  secondaryUrl: string | null;
};

/** Demo slayt başlığı → yeni metin */
const SLIDE_COPY: Record<string, SlideCopy> = {
  "Dantel Koleksiyonu": {
    eyebrow: "Kadınlar için",
    title: "Kendini keşfet",
    subtitle: "Emişli, rabbit ve mini vibratörlerde orijinal ürün, gizli paketle.",
    imageAlt: "Kadın oyuncakları",
    linkUrl: "/kategori/kadin-oyuncaklari",
    buttonLabel: "Ürünleri incele",
    secondaryLabel: "İndirimdekiler",
    secondaryUrl: "/indirimli",
  },
  "Pamuklu Konfor Serisi": {
    eyebrow: "Cinsel sağlık",
    title: "Güvenle, gizlilikle",
    subtitle: "Kayganlaştırıcı, prezervatif ve bakım ürünleri; içeriği belli olmayan pakette.",
    imageAlt: "Cinsel sağlık ürünleri",
    linkUrl: "/kategori/cinsel-saglik",
    buttonLabel: "Ürünleri gör",
    secondaryLabel: null,
    secondaryUrl: null,
  },
  "Erkek İç Giyim": {
    eyebrow: "Erkekler için",
    title: "Yeni nesil mastürbatörler",
    subtitle: "Realistik, titreşimli ve otomatik modeller; düz kolide gizli gönderim.",
    imageAlt: "Erkek oyuncakları",
    linkUrl: "/kategori/erkek-oyuncaklari",
    buttonLabel: "Keşfet",
    secondaryLabel: null,
    secondaryUrl: null,
  },
};

type BannerLike = {
  title: string | null;
  eyebrow: string | null;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string | null;
  linkUrl: string | null;
  buttonLabel: string | null;
  secondaryLabel: string | null;
  secondaryUrl: string | null;
};

/** Kodla çizilmiş demo görseli (pastel dalgalar) */
export function isPlaceholderImage(url: string | null | undefined): boolean {
  return !url || /\/images\/(banners|products|categories)\/[^/]+\.svg$/.test(url);
}

export function refreshBanner<T extends BannerLike>(banner: T): T | null {
  // Görseli hâlâ demo çizimi olan slayt hiç gösterilmez.
  if (isPlaceholderImage(banner.imageUrl)) return null;
  const copy = banner.title ? SLIDE_COPY[banner.title.trim()] : undefined;
  const next = copy ? { ...banner, ...copy } : { ...banner };
  next.linkUrl = fixLegacyLink(next.linkUrl);
  next.secondaryUrl = fixLegacyLink(next.secondaryUrl);
  return next;
}

/* ----------------------------- ana sayfa bölümleri ----------------------- */

type Usp = { icon?: string; title?: string; text?: string };

const USP_COPY: Record<string, (cardPayments: boolean) => Usp> = {
  // "Koşulsuz değişim" bu ürünlerde hukuken doğru değil: ambalajı açılmış
  // cinsel sağlık ürünlerinde cayma hakkı yoktur (Mesafeli Söz. Yön. m.15).
  "14 gün iade|Koşulsuz değişim hakkı": () => ({
    icon: "refresh",
    title: "14 gün iade",
    text: "Ambalajı açılmamış ürünlerde",
  }),
  "Gizli paket|İsimsiz, nötr kutuda gönderim": () => ({
    icon: "shield",
    title: "Gizli paket",
    text: "Düz koli, ürün adı yazmayan fiş",
  }),
  "Güvenli ödeme|3D Secure ile korumalı": (cardPayments) =>
    cardPayments
      ? { icon: "lock", title: "Güvenli ödeme", text: "3D Secure ile korumalı" }
      : { icon: "lock", title: "Güvenli alışveriş", text: "SSL ile şifreli bağlantı" },
};

const PROMO_COPY: Record<string, { title: string; config: Record<string, unknown> }> = {
  "Yeni sezon dantel serisi": {
    title: "Birlikte keşfedin",
    config: {
      eyebrow: "Çiftler için",
      text: "Masaj yağlarından erotik oyunlara, birlikte deneyebileceğiniz ürünler.",
      buttonLabel: "Çift ürünleri",
      buttonUrl: "/kategori/cift-urunleri",
    },
  },
};

type SectionLike = {
  type: string;
  title: string | null;
  config: Record<string, unknown>;
};

export function refreshSection<T extends SectionLike>(section: T, opts: { cardPayments: boolean }): T {
  const config = { ...section.config };
  let title = section.title;

  for (const key of ["ctaHref", "buttonUrl", "secondaryUrl"]) {
    if (typeof config[key] === "string") config[key] = fixLegacyLink(config[key] as string);
  }

  if (section.type === "usp" && Array.isArray(config.items)) {
    config.items = (config.items as Usp[]).map((item) => {
      const replace = USP_COPY[`${item.title ?? ""}|${item.text ?? ""}`];
      return replace ? replace(opts.cardPayments) : item;
    });
  }

  // Kodla çizilmiş demo görseli olan bant görselsiz gösterilir (marka gradyanı).
  if (section.type === "promo") {
    if (isPlaceholderImage(config.imageUrl as string | undefined)) delete config.imageUrl;
    if (config.mobileImageUrl && isPlaceholderImage(config.mobileImageUrl as string)) delete config.mobileImageUrl;
  }

  if (section.type === "promo" && title && PROMO_COPY[title.trim()]) {
    const copy = PROMO_COPY[title.trim()];
    title = copy.title;
    Object.assign(config, copy.config);
  }

  return { ...section, title, config };
}
