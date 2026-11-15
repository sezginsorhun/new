/**
 * TOPTANCI KATALOĞU YÜKLEYİCİ
 *
 * `katalog-toptanci.json` dosyasındaki gerçek ürünleri (tedarikçi fotoğrafı,
 * açıklaması ve piyasaya göre fiyatıyla) veritabanına yazar. Dosyayı
 * `scripts/toptanci-katalog.py` üretir.
 *
 * KURALLAR
 *  - Hiçbir şey SİLMEZ. Slug'ı zaten var olan ürün olduğu gibi bırakılır;
 *    panelde elle değiştirdiğin fiyat, stok, görsel korunur.
 *  - Kategoriler slug'a göre eşleşir: "Vibratör", "Prezervatif" gibi var
 *    olan kategoriler yeniden açılmaz, ürünler onlara bağlanır.
 *  - Bu çalıştırmada en az bir ürün eklendiyse, görselleri yalnızca kodla
 *    üretilmiş SVG yer tutucular olan DEMO ürünler yayından kaldırılır
 *    (is_active = 0). Silinmezler; panelden tek tıkla geri açılabilir.
 *    Elle fotoğraf yüklediğin ürünlere dokunulmaz.
 *    Bu yüzden içi tamamen boşalan kategoriler de gizlenir (is_active = 0).
 *  - Yer tutucu SVG görselli kategorilere, o kategorideki ilk ürünün
 *    fotoğrafı konur.
 *
 * Çalıştırmak için:
 *   npm run db:toptanci
 * ya da dağıtımda ortam değişkeni:
 *   IMPORT_CATALOG=1
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFileSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { and, eq, inArray } from "drizzle-orm";
import * as schema from "./schema";
import { slugify } from "../lib/utils";
import { createId } from "../lib/id";

const {
  brands,
  categories,
  productCategories,
  productImages,
  productVariants,
  products,
  stockMovements,
} = schema;

type Varyant = { olcu: string; stok: number };

type ToptanciUrun = {
  ad: string;
  slug: string;
  sku: string;
  kaynak: string;
  kaynakKodu: string;
  marka: string | null;
  ana: string;
  alt: string;
  fiyat: number;
  eskiFiyat: number | null;
  maliyet: number;
  kisaAciklama: string;
  aciklama: string;
  malzeme: string | null;
  bakim: string;
  agirlikGr: number;
  renk: string;
  varyantlar: Varyant[];
  gorseller: string[];
  yeni?: boolean;
  oneCikan?: boolean;
  cokSatan?: boolean;
};

const CATEGORY_TEXT: Record<string, string> = {
  "Kadın oyuncakları": "Vibratör, emişli uyarıcı ve kadınlara yönelik oyuncaklar.",
  Dildolar: "Realistik, fantastik ve çift uçlu dildolar, strapon setleri.",
  "Erkek oyuncakları": "Mastürbatör, penis halkası, kılıf ve pompalar.",
  "Anal ürünler": "Plug, anal vibratör ve başlangıç ürünleri.",
  "Cinsel sağlık": "Kayganlaştırıcı, prezervatif, geciktirici ve bakım ürünleri.",
  "Çift ürünleri": "Masaj yağları, erotik oyunlar ve çift oyuncakları.",
  "İç giyim": "Fantezi iç giyim, jartiyer takımları ve aksesuarlar.",
  "BDSM ve aksesuar": "Kelepçe, maske, kırbaç ve fantezi aksesuarları.",
  Hijyen: "Oyuncak temizleyici ve kişisel hijyen ürünleri.",
  Premium: "Seks makineleri ve realistik mankenler.",
};

const COLOR_HEX: Record<string, string> = {
  Siyah: "#1f1b1d",
  Beyaz: "#f4f1ee",
  Pembe: "#e889a8",
  Mor: "#7b4a9e",
  Kırmızı: "#c0262f",
  Mavi: "#3f7fc4",
  Lacivert: "#252f45",
  Yeşil: "#3d8a5a",
  Turuncu: "#e8812f",
  Sarı: "#efc93a",
  Gri: "#9a9592",
  Şeffaf: "#e6eef2",
  Gold: "#c9a54a",
  Gümüş: "#bfc3c7",
  Rose: "#d9a1a0",
  Lila: "#c3a3d9",
  Bordo: "#5c2430",
  Kumral: "#a8794f",
  Fuşya: "#d6338a",
  Krem: "#e8dbc6",
  "Ten Rengi": "#e7b99a",
  "Açık Ten": "#f0cdb3",
  "Koyu Ten": "#9c6a4b",
  Kahverengi: "#6b4430",
  Standart: "#b9a69c",
};

function isPlaceholder(url: string | null | undefined): boolean {
  return !url || url.endsWith(".svg");
}

let client: mysql.Connection;
let db: ReturnType<typeof drizzle<typeof schema, mysql.Connection>>;

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil. .env dosyasını kontrol et.");
  client = await mysql.createConnection({ uri: url, timezone: "Z" });
  db = drizzle(client, { schema, mode: "default" });

  const file = path.join(process.cwd(), "src/db/katalog-toptanci.json");
  const katalog = JSON.parse(readFileSync(file, "utf8")) as ToptanciUrun[];
  console.log(`→ Toptancı kataloğu: ${katalog.length} ürün (hiçbir şey silinmez)...\n`);

  /* ---------------------------------------------------------- markalar */
  const brandRows = await db.select().from(brands);
  const brandIdBySlug = new Map(brandRows.map((b) => [b.slug, b.id]));
  async function brandId(name: string | null): Promise<string | null> {
    if (!name) return null;
    const slug = slugify(name);
    let id = brandIdBySlug.get(slug);
    if (!id) {
      id = createId();
      await db.insert(brands).values({ id, name, slug });
      brandIdBySlug.set(slug, id);
    }
    return id;
  }

  /* -------------------------------------------------------- kategoriler */
  const categoryRows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      sortOrder: categories.sortOrder,
      imageUrl: categories.imageUrl,
    })
    .from(categories);
  const categoryBySlug = new Map(categoryRows.map((c) => [c.slug, c]));
  let sortOrder = Math.max(0, ...categoryRows.map((c) => c.sortOrder)) + 1;
  const categoryImage = new Map<string, string>(); // kategori id → ilk ürün fotoğrafı

  async function ensureCategory(name: string, parentId: string | null, description: string) {
    const slug = slugify(name);
    const existing = categoryBySlug.get(slug);
    if (existing) return existing.id;
    const id = createId();
    await db.insert(categories).values({
      id,
      name,
      slug,
      description,
      parentId,
      sortOrder: sortOrder++,
      metaTitle: name,
      metaDescription: description.slice(0, 155),
    });
    categoryBySlug.set(slug, { id, slug, sortOrder, imageUrl: null });
    console.log(`  + kategori: ${name}`);
    return id;
  }

  /* ------------------------------------------------------------ ürünler */
  const existing = await db.select({ slug: products.slug, sku: products.sku }).from(products);
  const slugs = new Set(existing.map((p) => p.slug));
  const skus = new Set(existing.map((p) => p.sku));
  const variantSkus = new Set(
    (await db.select({ sku: productVariants.sku }).from(productVariants)).map((v) => v.sku),
  );

  const stats = { urun: 0, varyant: 0, atlanan: 0 };

  for (const urun of katalog) {
    const anaId = await ensureCategory(urun.ana, null, CATEGORY_TEXT[urun.ana] ?? urun.ana);
    const altId = await ensureCategory(urun.alt, anaId, `${urun.alt} — ${urun.ana}`);
    if (urun.gorseller[0]) {
      if (!categoryImage.has(altId)) categoryImage.set(altId, urun.gorseller[0]);
      if (!categoryImage.has(anaId) && (urun.oneCikan || urun.cokSatan)) {
        categoryImage.set(anaId, urun.gorseller[0]);
      }
    }

    if (slugs.has(urun.slug)) {
      stats.atlanan++;
      continue;
    }

    let sku = urun.sku;
    for (let i = 2; skus.has(sku); i++) sku = `${urun.sku}-${i}`;
    skus.add(sku);
    slugs.add(urun.slug);

    const productId = createId();
    await db.insert(products).values({
      id: productId,
      name: urun.ad,
      slug: urun.slug,
      sku,
      description: urun.aciklama,
      shortDescription: urun.kisaAciklama,
      price: urun.fiyat,
      compareAtPrice: urun.eskiFiyat,
      costPrice: urun.maliyet,
      taxRate: 20,
      brandId: await brandId(urun.marka),
      isFeatured: urun.oneCikan ?? false,
      isNew: urun.yeni ?? false,
      isBestseller: urun.cokSatan ?? false,
      material: urun.malzeme,
      careInfo: urun.bakim,
      modelInfo: null,
      weightGr: urun.agirlikGr,
      metaTitle: urun.ad.slice(0, 200),
      metaDescription: urun.kisaAciklama.slice(0, 155),
    });
    stats.urun++;

    await db.insert(productCategories).values([
      { productId, categoryId: altId },
      { productId, categoryId: anaId },
    ]);

    await db.insert(productImages).values(
      urun.gorseller.map((src, index) => ({
        productId,
        url: src,
        alt: urun.ad.slice(0, 200),
        colorName: urun.renk,
        sortOrder: index,
      })),
    );

    for (const [index, v] of urun.varyantlar.entries()) {
      let variantSku = `${sku}-${slugify(v.olcu).replace(/-/g, "").toUpperCase().slice(0, 8)}`;
      for (let i = 2; variantSkus.has(variantSku); i++) variantSku = `${variantSku}-${i}`;
      variantSkus.add(variantSku);
      const variantId = createId();
      await db.insert(productVariants).values({
        id: variantId,
        productId,
        sku: variantSku,
        size: v.olcu,
        colorName: urun.renk,
        colorHex: COLOR_HEX[urun.renk] ?? COLOR_HEX.Standart,
        stock: v.stok,
        sortOrder: index,
      });
      await db.insert(stockMovements).values({
        variantId,
        type: "PURCHASE",
        quantity: v.stok,
        note: "Toptancı kataloğu açılış stoğu",
      });
      stats.varyant++;
    }

    if (stats.urun % 100 === 0) console.log(`  … ${stats.urun} ürün eklendi`);
  }

  /* ------------------------------------- kategori görselleri (yer tutucu) */
  let categoryImagesSet = 0;
  for (const c of categoryBySlug.values()) {
    const photo = categoryImage.get(c.id);
    if (photo && isPlaceholder(c.imageUrl)) {
      await db.update(categories).set({ imageUrl: photo }).where(eq(categories.id, c.id));
      categoryImagesSet++;
    }
  }

  /* ------------------------------------------------- demo ürünleri kapat */
  let demoHidden = 0;
  let categoriesHidden = 0;
  if (stats.urun > 0) {
    const newSlugs = new Set(katalog.map((u) => u.slug));
    const rows = await db
      .select({ id: products.id, slug: products.slug, url: productImages.url })
      .from(products)
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .where(eq(products.isActive, true));
    const onlyPlaceholders = new Map<string, boolean>();
    for (const r of rows) {
      if (newSlugs.has(r.slug)) continue;
      const prev = onlyPlaceholders.get(r.id) ?? true;
      onlyPlaceholders.set(r.id, prev && isPlaceholder(r.url));
    }
    const demoIds = [...onlyPlaceholders].filter(([, demo]) => demo).map(([id]) => id);
    if (demoIds.length) {
      await db
        .update(products)
        .set({ isActive: false })
        .where(and(inArray(products.id, demoIds), eq(products.isActive, true)));
      demoHidden = demoIds.length;
    }

    /* Demo ürünler kapanınca içi boşalan kategoriler menüde boş sayfa
       açmasın: aktif ürünü kalmayan (alt kategorileri dahil) kategoriler
       gizlenir. Panelden "Aktif" işaretiyle geri açılabilir. */
    const allCategories = await db
      .select({ id: categories.id, parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.isActive, true));
    const activeLinks = await db
      .select({ categoryId: productCategories.categoryId })
      .from(productCategories)
      .innerJoin(products, eq(products.id, productCategories.productId))
      .where(eq(products.isActive, true));
    const filled = new Set(activeLinks.map((l) => l.categoryId));
    const emptyIds = allCategories
      .filter(
        (c) =>
          !filled.has(c.id) &&
          !allCategories.some((child) => child.parentId === c.id && filled.has(child.id)),
      )
      .map((c) => c.id);
    if (emptyIds.length) {
      await db.update(categories).set({ isActive: false }).where(inArray(categories.id, emptyIds));
      categoriesHidden = emptyIds.length;
    }
  }

  console.log("\n✓ Toptancı kataloğu yüklendi.");
  console.log(`   ürün               : ${stats.urun} eklendi, ${stats.atlanan} zaten vardı`);
  console.log(`   varyant            : ${stats.varyant} eklendi`);
  console.log(`   kategori görseli   : ${categoryImagesSet} güncellendi`);
  console.log(`   demo ürün          : ${demoHidden} yayından kaldırıldı (silinmedi)`);
  console.log(`   boş kategori       : ${categoriesHidden} gizlendi`);
}

run()
  .then(async () => {
    await client?.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\n✗ Toptancı kataloğu yüklenemedi:", error);
    await client?.end();
    process.exit(1);
  });
