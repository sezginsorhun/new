/**
 * SİTE AYARLARI — okuma/yazma yardımcıları
 * Varsayılanlar: src/lib/default-settings.ts
 */

import "server-only";
import { cache } from "react";
import { unstable_cache, updateTag } from "next/cache";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { sql } from "drizzle-orm";
import { DEFAULT_SETTINGS, type SettingKey } from "@/lib/default-settings";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";

export { DEFAULT_SETTINGS };
export type { SettingKey };

/**
 * Tüm ayarları varsayılanlarla birleştirerek getirir.
 *
 * Bu veri her sayfada header ve footer tarafından isteniyor; sayfa başına
 * tek sorgu çalışsın diye `cache` ile, istekler arasında da tekrar tekrar
 * sorulmasın diye `unstable_cache` ile sarmalandı. Panelden ayar
 * kaydedildiğinde etiket geçersiz kılınır (bkz. setSetting).
 */
const readSettings = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const rows = await db.select().from(settings);
    const map: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) map[row.key] = row.value;
    return map;
  },
  ["ayarlar"],
  { revalidate: CACHE_TTL, tags: [CACHE_TAGS.settings] },
);

export const getSettings = cache(readSettings);

export async function getSetting(key: SettingKey | string): Promise<string> {
  // Tek tek sormak yerine önbellekli tam listeden okur: ayrı bir sorgu açmaz.
  const all = await getSettings();
  return all[key] ?? (DEFAULT_SETTINGS as Record<string, string>)[key] ?? "";
}

export async function getNumericSetting(key: SettingKey | string): Promise<number> {
  const n = Number(await getSetting(key));
  return Number.isFinite(n) ? n : 0;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onDuplicateKeyUpdate({
      set: { value, updatedAt: sql`now()` },
    });
  // Değişiklik anında görünsün. updateTag yalnızca sunucu eylemi içinden
  // çalışır; seed gibi başka yerlerden çağrıldığında sessizce atlanır ve
  // kısa TTL zaten iki dakikada toparlar.
  try {
    updateTag(CACHE_TAGS.settings);
  } catch {
    /* sunucu eylemi dışında çağrıldı — sorun değil */
  }
}

export async function setSettings(entries: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    await setSetting(key, value);
  }
}
