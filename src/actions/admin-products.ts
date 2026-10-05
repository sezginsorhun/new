"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { createId } from "@/lib/id";
import {
  productCategories,
  productImages,
  productVariants,
  products,
  stockMovements,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/security";
import { slugify } from "@/lib/utils";
import { parsePrice } from "@/lib/money";

export type AdminState = { ok: boolean; message: string; id?: string } | null;

/* ------------------------------ ÜRÜN ------------------------------------ */

const productSchema = z.object({
  name: z.string().trim().min(3, "Ürün adı en az 3 karakter olmalı."),
  slug: z.string().trim().optional(),
  sku: z.string().trim().min(2, "Ürün kodu (SKU) gir."),
  description: z.string().trim().default(""),
  shortDescription: z.string().trim().optional(),
  price: z.string().min(1, "Satış fiyatı gir."),
  compareAtPrice: z.string().optional(),
  costPrice: z.string().optional(),
  taxRate: z.coerce.number().int().min(0).max(50).default(10),
  material: z.string().trim().optional(),
  careInfo: z.string().trim().optional(),
  modelInfo: z.string().trim().optional(),
  weightGr: z.coerce.number().int().min(0).optional(),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

function readProductForm(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    sku: formData.get("sku"),
    description: formData.get("description") ?? "",
    shortDescription: formData.get("shortDescription") || undefined,
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    costPrice: formData.get("costPrice") || undefined,
    taxRate: formData.get("taxRate") ?? 10,
    material: formData.get("material") || undefined,
    careInfo: formData.get("careInfo") || undefined,
    modelInfo: formData.get("modelInfo") || undefined,
    weightGr: formData.get("weightGr") || undefined,
    metaTitle: formData.get("metaTitle") || undefined,
    metaDescription: formData.get("metaDescription") || undefined,
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isNew: formData.get("isNew") === "on",
  };
}

export async function saveProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  const parsed = productSchema.safeParse(readProductForm(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const id = (formData.get("id") as string) || null;
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);

  const slug = parsed.data.slug?.trim()
    ? slugify(parsed.data.slug)
    : slugify(parsed.data.name);

  const values = {
    name: parsed.data.name,
    slug,
    sku: parsed.data.sku,
    description: parsed.data.description,
    shortDescription: parsed.data.shortDescription ?? null,
    price: parsePrice(parsed.data.price),
    compareAtPrice: parsed.data.compareAtPrice
      ? parsePrice(parsed.data.compareAtPrice)
      : null,
    costPrice: parsed.data.costPrice ? parsePrice(parsed.data.costPrice) : null,
    taxRate: parsed.data.taxRate,
    material: parsed.data.material ?? null,
    careInfo: parsed.data.careInfo ?? null,
    modelInfo: parsed.data.modelInfo ?? null,
    weightGr: parsed.data.weightGr ?? null,
    metaTitle: parsed.data.metaTitle ?? null,
    metaDescription: parsed.data.metaDescription ?? null,
    isActive: parsed.data.isActive,
    isFeatured: parsed.data.isFeatured,
    isNew: parsed.data.isNew,
    updatedAt: new Date(),
  };

  if (values.price <= 0) return { ok: false, message: "Satış fiyatı sıfırdan büyük olmalı." };

  let productId = id;

  try {
    if (id) {
      await db.update(products).set(values).where(eq(products.id, id));
    } else {
      // MySQL'de RETURNING yok: kimliği önce üretiyoruz.
      productId = createId();
      await db.insert(products).values({ ...values, id: productId });
    }
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("products_slug_uq")) {
      return { ok: false, message: "Bu URL (slug) başka bir üründe kullanılıyor." };
    }
    if (message.includes("products_sku_uq")) {
      return { ok: false, message: "Bu ürün kodu (SKU) başka bir üründe kullanılıyor." };
    }
    return { ok: false, message: "Kaydedilemedi: " + message.slice(0, 160) };
  }

  // Kategori bağlantılarını yenile
  if (productId) {
    await db.delete(productCategories).where(eq(productCategories.productId, productId));
    if (categoryIds.length > 0) {
      await db
        .insert(productCategories)
        .values(categoryIds.map((categoryId) => ({ productId: productId!, categoryId })));
    }
  }

  revalidatePath("/admin/urunler");
  revalidatePath("/");
  revalidatePath(`/urun/${slug}`);

  return { ok: true, message: "Ürün kaydedildi.", id: productId ?? undefined };
}

export async function deleteProductAction(id: string) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await logAudit({ action: "product.delete", userId: admin.id, actorEmail: admin.email,
    entity: "product", entityId: id });
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/urunler");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleProductActiveAction(id: string, isActive: boolean) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await logAudit({ action: "product.update", userId: admin.id, actorEmail: admin.email,
    entity: "product", entityId: id, summary: isActive ? "Ürün yayına alındı" : "Ürün gizlendi" });
  await db.update(products).set({ isActive }).where(eq(products.id, id));
  revalidatePath("/admin/urunler");
  revalidatePath("/");
  return { ok: true };
}

/* ----------------------------- GÖRSELLER -------------------------------- */

export async function addProductImageAction(
  productId: string,
  url: string,
  colorName: string | null,
  alt: string | null,
) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  if (!url.trim()) return { ok: false, message: "Görsel adresi boş." };

  const existing = await db
    .select({ count: sql<number>`count(*)` })
    .from(productImages)
    .where(eq(productImages.productId, productId));

  await db.insert(productImages).values({
    productId,
    url: url.trim(),
    colorName: colorName?.trim() || null,
    alt: alt?.trim() || null,
    sortOrder: existing[0]?.count ?? 0,
  });

  revalidatePath(`/admin/urunler/${productId}`);
  return { ok: true, message: "Görsel eklendi." };
}

export async function deleteProductImageAction(imageId: string, productId: string) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.delete(productImages).where(eq(productImages.id, imageId));
  revalidatePath(`/admin/urunler/${productId}`);
  return { ok: true };
}

export async function reorderProductImageAction(
  imageId: string,
  productId: string,
  direction: "up" | "down",
) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(productImages.sortOrder);

  const index = images.findIndex((image) => image.id === imageId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= images.length) return { ok: false };

  await db
    .update(productImages)
    .set({ sortOrder: images[target].sortOrder })
    .where(eq(productImages.id, images[index].id));
  await db
    .update(productImages)
    .set({ sortOrder: images[index].sortOrder })
    .where(eq(productImages.id, images[target].id));

  revalidatePath(`/admin/urunler/${productId}`);
  return { ok: true };
}

/* ------------------------------ VARYANT --------------------------------- */

const variantSchema = z.object({
  size: z.string().trim().min(1, "Beden gir."),
  colorName: z.string().trim().min(1, "Renk adı gir."),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Renk kodu #000000 biçiminde olmalı.")
    .default("#000000"),
  stock: z.coerce.number().int().min(0, "Stok negatif olamaz.").default(0),
  lowStockAlert: z.coerce.number().int().min(0).default(3),
  priceOverride: z.string().optional(),
  barcode: z.string().trim().optional(),
});

export async function saveVariantAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await assertSameOrigin();
  const admin = await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { ok: false, message: "Ürün bulunamadı." };

  const parsed = variantSchema.safeParse({
    size: formData.get("size"),
    colorName: formData.get("colorName"),
    colorHex: formData.get("colorHex") || "#000000",
    stock: formData.get("stock") ?? 0,
    lowStockAlert: formData.get("lowStockAlert") ?? 3,
    priceOverride: formData.get("priceOverride") || undefined,
    barcode: formData.get("barcode") || undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const variantId = (formData.get("variantId") as string) || null;

  const productRows = await db
    .select({ sku: products.sku })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  const baseSku = productRows[0]?.sku ?? "URN";

  const sku =
    (formData.get("sku") as string)?.trim() ||
    `${baseSku}-${slugify(parsed.data.colorName).slice(0, 3).toUpperCase()}-${parsed.data.size}`;

  const values = {
    productId,
    sku,
    barcode: parsed.data.barcode ?? null,
    size: parsed.data.size,
    colorName: parsed.data.colorName,
    colorHex: parsed.data.colorHex,
    stock: parsed.data.stock,
    lowStockAlert: parsed.data.lowStockAlert,
    priceOverride: parsed.data.priceOverride ? parsePrice(parsed.data.priceOverride) : null,
  };

  try {
    if (variantId) {
      const before = await db
        .select({ stock: productVariants.stock })
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);

      await db.update(productVariants).set(values).where(eq(productVariants.id, variantId));

      const diff = parsed.data.stock - (before[0]?.stock ?? 0);
      if (diff !== 0) {
        await db.insert(stockMovements).values({
          variantId,
          type: "MANUAL",
          quantity: diff,
          note: "Panelden elle düzeltme",
        });
      }
    } else {
      const newVariantId = createId();
      await db.insert(productVariants).values({ ...values, id: newVariantId });
      if (parsed.data.stock > 0) {
        await db.insert(stockMovements).values({
          variantId: newVariantId,
          type: "PURCHASE",
          quantity: parsed.data.stock,
          note: "İlk stok girişi",
        });
      }
    }
  } catch (error) {
    const message = (error as Error).message;
    if (message.includes("variants_combo_uq")) {
      return { ok: false, message: "Bu renk ve beden kombinasyonu zaten var." };
    }
    if (message.includes("variants_sku_uq")) {
      return { ok: false, message: "Bu varyant kodu (SKU) zaten kullanılıyor." };
    }
    return { ok: false, message: "Kaydedilemedi: " + message.slice(0, 160) };
  }

  revalidatePath(`/admin/urunler/${productId}`);
  revalidatePath("/admin/stok");
  return { ok: true, message: "Varyant kaydedildi." };
}

export async function deleteVariantAction(variantId: string, productId: string) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await db.delete(productVariants).where(eq(productVariants.id, variantId));
  revalidatePath(`/admin/urunler/${productId}`);
  return { ok: true };
}

/** Hızlı stok güncelleme (stok sayfasından) */
export async function updateStockAction(variantId: string, stock: number) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  await logAudit({ action: "stock.update", userId: admin.id, actorEmail: admin.email,
    entity: "variant", entityId: variantId, summary: `Stok ${stock} olarak ayarlandı` });
  if (stock < 0) return { ok: false, message: "Stok negatif olamaz." };

  const before = await db
    .select({ stock: productVariants.stock })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  await db.update(productVariants).set({ stock }).where(eq(productVariants.id, variantId));

  const diff = stock - (before[0]?.stock ?? 0);
  if (diff !== 0) {
    await db.insert(stockMovements).values({
      variantId,
      type: diff > 0 ? "PURCHASE" : "MANUAL",
      quantity: diff,
      note: "Stok sayfasından güncelleme",
    });
  }

  revalidatePath("/admin/stok");
  return { ok: true, message: "Stok güncellendi." };
}

/**
 * Toplu varyant üretir: verilen renkler × verilen bedenler.
 * Var olan kombinasyonlar atlanır.
 */
export async function generateVariantsAction(
  productId: string,
  colors: { name: string; hex: string }[],
  sizes: string[],
  stock: number,
) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  if (colors.length === 0 || sizes.length === 0) {
    return { ok: false, message: "En az bir renk ve bir beden gir." };
  }

  const productRows = await db
    .select({ sku: products.sku })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  const baseSku = productRows[0]?.sku ?? "URN";

  let created = 0;
  let order = 0;

  for (const color of colors) {
    for (const size of sizes) {
      const existing = await db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, productId),
            eq(productVariants.size, size),
            eq(productVariants.colorName, color.name),
          ),
        )
        .limit(1);
      if (existing[0]) continue;

      const variantId = createId();
      await db
        .insert(productVariants)
        .values({
          id: variantId,
          productId,
          sku: `${baseSku}-${slugify(color.name).slice(0, 3).toUpperCase()}-${size}`,
          size,
          colorName: color.name,
          colorHex: color.hex,
          stock,
          sortOrder: order++,
        });

      if (stock > 0) {
        await db.insert(stockMovements).values({
          variantId,
          type: "PURCHASE",
          quantity: stock,
          note: "Toplu varyant oluşturma",
        });
      }
      created++;
    }
  }

  revalidatePath(`/admin/urunler/${productId}`);
  return { ok: true, message: `${created} varyant oluşturuldu.` };
}
