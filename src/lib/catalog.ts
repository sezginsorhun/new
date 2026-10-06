/**
 * KATALOG SORGULARI
 * Vitrin sayfalarının ihtiyaç duyduğu tüm okuma işlemleri burada.
 */

import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, gte, like, inArray, lte, or, sql, SQL } from "drizzle-orm";
import { db } from "@/db";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";
import {
  categories,
  productCategories,
  productImages,
  productVariants,
  products,
  reviews,
  banners,
} from "@/db/schema";

/* -------------------------------- TİPLER -------------------------------- */

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  isNew: boolean;
  images: { url: string; alt: string | null; colorName: string | null }[];
  colors: { name: string; hex: string }[];
  inStock: boolean;
  rating: number | null;
  reviewCount: number;
};

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  children: CategoryNode[];
};

/* ------------------------------ KATEGORİLER ----------------------------- */

/**
 * Menü için iki seviyeli kategori ağacı.
 * Her sayfada header, footer ve filtre panelinde isteniyor; kategoriler
 * ise neredeyse hiç değişmiyor. Bu yüzden hem istek içinde tekilleştirilir
 * hem de kısa süre önbellekte tutulur.
 */
async function readCategoryTree(): Promise<CategoryNode[]> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const byId = new Map<string, CategoryNode>();
  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageUrl: row.imageUrl,
      children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parentId && byId.has(row.parentId)) {
      byId.get(row.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export const getCategoryTree = cache(
  unstable_cache(readCategoryTree, ["kategori-agaci"], {
    revalidate: CACHE_TTL,
    tags: [CACHE_TAGS.catalog],
  }),
);

export async function getCategoryBySlug(slug: string) {
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);
  return rows[0] ?? null;
}

/** Bir kategorinin kendisi + tüm alt kategorilerinin id'leri */
export async function getCategoryIdsWithChildren(categoryId: string): Promise<string[]> {
  const children = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.parentId, categoryId));
  return [categoryId, ...children.map((c) => c.id)];
}

/* -------------------------------- ÜRÜNLER ------------------------------- */

/** Ürün kartları için gereken ek verileri (görsel, renk, stok, puan) toplar */
async function decorateProducts(
  rows: { id: string; name: string; slug: string; price: number; compareAtPrice: number | null; isNew: boolean }[],
): Promise<ProductCardData[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [imageRows, variantRows, reviewRows] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select({
        productId: productVariants.productId,
        colorName: productVariants.colorName,
        colorHex: productVariants.colorHex,
        stock: productVariants.stock,
        sortOrder: productVariants.sortOrder,
      })
      .from(productVariants)
      .where(and(inArray(productVariants.productId, ids), eq(productVariants.isActive, true)))
      .orderBy(asc(productVariants.sortOrder)),
    db
      .select({
        productId: reviews.productId,
        avg: sql<number>`avg(${reviews.rating})`.as("avg"),
        count: sql<number>`count(*)`.as("count"),
      })
      .from(reviews)
      .where(and(inArray(reviews.productId, ids), eq(reviews.isApproved, true)))
      .groupBy(reviews.productId),
  ]);

  return rows.map((row) => {
    const images = imageRows
      .filter((i) => i.productId === row.id)
      .map((i) => ({ url: i.url, alt: i.alt, colorName: i.colorName }));

    const colorMap = new Map<string, string>();
    let inStock = false;
    for (const v of variantRows) {
      if (v.productId !== row.id) continue;
      if (!colorMap.has(v.colorName)) colorMap.set(v.colorName, v.colorHex);
      if (v.stock > 0) inStock = true;
    }

    const review = reviewRows.find((r) => r.productId === row.id);

    return {
      ...row,
      images,
      colors: [...colorMap].map(([name, hex]) => ({ name, hex })),
      inStock,
      rating: review ? Number(Number(review.avg).toFixed(1)) : null,
      reviewCount: review?.count ?? 0,
    };
  });
}

export type ProductListOptions = {
  categorySlug?: string;
  search?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number; // kuruş
  maxPrice?: number; // kuruş
  onlyInStock?: boolean;
  onlyDiscounted?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "bestseller" | "name";
  page?: number;
  perPage?: number;
};

export async function listProducts(options: ProductListOptions = {}) {
  const perPage = options.perPage ?? 24;
  const page = Math.max(options.page ?? 1, 1);

  const filters: SQL[] = [eq(products.isActive, true)];

  // Kategori
  if (options.categorySlug) {
    const category = await getCategoryBySlug(options.categorySlug);
    if (!category) return { items: [] as ProductCardData[], total: 0, page, perPage };
    const categoryIds = await getCategoryIdsWithChildren(category.id);
    filters.push(
      sql`exists (
        select 1 from ${productCategories}
        where ${productCategories.productId} = ${products.id}
          and ${productCategories.categoryId} in ${categoryIds}
      )`,
    );
  }

  // Arama
  if (options.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    filters.push(
      or(
        like(products.name, term),
        like(products.description, term),
        like(products.sku, term),
      )!,
    );
  }

  // Fiyat aralığı
  if (options.minPrice !== undefined) filters.push(gte(products.price, options.minPrice));
  if (options.maxPrice !== undefined) filters.push(lte(products.price, options.maxPrice));

  // İndirimli
  if (options.onlyDiscounted) {
    filters.push(sql`${products.compareAtPrice} is not null and ${products.compareAtPrice} > ${products.price}`);
  }

  // Beden / renk / stok — varyant üzerinden
  const variantConditions: SQL[] = [];
  if (options.sizes?.length) {
    variantConditions.push(sql`${productVariants.size} in ${options.sizes}`);
  }
  if (options.colors?.length) {
    variantConditions.push(sql`${productVariants.colorName} in ${options.colors}`);
  }
  if (options.onlyInStock) {
    variantConditions.push(sql`${productVariants.stock} > 0`);
  }
  if (variantConditions.length) {
    filters.push(
      sql`exists (
        select 1 from ${productVariants}
        where ${productVariants.productId} = ${products.id}
          and ${productVariants.isActive} = true
          and ${sql.join(variantConditions, sql` and `)}
      )`,
    );
  }

  const where = and(...filters);

  const orderBy = {
    newest: [desc(products.createdAt)],
    "price-asc": [asc(products.price)],
    "price-desc": [desc(products.price)],
    bestseller: [desc(products.soldCount)],
    name: [asc(products.name)],
  }[options.sort ?? "newest"];

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        isNew: products.isNew,
      })
      .from(products)
      .where(where)
      .orderBy(...orderBy)
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ count: sql<number>`count(*)` }).from(products).where(where),
  ]);

  return {
    items: await decorateProducts(rows),
    total: countRows[0]?.count ?? 0,
    page,
    perPage,
  };
}

export async function getFeaturedProducts(limit = 8) {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
    })
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return decorateProducts(rows);
}

export async function getNewProducts(limit = 8) {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
    })
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isNew, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return decorateProducts(rows);
}

export async function getDiscountedProducts(limit = 8) {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`${products.compareAtPrice} is not null and ${products.compareAtPrice} > ${products.price}`,
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return decorateProducts(rows);
}

/* ----------------------------- ÜRÜN DETAY ------------------------------- */

export async function getProductBySlug(slug: string) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  const product = rows[0];
  if (!product) return null;

  const [images, variants, productCats, reviewRows] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)))
      .orderBy(asc(productVariants.sortOrder)),
    db
      .select({ id: categories.id, name: categories.name, slug: categories.slug, parentId: categories.parentId })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(eq(productCategories.productId, product.id)),
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userId: reviews.userId,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, product.id), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt)),
  ]);

  const averageRating =
    reviewRows.length > 0
      ? Number((reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length).toFixed(1))
      : null;

  return {
    ...product,
    images,
    variants,
    categories: productCats,
    reviews: reviewRows,
    averageRating,
  };
}

/** Aynı kategorideki diğer ürünler */
export async function getRelatedProducts(productId: string, limit = 4) {
  const cats = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));

  if (cats.length === 0) return [];
  const categoryIds = cats.map((c) => c.categoryId);

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`${products.id} <> ${productId}`,
        sql`exists (
          select 1 from ${productCategories}
          where ${productCategories.productId} = ${products.id}
            and ${productCategories.categoryId} in ${categoryIds}
        )`,
      ),
    )
    .orderBy(desc(products.soldCount))
    .limit(limit);

  return decorateProducts(rows);
}

export async function incrementProductView(productId: string) {
  await db
    .update(products)
    .set({ viewCount: sql`${products.viewCount} + 1` })
    .where(eq(products.id, productId));
}

/* ------------------------- FİLTRE SEÇENEKLERİ --------------------------- */

/** Bir kategoride mevcut olan bedenler, renkler ve fiyat aralığı */
export async function getFilterOptions(categorySlug?: string) {
  let categoryIds: string[] | null = null;
  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug);
    if (category) categoryIds = await getCategoryIdsWithChildren(category.id);
  }

  const base = db
    .select({
      size: productVariants.size,
      colorName: productVariants.colorName,
      colorHex: productVariants.colorHex,
      price: products.price,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      categoryIds
        ? and(
            eq(products.isActive, true),
            eq(productVariants.isActive, true),
            sql`exists (
              select 1 from ${productCategories}
              where ${productCategories.productId} = ${products.id}
                and ${productCategories.categoryId} in ${categoryIds}
            )`,
          )
        : and(eq(products.isActive, true), eq(productVariants.isActive, true)),
    );

  const rows = await base;

  const sizeSet = new Set<string>();
  const colorMap = new Map<string, string>();
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const row of rows) {
    sizeSet.add(row.size);
    if (!colorMap.has(row.colorName)) colorMap.set(row.colorName, row.colorHex);
    minPrice = Math.min(minPrice, row.price);
    maxPrice = Math.max(maxPrice, row.price);
  }

  // Bedenleri mantıklı sırala: harf bedenler önce sabit sırada, sayılar artan
  const LETTER_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const sizes = [...sizeSet].sort((a, b) => {
    const ai = LETTER_ORDER.indexOf(a.toUpperCase());
    const bi = LETTER_ORDER.indexOf(b.toUpperCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, "tr", { numeric: true });
  });

  return {
    sizes,
    colors: [...colorMap].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name, "tr")),
    minPrice: minPrice === Infinity ? 0 : minPrice,
    maxPrice,
  };
}

/* -------------------------------- BANNER -------------------------------- */

/**
 * Yayındaki slaytlar. Yayın tarihi verilmişse zamanı gelmemiş ya da
 * geçmiş olanlar listelenmez — panelden tarih vererek kampanya slaytı
 * önceden hazırlanabilir.
 */
const readBanners = unstable_cache(
  async (position: string) => db
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.isActive, true),
        eq(banners.position, position),
        sql`(${banners.startsAt} is null or ${banners.startsAt} <= now())`,
        sql`(${banners.endsAt} is null or ${banners.endsAt} >= now())`,
      ),
    )
    .orderBy(asc(banners.sortOrder)),
  ["carousel-slaytlari"],
  { revalidate: CACHE_TTL, tags: [CACHE_TAGS.home] },
);

/** Carousel slaytları — panelden değişince etiket geçersiz kılınır. */
export const getBanners = cache((position = "home_hero") => readBanners(position));

/** En çok satanlar */
export async function getBestsellerProducts(limit = 8) {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.soldCount), desc(products.viewCount))
    .limit(limit);
  return decorateProducts(rows);
}

/** Belirli bir kategorinin (alt kategorileri dahil) ürünleri */
export async function getProductsByCategorySlug(slug: string, limit = 8) {
  const category = await getCategoryBySlug(slug);
  if (!category) return [];
  const ids = await getCategoryIdsWithChildren(category.id);
  const rows = await db
    .selectDistinct({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
      createdAt: products.createdAt,
    })
    .from(products)
    .innerJoin(productCategories, eq(productCategories.productId, products.id))
    .where(and(eq(products.isActive, true), inArray(productCategories.categoryId, ids)))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return decorateProducts(rows);
}
