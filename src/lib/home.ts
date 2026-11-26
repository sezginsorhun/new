/**
 * ANA SAYFA BÖLÜM SİSTEMİ — veritabanı işlemleri
 *
 * Ana sayfada görünen her blok veritabanında bir satırdır (home_sections).
 * Panelden sırası değiştirilebilir, kapatılabilir, ayarları düzenlenebilir.
 * Kodda sabitlenmiş hiçbir bölüm yoktur — buradaki VARSAYILANLAR sadece
 * veritabanı boşken ilk kurulumda kullanılır.
 *
 * Tipler ve panel sabitleri src/lib/home-config.ts dosyasındadır.
 */

import { refreshSection } from "@/lib/legacy-copy";
import { isCardPaymentAvailable } from "@/lib/payment";
import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { homeSections } from "@/db/schema";
import {
  DEFAULT_SECTIONS,
  type HomeSection,
  type SectionConfig,
  type SectionType,
} from "@/lib/home-config";

export * from "@/lib/home-config";

/* -------------------------------- OKUMA --------------------------------- */

function normalize(row: typeof homeSections.$inferSelect): HomeSection {
  return {
    id: row.id,
    type: row.type as SectionType,
    title: row.title,
    subtitle: row.subtitle,
    config: (row.config ?? {}) as SectionConfig,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

/** Vitrin için: sadece yayındaki bölümler, sıralı. */
export async function getActiveSections(): Promise<HomeSection[]> {
  const all = await db.select().from(homeSections).orderBy(asc(homeSections.sortOrder));
  // Kurulumdan kalan demo metinleri ve kırık bağlantılar vitrinde güncellenir.
  const cardPayments = isCardPaymentAvailable();
  const sections = all
    .filter((row) => row.isActive)
    .map((row) => {
      const section = normalize(row);
      return refreshSection(
        { ...section, config: section.config as Record<string, unknown> },
        { cardPayments },
      ) as unknown as HomeSection;
    });

  /*
   * KOLEKSİYON KUTULARI — panelde hiç "Koleksiyon kutuları" bölümü yoksa
   * iki grup kendiliğinden araya yerleşir: kategorilerden sonra "Çok
   * satanlar / Yeni ürünler", ilk ürün listesinden sonra "Kadınlar /
   * Erkekler / Çiftler için". Panelden bir koleksiyon bölümü eklendiği
   * (ya da eklenip kapatıldığı) anda bu otomatik yerleşim devre dışı kalır.
   */
  if (!all.some((row) => row.type === "collections")) {
    const virtual = (id: string, collections: SectionConfig["collections"]): HomeSection => ({
      id,
      type: "collections",
      title: null,
      subtitle: null,
      config: { collections },
      sortOrder: 0,
      isActive: true,
    });
    const after = (type: string, fallback: number) => {
      const index = sections.findIndex((section) => section.type === type);
      return index >= 0 ? index + 1 : Math.min(fallback, sections.length);
    };
    sections.splice(after("categories", 2), 0, virtual("auto-collections-1", ["bestsellers", "new"]));
    sections.splice(after("products", sections.length), 0, virtual("auto-collections-2", ["women", "men", "couples"]));
  }
  return sections;
}

/** Panel için: kapalı olanlar dahil hepsi. */
export async function getAllSections(): Promise<HomeSection[]> {
  const rows = await db.select().from(homeSections).orderBy(asc(homeSections.sortOrder));
  return rows.map(normalize);
}

/** Veritabanı boşsa varsayılan düzeni bir kez yazar. */
export async function ensureDefaultSections(): Promise<void> {
  const existing = await db.select({ id: homeSections.id }).from(homeSections).limit(1);
  if (existing.length) return;
  await db.insert(homeSections).values(
    DEFAULT_SECTIONS.map((section) => ({
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      config: section.config,
      sortOrder: section.sortOrder,
      isActive: section.isActive,
    })),
  );
}
