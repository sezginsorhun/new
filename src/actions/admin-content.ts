"use server";

import { revalidatePath, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  categories,
  contactMessages,
  coupons,
  pages,
  reviews,
  users,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/security";
import { setSettings } from "@/lib/settings";
import { slugify } from "@/lib/utils";
import { parsePrice } from "@/lib/money";

export type ContentState = { ok: boolean; message: string } | null;

/* ----------------------------- KATEGORİ --------------------------------- */

const categorySchema = z.object({
  name: z.string().trim().min(2, "Kategori adı gir."),
  slug: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  showInMenu: z.boolean().default(true),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
});

export async function saveCategoryAction(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    parentId: formData.get("parentId") || undefined,
    description: formData.get("description") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") === "on",
    showInMenu: formData.get("showInMenu") === "on",
    metaTitle: formData.get("metaTitle") || undefined,
    metaDescription: formData.get("metaDescription") || undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const id = (formData.get("id") as string) || null;
  const values = {
    name: parsed.data.name,
    slug: parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name),
    parentId: parsed.data.parentId && parsed.data.parentId !== "" ? parsed.data.parentId : null,
    description: parsed.data.description ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
    showInMenu: parsed.data.showInMenu,
    metaTitle: parsed.data.metaTitle ?? null,
    metaDescription: parsed.data.metaDescription ?? null,
  };

  if (id && values.parentId === id) {
    return { ok: false, message: "Bir kategori kendisinin altına alınamaz." };
  }

  try {
    if (id) await db.update(categories).set(values).where(eq(categories.id, id));
    else await db.insert(categories).values(values);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("categories_slug_uq")) {
      return { ok: false, message: "Bu URL (slug) başka bir kategoride kullanılıyor." };
    }
    return { ok: false, message: "Kaydedilemedi: " + message.slice(0, 150) };
  }

  await logAudit({ action: id ? "category.update" : "category.create", userId: admin.id,
    actorEmail: admin.email, entity: "category", entityId: id ?? undefined, summary: values.name });
  revalidatePath("/admin/kategoriler");
  updateTag(CACHE_TAGS.catalog);
  revalidatePath("/", "layout");
  return { ok: true, message: "Kategori kaydedildi." };
}

export async function deleteCategoryAction(id: string) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  await logAudit({ action: "category.delete", userId: admin.id, actorEmail: admin.email,
    entity: "category", entityId: id });
  revalidatePath("/admin/kategoriler");
  revalidatePath("/", "layout");
  updateTag(CACHE_TAGS.catalog);
  return { ok: true };
}

/* ------------------------------- KUPON ---------------------------------- */

const couponSchema = z.object({
  code: z.string().trim().min(3, "Kupon kodu en az 3 karakter olmalı."),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.string().default("0"),
  minOrderTotal: z.string().optional(),
  maxDiscount: z.string().optional(),
  usageLimit: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function saveCouponAction(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value") ?? "0",
    minOrderTotal: formData.get("minOrderTotal") || undefined,
    maxDiscount: formData.get("maxDiscount") || undefined,
    usageLimit: formData.get("usageLimit") || undefined,
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  // PERCENT: 10 = %10 (yüzde olarak saklanır)
  // FIXED: kuruşa çevrilir
  const value =
    parsed.data.type === "PERCENT"
      ? Math.min(Math.max(Number(parsed.data.value) || 0, 0), 100)
      : parsed.data.type === "FIXED"
        ? parsePrice(parsed.data.value)
        : 0;

  if (parsed.data.type !== "FREE_SHIPPING" && value <= 0) {
    return { ok: false, message: "İndirim değeri sıfırdan büyük olmalı." };
  }

  const values = {
    code: parsed.data.code.trim().toUpperCase(),
    type: parsed.data.type,
    value,
    minOrderTotal: parsed.data.minOrderTotal ? parsePrice(parsed.data.minOrderTotal) : 0,
    maxDiscount: parsed.data.maxDiscount ? parsePrice(parsed.data.maxDiscount) : null,
    usageLimit: parsed.data.usageLimit ? Number(parsed.data.usageLimit) : null,
    startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
    isActive: parsed.data.isActive,
  };

  const id = (formData.get("id") as string) || null;

  try {
    if (id) await db.update(coupons).set(values).where(eq(coupons.id, id));
    else await db.insert(coupons).values(values);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("coupons_code_uq")) {
      return { ok: false, message: "Bu kupon kodu zaten var." };
    }
    return { ok: false, message: "Kaydedilemedi: " + message.slice(0, 150) };
  }

  await logAudit({ action: id ? "coupon.update" : "coupon.create", userId: admin.id,
    actorEmail: admin.email, entity: "coupon", entityId: id ?? undefined, summary: values.code });
  revalidatePath("/admin/kuponlar");
  return { ok: true, message: "Kupon kaydedildi." };
}

export async function deleteCouponAction(id: string) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.delete(coupons).where(eq(coupons.id, id));
  await logAudit({ action: "coupon.delete", userId: admin.id, actorEmail: admin.email,
    entity: "coupon", entityId: id });
  revalidatePath("/admin/kuponlar");
  return { ok: true };
}

/* ------------------------------- SAYFA ---------------------------------- */

export async function savePageAction(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (title.length < 2) return { ok: false, message: "Sayfa başlığı gir." };
  if (content.length < 10) return { ok: false, message: "Sayfa içeriği çok kısa." };

  const slugInput = String(formData.get("slug") ?? "").trim();
  const values = {
    title,
    slug: slugInput ? slugify(slugInput) : slugify(title),
    content,
    isActive: formData.get("isActive") === "on",
    updatedAt: new Date(),
  };

  const id = (formData.get("id") as string) || null;

  try {
    if (id) await db.update(pages).set(values).where(eq(pages.id, id));
    else await db.insert(pages).values(values);
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("pages_slug_uq")) {
      return { ok: false, message: "Bu URL (slug) başka bir sayfada kullanılıyor." };
    }
    return { ok: false, message: "Kaydedilemedi: " + message.slice(0, 150) };
  }

  await logAudit({ action: "page.update", userId: admin.id, actorEmail: admin.email,
    entity: "page", entityId: id ?? undefined, summary: values.title });
  revalidatePath("/admin/sayfalar");
  revalidatePath(`/sayfa/${values.slug}`);
  return { ok: true, message: "Sayfa kaydedildi." };
}

export async function deletePageAction(id: string) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.delete(pages).where(eq(pages.id, id));
  revalidatePath("/admin/sayfalar");
  return { ok: true };
}

/* ------------------------------- YORUM ---------------------------------- */

export async function approveReviewAction(id: string, approved: boolean) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.update(reviews).set({ isApproved: approved }).where(eq(reviews.id, id));
  await logAudit({ action: "review.moderate", userId: admin.id, actorEmail: admin.email,
    entity: "review", entityId: id, summary: approved ? "Yorum onaylandı" : "Yorum onayı kaldırıldı" });
  revalidatePath("/admin/yorumlar");
  return { ok: true };
}

export async function deleteReviewAction(id: string) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.delete(reviews).where(eq(reviews.id, id));
  revalidatePath("/admin/yorumlar");
  return { ok: true };
}

/* ------------------------------ MESAJ ----------------------------------- */

export async function markMessageReadAction(id: number, isRead: boolean) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.update(contactMessages).set({ isRead }).where(eq(contactMessages.id, id));
  revalidatePath("/admin/mesajlar");
  return { ok: true };
}

export async function deleteMessageAction(id: number) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  revalidatePath("/admin/mesajlar");
  return { ok: true };
}

/* ------------------------------ MÜŞTERİ --------------------------------- */

export async function toggleCustomerActiveAction(id: string, isActive: boolean) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.update(users).set({ isActive }).where(eq(users.id, id));
  await logAudit({ action: "customer.update", userId: admin.id, actorEmail: admin.email,
    entity: "user", entityId: id, summary: isActive ? "Hesap açıldı" : "Hesap kapatıldı" });
  revalidatePath("/admin/musteriler");
  return { ok: true };
}

/* ------------------------------ AYARLAR --------------------------------- */

const MONEY_KEYS = ["shipping_fee", "free_shipping_threshold", "cod_fee"];

export async function saveSettingsAction(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  const entries: Record<string, string> = {};

  for (const [key, raw] of formData.entries()) {
    if (typeof raw !== "string") continue;
    if (key.startsWith("$")) continue; // Next.js dahili alanları

    if (MONEY_KEYS.includes(key)) {
      entries[key] = String(parsePrice(raw));
    } else if (key.startsWith("payment_") || key === "announce_enabled") {
      entries[key] = raw === "on" ? "1" : "0";
    } else {
      entries[key] = raw;
    }
  }

  // İşaretlenmeyen checkbox'lar formData'da hiç gelmez; kapalı olarak yaz
  for (const key of [
    "payment_credit_card",
    "payment_bank_transfer",
    "payment_cod",
    "announce_enabled",
  ]) {
    if (!(key in entries)) entries[key] = "0";
  }

  await setSettings(entries);
  await logAudit({ action: "settings.update", userId: admin.id, actorEmail: admin.email,
    summary: `${Object.keys(entries).length} ayar güncellendi`, meta: { keys: Object.keys(entries) } });

  revalidatePath("/admin/ayarlar");
  revalidatePath("/", "layout");
  return { ok: true, message: "Ayarlar kaydedildi." };
}
