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
  const rows = await db
    .select()
    .from(homeSections)
    .where(eq(homeSections.isActive, true))
    .orderBy(asc(homeSections.sortOrder));
  return rows.map(normalize);
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
