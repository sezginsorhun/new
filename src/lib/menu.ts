/**
 * ÜST MENÜ
 *
 * Menü, kategori ağacından OTOMATİK oluşur. Panelden yapılan düzenlemeler
 * bunun üzerine bir katman olarak uygulanır:
 *
 *   • gizle        — kategori sitede durur ama menüde görünmez
 *   • sırala       — menüdeki sıra, kategori sırasından bağımsız
 *   • yeniden adlandır — menüde farklı bir ad ("Kadın oyuncakları" → "Kadın")
 *   • özel bağlantı — kategori olmayan girdiler (İndirim, Blog, Hakkımızda)
 *
 * NEDEN BÖYLE
 * Menüyü tamamen elle yönetmek, yeni açılan bir kategorinin menüye
 * eklenmesini unutturur; müşteri o kategoriyi hiç bulamaz. Otomatik temel
 * + düzenleme katmanı, "unutma" hatasını baştan imkânsız kılar: yeni
 * kategori menüde kendiliğinden belirir, istemiyorsan gizlersin.
 *
 * SAKLAMA
 * Düzenlemeler `menu_overrides` ayarında JSON olarak durur. Ayrı bir tablo
 * açmadık: veri küçük, tek parça okunuyor ve ayarlarla aynı önbelleğe
 * giriyor.
 */

import type { CategoryNode } from "./catalog";

export type MenuOverride = {
  /** Menüde gösterilmeyecek kategori slug'ları */
  hidden?: string[];
  /** Menüdeki sıra; listede olmayan kategoriler sonda, kendi sırasıyla */
  order?: string[];
  /** slug → menüde gösterilecek ad */
  labels?: Record<string, string>;
  /** Kategori olmayan bağlantılar */
  custom?: CustomLink[];
};

export type CustomLink = {
  label: string;
  href: string;
  /** Menünün başına mı sonuna mı */
  position?: "start" | "end";
  /** Vurgulu (marka renginde) gösterilsin mi — "İndirim" gibi */
  highlight?: boolean;
};

export type MenuItem = {
  key: string;
  label: string;
  href: string;
  highlight: boolean;
  children: { label: string; href: string }[];
};

/** Ayardaki JSON'u güvenle okur. Bozuksa menü boş kalmaz, varsayılana döner. */
export function parseMenuOverride(raw: string | undefined): MenuOverride {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as MenuOverride;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Kategori ağacı + düzenlemeler → menü.
 * Saf bir işlev: veritabanına gitmez, test edilmesi kolaydır.
 */
export function buildMenu(tree: CategoryNode[], override: MenuOverride): MenuItem[] {
  const hidden = new Set(override.hidden ?? []);
  const labels = override.labels ?? {};
  const order = override.order ?? [];

  const visible = tree.filter((category) => !hidden.has(category.slug));

  /* Panelde sırası belirlenmiş olanlar önce, o sırayla; gerisi arkada. */
  const rank = (slug: string) => {
    const index = order.indexOf(slug);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  const sorted = [...visible].sort((a, b) => rank(a.slug) - rank(b.slug));

  const items: MenuItem[] = sorted.map((category) => ({
    key: category.id,
    label: labels[category.slug] || category.name,
    href: `/kategori/${category.slug}`,
    highlight: false,
    children: category.children
      .filter((child) => !hidden.has(child.slug))
      .map((child) => ({
        label: labels[child.slug] || child.name,
        href: `/kategori/${child.slug}`,
      })),
  }));

  const custom = (override.custom ?? []).filter((link) => link.label && link.href);
  const toItem = (link: CustomLink, index: number): MenuItem => ({
    key: `ozel-${index}`,
    label: link.label,
    href: link.href,
    highlight: Boolean(link.highlight),
    children: [],
  });

  return [
    ...custom.filter((l) => l.position === "start").map(toItem),
    ...items,
    ...custom.filter((l) => l.position !== "start").map(toItem),
  ];
}
