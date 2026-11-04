/**
 * SITEMAP.XML
 *
 * Google'a sitedeki sayfaların listesini verir: ana sayfa, sabit
 * sayfalar, kategoriler, ürünler ve panelden eklenen içerik sayfaları.
 * Yönetim paneli ve müşteriye özel sayfalar (sepet/ödeme/hesabım)
 * bilerek listelenmez.
 */

import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, pages } from "@/db/schema";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Derleme sırasında veritabanına BAĞLANMAYA ÇALIŞMASIN diye istek
 * anında üretilir. Yoksa veritabanı bir an erişilemezse tüm dağıtım
 * çöker. Sonuç bir saat önbelleklenir, maliyeti yok denecek kadar az.
 */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categoryRows, productRows, pageRows] = await Promise.all([
    db
      .select({ slug: categories.slug, updatedAt: categories.createdAt })
      .from(categories)
      .where(eq(categories.isActive, true)),
    db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isActive, true)),
    db
      .select({ slug: pages.slug, updatedAt: pages.updatedAt })
      .from(pages)
      .where(eq(pages.isActive, true)),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/indirimli`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/iletisim`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticEntries,
    ...categoryRows.map((row) => ({
      url: `${siteUrl}/kategori/${row.slug}`,
      lastModified: row.updatedAt ?? undefined,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...productRows.map((row) => ({
      url: `${siteUrl}/urun/${row.slug}`,
      lastModified: row.updatedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...pageRows.map((row) => ({
      url: `${siteUrl}/sayfa/${row.slug}`,
      lastModified: row.updatedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
