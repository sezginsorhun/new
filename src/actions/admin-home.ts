"use server";

/**
 * ANA SAYFA YÖNETİMİ
 * Bölümler (sıra/aç-kapat/ayar), carousel slaytları ve medya kütüphanesi.
 * Her işlem requireAdmin() ile korunur ve denetim kaydına yazılır.
 */

import { revalidatePath, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { createId } from "@/lib/id";
import { banners, homeSections, mediaAssets } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin, safeUrl } from "@/lib/security";
import type { SectionConfig, SectionType } from "@/lib/home";

export type ContentState = { ok: boolean; message: string } | null;

function refreshStorefront() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/anasayfa");
  revalidatePath("/admin/bannerlar");
  // Ana sayfa bölümleri ve carousel slaytları önbellekli; panelden
  // değişiklik yapılır yapılmaz vitrinde görünsün.
  updateTag(CACHE_TAGS.home);
}

/* ========================================================================== */
/*  BÖLÜMLER                                                                  */
/* ========================================================================== */

const SECTION_TYPES = [
  "hero", "usp", "categories", "products", "promo", "richtext", "newsletter",
] as const;

export async function addSectionAction(type: string): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  if (!SECTION_TYPES.includes(type as (typeof SECTION_TYPES)[number])) {
    return { ok: false, message: "Geçersiz bölüm tipi." };
  }

  const [last] = await db
    .select({ max: sql<number>`coalesce(max(${homeSections.sortOrder}), 0)` })
    .from(homeSections);

  const defaults: Record<string, { title: string | null; config: SectionConfig }> = {
    hero: { title: null, config: { position: "home_hero", autoplayMs: 6000, showArrows: true, showDots: true, height: "tall" } },
    usp: { title: null, config: { items: [{ icon: "truck", title: "Ücretsiz kargo", text: "Belirlenen tutar üzeri" }] } },
    categories: { title: "Kategoriler", config: { source: "children", limit: 6, columns: 6, shape: "portrait" } },
    products: { title: "Ürünler", config: { source: "featured", limit: 8, layout: "grid" } },
    promo: { title: "Yeni kampanya", config: { theme: "light", align: "left", overlay: 30, layout: "full" } },
    richtext: { title: "Başlık", config: { maxWidth: 720 } },
    newsletter: { title: "Önce sen haberdar ol", config: { background: "soft" } },
  };

  const createdId = createId();
  await db
    .insert(homeSections)
    .values({
      id: createdId,
      type,
      title: defaults[type].title,
      config: defaults[type].config,
      sortOrder: (last?.max ?? 0) + 10,
      isActive: false, // önce ayarla, sonra yayına al
    });
  const created = { id: createdId };

  await logAudit({
    action: "section.update",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "home_section",
    entityId: created.id,
    summary: `Yeni "${type}" bölümü eklendi`,
  });

  refreshStorefront();
  return { ok: true, message: "Bölüm eklendi. Ayarlarını düzenleyip yayına al." };
}

export async function deleteSectionAction(id: string): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.delete(homeSections).where(eq(homeSections.id, id));
  await logAudit({
    action: "section.update",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "home_section",
    entityId: id,
    summary: "Bölüm silindi",
  });
  refreshStorefront();
  return { ok: true, message: "Bölüm silindi." };
}

export async function toggleSectionAction(id: string, isActive: boolean): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db
    .update(homeSections)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(homeSections.id, id));
  await logAudit({
    action: "section.update",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "home_section",
    entityId: id,
    summary: isActive ? "Bölüm yayına alındı" : "Bölüm yayından kaldırıldı",
  });
  refreshStorefront();
  return { ok: true, message: isActive ? "Bölüm yayında." : "Bölüm gizlendi." };
}

/** Bölümü bir sıra yukarı/aşağı taşır. */
export async function moveSectionAction(id: string, direction: "up" | "down"): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  const rows = await db.select().from(homeSections).orderBy(asc(homeSections.sortOrder));
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return { ok: false, message: "Bölüm bulunamadı." };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return { ok: true, message: "" };

  // Sıraları takas et
  await db.transaction(async (tx) => {
    await tx
      .update(homeSections)
      .set({ sortOrder: rows[target].sortOrder })
      .where(eq(homeSections.id, rows[index].id));
    await tx
      .update(homeSections)
      .set({ sortOrder: rows[index].sortOrder })
      .where(eq(homeSections.id, rows[target].id));
  });

  await logAudit({
    action: "section.update",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "home_section",
    entityId: id,
    summary: `Bölüm ${direction === "up" ? "yukarı" : "aşağı"} taşındı`,
  });
  refreshStorefront();
  return { ok: true, message: "Sıra güncellendi." };
}

/** Bölümün başlığı ve ayarlarını kaydeder. */
export async function saveSectionAction(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Bölüm bulunamadı." };

  const [current] = await db.select().from(homeSections).where(eq(homeSections.id, id)).limit(1);
  if (!current) return { ok: false, message: "Bölüm bulunamadı." };

  const type = current.type as SectionType;
  const config: SectionConfig = { ...((current.config ?? {}) as SectionConfig) };

  const str = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v.trim() : "";
  };
  const num = (key: string, fallback: number) => {
    const v = Number(str(key));
    return Number.isFinite(v) ? v : fallback;
  };
  const bool = (key: string) => formData.get(key) === "on";

  switch (type) {
    case "hero":
      config.position = str("position") || "home_hero";
      config.autoplayMs = Math.min(Math.max(num("autoplayMs", 6000), 0), 30000);
      config.showArrows = bool("showArrows");
      config.showDots = bool("showDots");
      config.height = (str("height") || "tall") as SectionConfig["height"];
      break;

    case "usp": {
      const items = [];
      for (let i = 0; i < 6; i++) {
        const title = str(`usp_title_${i}`);
        if (!title) continue;
        items.push({ icon: str(`usp_icon_${i}`) || "shield", title, text: str(`usp_text_${i}`) });
      }
      config.items = items;
      break;
    }

    case "categories":
      config.source = (str("source") || "children") as SectionConfig["source"];
      config.limit = Math.min(Math.max(num("limit", 6), 1), 24);
      config.columns = num("columns", 6);
      config.shape = (str("shape") || "portrait") as SectionConfig["shape"];
      config.ctaLabel = str("ctaLabel") || undefined;
      config.ctaHref = safeUrl(str("ctaHref")) ?? undefined;
      config.background = (str("background") || "white") as SectionConfig["background"];
      break;

    case "products":
      config.source = (str("source") || "featured") as SectionConfig["source"];
      config.categorySlug = str("categorySlug") || undefined;
      config.limit = Math.min(Math.max(num("limit", 8), 2), 24);
      config.layout = (str("layout") || "grid") as SectionConfig["layout"];
      config.ctaLabel = str("ctaLabel") || undefined;
      config.ctaHref = safeUrl(str("ctaHref")) ?? undefined;
      config.background = (str("background") || "white") as SectionConfig["background"];
      break;

    case "promo":
      config.imageUrl = safeUrl(str("imageUrl")) ?? undefined;
      config.mobileImageUrl = safeUrl(str("mobileImageUrl")) ?? undefined;
      config.eyebrow = str("eyebrow") || undefined;
      config.text = str("text") || undefined;
      config.buttonLabel = str("buttonLabel") || undefined;
      config.buttonUrl = safeUrl(str("buttonUrl")) ?? undefined;
      config.theme = (str("theme") || "light") as SectionConfig["theme"];
      config.align = (str("align") || "left") as SectionConfig["align"];
      config.overlay = Math.min(Math.max(num("overlay", 30), 0), 80);
      config.layout = (str("layout") || "full") as SectionConfig["layout"];
      break;

    case "richtext":
      config.eyebrow = str("eyebrow") || undefined;
      config.buttonLabel = str("buttonLabel") || undefined;
      config.buttonUrl = safeUrl(str("buttonUrl")) ?? undefined;
      config.maxWidth = Math.min(Math.max(num("maxWidth", 720), 360), 1200);
      config.background = (str("background") || "white") as SectionConfig["background"];
      break;

    case "newsletter":
      config.background = (str("background") || "soft") as SectionConfig["background"];
      break;
  }

  await db
    .update(homeSections)
    .set({
      title: str("title") || null,
      subtitle: str("subtitle") || null,
      config,
      updatedAt: new Date(),
    })
    .where(eq(homeSections.id, id));

  await logAudit({
    action: "section.update",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "home_section",
    entityId: id,
    summary: `"${str("title") || type}" bölümü güncellendi`,
  });

  refreshStorefront();
  return { ok: true, message: "Bölüm kaydedildi." };
}

/* ========================================================================== */
/*  CAROUSEL SLAYTLARI                                                        */
/* ========================================================================== */

const slideSchema = z.object({
  imageUrl: z.string().trim().min(1, "Slayt görseli zorunlu."),
  mobileImageUrl: z.string().trim().optional(),
  imageAlt: z.string().trim().max(250).optional(),
  eyebrow: z.string().trim().max(80).optional(),
  title: z.string().trim().max(200).optional(),
  subtitle: z.string().trim().max(250).optional(),
  linkUrl: z.string().trim().optional(),
  buttonLabel: z.string().trim().max(60).optional(),
  secondaryLabel: z.string().trim().max(60).optional(),
  secondaryUrl: z.string().trim().optional(),
  align: z.enum(["left", "center", "right"]).default("left"),
  theme: z.enum(["light", "dark"]).default("light"),
  overlay: z.coerce.number().min(0).max(80).default(25),
  position: z.string().trim().default("home_hero"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
});

export async function saveSlideAction(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  const parsed = slideSchema.safeParse({
    imageUrl: formData.get("imageUrl") ?? "",
    mobileImageUrl: formData.get("mobileImageUrl") ?? "",
    imageAlt: formData.get("imageAlt") ?? "",
    eyebrow: formData.get("eyebrow") ?? "",
    title: formData.get("title") ?? "",
    subtitle: formData.get("subtitle") ?? "",
    linkUrl: formData.get("linkUrl") ?? "",
    buttonLabel: formData.get("buttonLabel") ?? "",
    secondaryLabel: formData.get("secondaryLabel") ?? "",
    secondaryUrl: formData.get("secondaryUrl") ?? "",
    align: formData.get("align") ?? "left",
    theme: formData.get("theme") ?? "light",
    overlay: formData.get("overlay") ?? 25,
    position: formData.get("position") ?? "home_hero",
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") === "on",
    startsAt: formData.get("startsAt") ?? "",
    endsAt: formData.get("endsAt") ?? "",
  });

  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const image = safeUrl(parsed.data.imageUrl);
  if (!image) return { ok: false, message: "Görsel adresi geçersiz." };

  const values = {
    imageUrl: image,
    mobileImageUrl: safeUrl(parsed.data.mobileImageUrl ?? "") ?? null,
    imageAlt: parsed.data.imageAlt || null,
    eyebrow: parsed.data.eyebrow || null,
    title: parsed.data.title || null,
    subtitle: parsed.data.subtitle || null,
    linkUrl: safeUrl(parsed.data.linkUrl ?? "") ?? null,
    buttonLabel: parsed.data.buttonLabel || null,
    secondaryLabel: parsed.data.secondaryLabel || null,
    secondaryUrl: safeUrl(parsed.data.secondaryUrl ?? "") ?? null,
    align: parsed.data.align,
    theme: parsed.data.theme,
    overlay: parsed.data.overlay,
    position: parsed.data.position || "home_hero",
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
    startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    updatedAt: new Date(),
  };

  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.update(banners).set(values).where(eq(banners.id, id));
  } else {
    await db.insert(banners).values(values);
  }

  await logAudit({
    action: id ? "banner.update" : "banner.create",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "banner",
    entityId: id || undefined,
    summary: `Slayt: ${values.title ?? values.imageUrl}`,
  });

  refreshStorefront();
  return { ok: true, message: "Slayt kaydedildi." };
}

export async function deleteSlideAction(id: string): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.delete(banners).where(eq(banners.id, id));
  await logAudit({
    action: "banner.delete",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "banner",
    entityId: id,
  });
  refreshStorefront();
  return { ok: true, message: "Slayt silindi." };
}

export async function toggleSlideAction(id: string, isActive: boolean): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.update(banners).set({ isActive, updatedAt: new Date() }).where(eq(banners.id, id));
  await logAudit({
    action: "banner.update",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "banner",
    entityId: id,
    summary: isActive ? "Slayt yayına alındı" : "Slayt gizlendi",
  });
  refreshStorefront();
  return { ok: true, message: isActive ? "Slayt yayında." : "Slayt gizlendi." };
}

export async function moveSlideAction(id: string, direction: "up" | "down"): Promise<ContentState> {
  await assertSameOrigin();
  await requireAdmin();

  const [current] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!current) return { ok: false, message: "Slayt bulunamadı." };

  const rows = await db
    .select()
    .from(banners)
    .where(eq(banners.position, current.position))
    .orderBy(asc(banners.sortOrder));

  const index = rows.findIndex((row) => row.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return { ok: true, message: "" };

  await db.transaction(async (tx) => {
    await tx.update(banners).set({ sortOrder: rows[target].sortOrder }).where(eq(banners.id, rows[index].id));
    await tx.update(banners).set({ sortOrder: rows[index].sortOrder }).where(eq(banners.id, rows[target].id));
  });

  refreshStorefront();
  return { ok: true, message: "Sıra güncellendi." };
}

/* ========================================================================== */
/*  MEDYA KÜTÜPHANESİ                                                         */
/* ========================================================================== */

export async function deleteMediaAction(id: string): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();
  const [asset] = await db
    .select({ fileName: mediaAssets.fileName, storage: mediaAssets.storage })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!asset) return { ok: false, message: "Görsel bulunamadı." };

  // Veritabanı sürücüsünde kayıt silinince görsel de gider.
  // Dosya sürücüsünde kayıt silinir, dosya diskte kalır (başka bir yerde
  // kullanılıyor olabilir).
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  await logAudit({
    action: "media.delete",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "media",
    entityId: id,
    summary: asset.fileName,
  });
  revalidatePath("/admin/medya");
  return { ok: true, message: "Görsel kütüphaneden kaldırıldı." };
}

export async function updateMediaAltAction(id: string, alt: string): Promise<ContentState> {
  await assertSameOrigin();
  await requireAdmin();
  await db
    .update(mediaAssets)
    .set({ alt: alt.slice(0, 250) || null })
    .where(eq(mediaAssets.id, id));
  revalidatePath("/admin/medya");
  return { ok: true, message: "Açıklama kaydedildi." };
}
