/**
 * SİTE AYARLARI — okuma/yazma yardımcıları
 * Varsayılanlar: src/lib/default-settings.ts
 */

import "server-only";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { inArray, sql } from "drizzle-orm";
import { DEFAULT_SETTINGS, type SettingKey } from "@/lib/default-settings";

export { DEFAULT_SETTINGS };
export type { SettingKey };

/** Tüm ayarları varsayılanlarla birleştirerek getirir. */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function getSetting(key: SettingKey | string): Promise<string> {
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, [key]))
    .limit(1);
  return rows[0]?.value ?? (DEFAULT_SETTINGS as Record<string, string>)[key] ?? "";
}

export async function getNumericSetting(key: SettingKey | string): Promise<number> {
  const n = Number(await getSetting(key));
  return Number.isFinite(n) ? n : 0;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: sql`now()` },
    });
}

export async function setSettings(entries: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    await setSetting(key, value);
  }
}
