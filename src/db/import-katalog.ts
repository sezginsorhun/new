/**
 * KATALOG YÜKLEYİCİ
 *
 * `katalog-yetiskin.ts` içindeki ana kategori / alt kategori / ürün ağacını
 * veritabanına yazar.
 *
 * TEMEL KURAL: HİÇBİR ŞEY SİLMEZ.
 * Zaten var olan bir kategori ya da ürün (slug'ına bakarak) olduğu gibi
 * bırakılır, üzerine yazılmaz. Yani bu dosyayı kaç kez çalıştırırsan çalıştır
 * sonuç aynıdır — eksik olanı ekler, var olana dokunmaz. Paneldeki elle
 * yaptığın düzeltmeler (fiyat, stok, görsel) bu yüzden kaybolmaz.
 *
 * Çalıştırmak için:
 *   npm run db:katalog
 * ya da dağıtımda ortam değişkeni:
 *   IMPORT_CATALOG=1
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { KATALOG, type KatalogUrun } from "./katalog-yetiskin";
import { writeCategoryImage, writeProductImage } from "./placeholder-images";
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

// Bağlantı run() içinde açılır — dosya seviyesinde await kullanılamıyor.
let client: mysql.Connection;
let db: ReturnType<typeof drizzle<typeof schema, mysql.Connection>>;

/* ------------------------------------------------------------------ renkler */

/**
 * Varyant renk kodu. Görsel paleti de bu adlardan seçiliyor, bu yüzden
 * katalogdaki renk adları palet anahtarlarıyla aynı tutuldu.
 * "Standart" = tek renk üretilen ürün (jel, prezervatif, makine...).
 */
const COLOR_HEX: Record<string, string> = {
  Siyah: "#2a2528",
  Beyaz: "#f2ece7",
  Pudra: "#eed3cb",
  Bordo: "#5c2430",
  Vizon: "#d4baa4",
  Lacivert: "#252f45",
  Gri: "#aba4a0",
  Krem: "#e8dbc6",
  Yeşil: "#33453a",
  Mavi: "#9fbdd0",
  Standart: "#b9a69c",
};

/** Görsel paletinde "Standart" yok; nötr bir tona düşüyoruz. */
function paletteFor(renk: string): string {
  return renk === "Standart" ? "Vizon" : renk;
}

/** Ana kategori kartlarının zemin rengi. */
const CATEGORY_COLOR: Record<string, string> = {
  "Cinsel sağlık": "Mavi",
  "Kadın oyuncakları": "Pudra",
  "Erkek oyuncakları": "Lacivert",
  "Çift ürünleri": "Bordo",
  "Anal ürünler": "Vizon",
  "İç giyim": "Siyah",
  "BDSM ve aksesuar": "Siyah",
  Hijyen: "Yeşil",
  Premium: "Krem",
};

/* -------------------------------------------------------------------- kodlar */

/** SKU parçası: "12'li" → "12LI", "Tek beden" → "TEKBEDEN" */
function skuPart(value: string, max = 12): string {
  return slugify(value).replace(/-/g, "").toUpperCase().slice(0, max) || "STD";
}

/** Verilen kümede çakışmayan bir kod üretir: ALN-2001, ALN-2001-2, ... */
function uniqueCode(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  for (let i = 2; i < 999; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }
  throw new Error(`Kod üretilemedi: ${base}`);
}

/* ------------------------------------------------------------------ metinler */

const CARE_BY_HINT: Array<[RegExp, string]> = [
  [
    /jel|sprey|mendil|temizley/i,
    "Serin ve kuru yerde, doğrudan güneş ışığından uzakta saklayın. Çocukların ulaşamayacağı yerde tutun. Ambalajı açtıktan sonra 12 ay içinde kullanın.",
  ],
  [
    /prezervatif/i,
    "Serin ve kuru yerde saklayın. Son kullanma tarihinden sonra kullanmayın. Her prezervatif tek kullanımlıktır. Yağ bazlı ürünlerle birlikte kullanmayın — lateksi zayıflatır.",
  ],
  [
    /çorap|babydoll|gecelik|jartiyer|kostüm|göz bandı/i,
    "30°C'de ters yüz, çamaşır filesinde elde yıkama programında yıkayın. Çamaşır suyu kullanmayın, kurutma makinesine koymayın, düşük ısıda ütüleyin.",
  ],
];

const CARE_DEFAULT =
  "Her kullanımdan önce ve sonra ılık su ve oyuncak temizleyici ile yıkayın, kurulayıp kendi kesesinde saklayın. Silikon gövdede yalnızca su bazlı kayganlaştırıcı kullanın.";

function careInfoFor(urun: KatalogUrun): string {
  for (const [pattern, text] of CARE_BY_HINT) {
    if (pattern.test(urun.ad)) return text;
  }
  return CARE_DEFAULT;
}

/** Ürün sayfasındaki "kullanım" bloğu; katalogda yoksa malzemeden türetiyoruz. */
function usageFor(urun: KatalogUrun): string | null {
  const parts = [urun.kullanim, urun.malzeme].filter(Boolean);
  return parts.length ? parts.join("\n\n") : null;
}

/* --------------------------------------------------------------------- iş */

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil. .env dosyasını kontrol et.");
  client = await mysql.createConnection({ uri: url, timezone: "Z" });
  db = drizzle(client, { schema, mode: "default" });

  console.log("→ Katalog yükleniyor (hiçbir şey silinmez)...\n");

  /* Marka: varsa kullan, yoksa oluştur. */
  const existingBrand = await db.select().from(brands).where(eq(brands.slug, "alenora")).limit(1);
  let brandId = existingBrand[0]?.id;
  if (!brandId) {
    brandId = createId();
    await db.insert(brands).values({ id: brandId, name: "Alenora", slug: "alenora" });
  }

  /* Var olan kayıtları tek seferde okuyup kümelere alıyoruz: her ürün için
     ayrı sorgu atmaktansa tek seferde okumak hem hızlı hem de öngörülebilir. */
  const existingCategories = await db
    .select({ id: categories.id, slug: categories.slug, sortOrder: categories.sortOrder })
    .from(categories);
  const categoryIdBySlug = new Map(existingCategories.map((c) => [c.slug, c.id]));

  const existingProducts = await db
    .select({ slug: products.slug, sku: products.sku })
    .from(products);
  const productSlugs = new Set(existingProducts.map((p) => p.slug));
  const productSkus = new Set(existingProducts.map((p) => p.sku));

  const existingVariantSkus = await db.select({ sku: productVariants.sku }).from(productVariants);
  const variantSkus = new Set(existingVariantSkus.map((v) => v.sku));

  let sortOrder = Math.max(0, ...existingCategories.map((c) => c.sortOrder)) + 1;
  let imageSeed = 101;
  let skuCounter = 2000;

  const stats = { anaKategori: 0, altKategori: 0, urun: 0, varyant: 0, atlanan: 0 };

  for (const ana of KATALOG) {
    const anaSlug = slugify(ana.ad);
    let anaId = categoryIdBySlug.get(anaSlug);

    if (!anaId) {
      anaId = createId();
      await db.insert(categories).values({
        id: anaId,
        name: ana.ad,
        slug: anaSlug,
        description: ana.aciklama,
        sortOrder: sortOrder++,
        imageUrl: writeCategoryImage(
          `${anaSlug}.svg`,
          ana.ad,
          CATEGORY_COLOR[ana.ad] ?? "Vizon",
        ),
        metaTitle: ana.ad,
        metaDescription: ana.aciklama.slice(0, 155),
      });
      categoryIdBySlug.set(anaSlug, anaId);
      stats.anaKategori++;
      console.log(`  + ana kategori: ${ana.ad}`);
    }

    for (const alt of ana.altlar) {
      const altSlug = slugify(alt.ad);
      let altId = categoryIdBySlug.get(altSlug);

      if (!altId) {
        altId = createId();
        await db.insert(categories).values({
          id: altId,
          name: alt.ad,
          slug: altSlug,
          description: alt.aciklama,
          parentId: anaId,
          sortOrder: sortOrder++,
          imageUrl: writeCategoryImage(
            `${altSlug}.svg`,
            alt.ad,
            CATEGORY_COLOR[ana.ad] ?? "Vizon",
          ),
          metaTitle: `${alt.ad} — ${ana.ad}`,
          metaDescription: alt.aciklama.slice(0, 155),
        });
        categoryIdBySlug.set(altSlug, altId);
        stats.altKategori++;
        console.log(`    + alt kategori: ${alt.ad}`);
      }

      for (const urun of alt.urunler) {
        const slug = slugify(urun.ad);

        if (productSlugs.has(slug)) {
          stats.atlanan++;
          continue; // zaten var — dokunulmaz
        }

        const sku = uniqueCode(`ALN-${skuCounter++}`, productSkus);
        const productId = createId();

        await db.insert(products).values({
          id: productId,
          name: urun.ad,
          slug,
          sku,
          description: urun.aciklama,
          shortDescription: urun.kisaAciklama,
          price: urun.fiyat,
          compareAtPrice: urun.eskiFiyat ?? null,
          costPrice: Math.round(urun.fiyat * 0.45),
          taxRate: 10,
          brandId,
          isFeatured: urun.oneCikan ?? false,
          isNew: urun.yeni ?? false,
          material: urun.malzeme ?? null,
          careInfo: careInfoFor(urun),
          modelInfo: usageFor(urun),
          weightGr: urun.agirlikGr ?? 200,
          metaTitle: urun.ad,
          metaDescription: urun.kisaAciklama.slice(0, 155),
        });
        productSlugs.add(slug);
        stats.urun++;

        /* Kategori bağlantısı: alt kategori + ana kategori */
        await db.insert(productCategories).values({ productId, categoryId: altId });
        await db.insert(productCategories).values({ productId, categoryId: anaId });

        /* Her renk için bir görsel (aynı renk birden fazla ölçüde geçebilir) */
        const renkler = [...new Set(urun.varyantlar.map((v) => v.renk))];
        let imageOrder = 0;
        for (const renk of renkler) {
          const file = `${slug}-${slugify(renk)}.svg`;
          const url = writeProductImage(
            file,
            urun.ad.split(" ").slice(0, 2).join(" "),
            renk === "Standart" ? alt.ad : renk,
            paletteFor(renk),
            imageSeed++,
          );
          await db.insert(productImages).values({
            productId,
            url,
            alt: `${urun.ad}${renk === "Standart" ? "" : ` — ${renk}`}`,
            colorName: renk,
            sortOrder: imageOrder++,
          });
        }

        /* Varyantlar: katalogdaki kombinasyonlar birebir yazılır */
        let variantOrder = 0;
        for (const v of urun.varyantlar) {
          const variantSku = uniqueCode(
            `${sku}-${skuPart(v.renk, 6)}-${skuPart(v.olcu, 10)}`,
            variantSkus,
          );
          const variantId = createId();
          await db.insert(productVariants).values({
            id: variantId,
            productId,
            sku: variantSku,
            size: v.olcu,
            colorName: v.renk,
            colorHex: COLOR_HEX[v.renk] ?? "#b9a69c",
            priceOverride: v.fiyatFarki ? urun.fiyat + v.fiyatFarki : null,
            stock: v.stok,
            sortOrder: variantOrder++,
          });
          stats.varyant++;

          if (v.stok > 0) {
            await db.insert(stockMovements).values({
              variantId,
              type: "PURCHASE",
              quantity: v.stok,
              note: "Katalog açılış stoğu",
            });
          }
        }

        console.log(`      + ürün: ${urun.ad} (${urun.varyantlar.length} varyant)`);
      }
    }
  }

  console.log("\n✓ Katalog yüklendi.");
  console.log(`   ana kategori : ${stats.anaKategori} eklendi`);
  console.log(`   alt kategori : ${stats.altKategori} eklendi`);
  console.log(`   ürün         : ${stats.urun} eklendi, ${stats.atlanan} zaten vardı (atlandı)`);
  console.log(`   varyant      : ${stats.varyant} eklendi`);
}

run()
  .then(async () => {
    await client?.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\n✗ Katalog yüklenemedi:", error);
    await client?.end();
    process.exit(1);
  });
