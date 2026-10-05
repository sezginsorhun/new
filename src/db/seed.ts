/**
 * ÖRNEK VERİ YÜKLEYİCİ
 *   npm run db:seed
 *
 * Kategoriler, ürünler, varyantlar (beden/renk/stok), kuponlar, sayfalar,
 * bannerlar ve bir admin kullanıcısı oluşturur.
 * Tekrar çalıştırıldığında mevcut kayıtları silip yeniden yazar.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { slugify } from "../lib/utils";
import { createId } from "../lib/id";
import {
  writeProductImage,
  writeBannerImage,
  writeCategoryImage,
} from "./placeholder-images";

// Bağlantı main() içinde açılır — dosya seviyesinde await kullanılamıyor.
let client: mysql.Connection;
let db: ReturnType<typeof drizzle<typeof schema, mysql.Connection>>;

const {
  users, categories, brands, products, productCategories, productImages,
  productVariants, coupons, settings, banners, pages, contactMessages,
  homeSections, mediaAssets, sessions, loginAttempts, auditLogs,
  twoFactorCodes, trustedDevices, userSecurity,
  newsletterSubscribers, orders, orderItems, payments, carts, cartItems,
  favorites, reviews, stockMovements, addresses,
} = schema;

/* ------------------------------ VERİ TANIMI ----------------------------- */

const CATEGORY_TREE = [
  {
    name: "Kadın", color: "Pudra",
    children: [
      { name: "Sütyen", color: "Pudra" },
      { name: "Külot", color: "Krem" },
      { name: "Takım", color: "Bordo" },
      { name: "Gecelik & Pijama", color: "Vizon" },
      { name: "Body & Korse", color: "Siyah" },
      { name: "Termal", color: "Gri" },
      { name: "Çorap", color: "Beyaz" },
    ],
  },
  {
    name: "Erkek", color: "Lacivert",
    children: [
      { name: "Boxer", color: "Lacivert" },
      { name: "Atlet", color: "Beyaz" },
      { name: "Erkek Pijama", color: "Gri" },
    ],
  },
  {
    name: "Plaj", color: "Mavi",
    children: [
      { name: "Bikini", color: "Mavi" },
      { name: "Mayo", color: "Siyah" },
    ],
  },
];

const BRA_SIZES = ["70B", "75B", "75C", "80B", "80C", "85C"];
const CLOTHING_SIZES = ["S", "M", "L", "XL"];
const NUMERIC_SIZES = ["36", "38", "40", "42"];

type SeedProduct = {
  name: string;
  category: string;
  price: number; // kuruş
  compareAtPrice?: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  material: string;
  description: string;
  isFeatured?: boolean;
  isNew?: boolean;
};

const COLORS = {
  siyah: { name: "Siyah", hex: "#1f1b1d" },
  beyaz: { name: "Beyaz", hex: "#f7f4f1" },
  pudra: { name: "Pudra", hex: "#e6c3ba" },
  bordo: { name: "Bordo", hex: "#6b2733" },
  vizon: { name: "Vizon", hex: "#c9ae99" },
  lacivert: { name: "Lacivert", hex: "#26304a" },
  gri: { name: "Gri", hex: "#9d9793" },
  krem: { name: "Krem", hex: "#eee3d2" },
  yesil: { name: "Yeşil", hex: "#3a5145" },
  mavi: { name: "Mavi", hex: "#9cb9cd" },
};

const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: "Lena Dantelli Balenli Sütyen",
    category: "Sütyen", price: 54900, compareAtPrice: 79900,
    sizes: BRA_SIZES, colors: [COLORS.siyah, COLORS.pudra, COLORS.beyaz],
    material: "%78 Poliamid %22 Elastan",
    description:
      "İnce dantel detayı ve esnek balen desteğiyle gün boyu konfor sunan sütyen. Ayarlanabilir askıları ve arkadan üç kademeli kopçası sayesinde vücuda tam oturur. Dolgusuz yapısı doğal bir görünüm verir.",
    isFeatured: true, isNew: true,
  },
  {
    name: "Lena Dantelli Külot",
    category: "Külot", price: 19900,
    sizes: CLOTHING_SIZES, colors: [COLORS.siyah, COLORS.pudra, COLORS.beyaz],
    material: "%78 Poliamid %22 Elastan",
    description:
      "Lena serisinin tamamlayıcı külodu. Yumuşak dantel bel bandı ve dikişsiz yan kesimi sayesinde kıyafet altında iz bırakmaz.",
    isFeatured: true,
  },
  {
    name: "Mira Dolgulu Push-Up Sütyen",
    category: "Sütyen", price: 62900,
    sizes: BRA_SIZES, colors: [COLORS.siyah, COLORS.vizon, COLORS.bordo],
    material: "%85 Poliamid %15 Elastan",
    description:
      "Hafif dolgu ve kaldırıcı kesimle belirgin bir form sağlayan push-up sütyen. Mat saten dokusu ve ince askı detayı ile hem günlük hem özel kullanıma uygun.",
    isFeatured: true,
  },
  {
    name: "Soft Touch Dikişsiz Sütyen",
    category: "Sütyen", price: 39900, compareAtPrice: 49900,
    sizes: CLOTHING_SIZES, colors: [COLORS.beyaz, COLORS.vizon, COLORS.siyah],
    material: "%92 Pamuk %8 Elastan",
    description:
      "Balensiz, dikişsiz ve etiketsiz yapısıyla hassas ciltler için tasarlandı. Nefes alan pamuklu kumaşı gün boyu terletmez; spor ve ev kullanımı için ideal.",
    isNew: true,
  },
  {
    name: "Ivy Dantel Takım",
    category: "Takım", price: 89900, compareAtPrice: 119900,
    sizes: CLOTHING_SIZES, colors: [COLORS.bordo, COLORS.siyah, COLORS.krem],
    material: "%80 Poliamid %20 Elastan",
    description:
      "Sütyen ve külottan oluşan dantel takım. Çiçek desenli tül işlemesi ve zarif fiyonk detayı ile hediye edilebilecek özel bir seri.",
    isFeatured: true, isNew: true,
  },
  {
    name: "Aria Saten Gecelik",
    category: "Gecelik & Pijama", price: 74900,
    sizes: CLOTHING_SIZES, colors: [COLORS.vizon, COLORS.siyah, COLORS.bordo],
    material: "%100 Polyester Saten",
    description:
      "Dökümlü saten kumaşı ve askılı V yaka kesimiyle rahat bir gecelik. Yanlardaki yırtmaç detayı hareket kolaylığı sağlar.",
    isFeatured: true,
  },
  {
    name: "Cloud Pamuklu Pijama Takımı",
    category: "Gecelik & Pijama", price: 84900,
    sizes: CLOTHING_SIZES, colors: [COLORS.gri, COLORS.pudra, COLORS.mavi],
    material: "%95 Pamuk %5 Elastan",
    description:
      "Uzun kollu üst ve tam boy alttan oluşan penye pijama takımı. Lastikli ve bağcıklı beli sayesinde ayarlanabilir; ilk yıkamada çekmeyen kumaş.",
  },
  {
    name: "Noir Dantelli Body",
    category: "Body & Korse", price: 94900,
    sizes: CLOTHING_SIZES, colors: [COLORS.siyah, COLORS.bordo],
    material: "%82 Poliamid %18 Elastan",
    description:
      "Vücudu saran dantel body. Alt kısmındaki çıtçıt detayı kullanım kolaylığı sağlar, ince askıları çıkarılabilir.",
    isNew: true,
  },
  {
    name: "Warm Termal Body",
    category: "Termal", price: 44900, compareAtPrice: 59900,
    sizes: CLOTHING_SIZES, colors: [COLORS.beyaz, COLORS.siyah, COLORS.gri],
    material: "%50 Pamuk %45 Modal %5 Elastan",
    description:
      "İçi pamuklu tüylendirilmiş termal body. Kıyafet altında kalınlık yapmadan sıcak tutar, soğuk kış günleri için ilk katman olarak tasarlandı.",
  },
  {
    name: "Bamboo Yüksek Bel Külot (3'lü)",
    category: "Külot", price: 29900,
    sizes: CLOTHING_SIZES, colors: [COLORS.siyah, COLORS.vizon, COLORS.beyaz],
    material: "%95 Bambu Viskon %5 Elastan",
    description:
      "Üç adetlik ekonomik paket. Bambu elyafın doğal antibakteriyel özelliği ve yüksek bel kesimi ile gün boyu rahatlık.",
    isFeatured: true,
  },
  {
    name: "Sheer İnce Külotlu Çorap 15 Den",
    category: "Çorap", price: 8900,
    sizes: ["1", "2", "3", "4"], colors: [COLORS.siyah, COLORS.vizon],
    material: "%92 Poliamid %8 Elastan",
    description:
      "15 denye ince külotlu çorap. Mat bitişi ve güçlendirilmiş burun yapısıyla kolay kaçmaz.",
  },
  {
    name: "Daily Pamuklu Boxer (3'lü)",
    category: "Boxer", price: 39900, compareAtPrice: 54900,
    sizes: CLOTHING_SIZES, colors: [COLORS.lacivert, COLORS.siyah, COLORS.gri],
    material: "%95 Pamuk %5 Elastan",
    description:
      "Üç adetlik pamuklu boxer paketi. Dokuma lastikli beli sıkmaz, likralı yapısı formunu kaybetmez.",
    isFeatured: true,
  },
  {
    name: "Pro Dikişsiz Spor Boxer",
    category: "Boxer", price: 24900,
    sizes: CLOTHING_SIZES, colors: [COLORS.siyah, COLORS.lacivert],
    material: "%88 Poliamid %12 Elastan",
    description:
      "Nem tutmayan mikrofiber kumaştan üretilen dikişsiz spor boxer. Antrenman sırasında iz ve sürtünme yapmaz.",
    isNew: true,
  },
  {
    name: "Basic Pamuklu Atlet (2'li)",
    category: "Atlet", price: 22900,
    sizes: CLOTHING_SIZES, colors: [COLORS.beyaz, COLORS.siyah],
    material: "%100 Pamuk",
    description:
      "Ribana örgülü, %100 pamuk atlet. Nefes alır, yıkamada deforme olmaz. İkili paket halinde gönderilir.",
  },
  {
    name: "Nova Üçgen Bikini Takımı",
    category: "Bikini", price: 79900, compareAtPrice: 99900,
    sizes: CLOTHING_SIZES, colors: [COLORS.mavi, COLORS.siyah, COLORS.bordo],
    material: "%80 Poliamid %20 Elastan",
    description:
      "Bağlamalı üçgen üst ve yüksek bel alt parçadan oluşan bikini takımı. Astarlı yapısı ve UV korumalı kumaşı ile yaz boyunca kullanılabilir.",
    isNew: true, isFeatured: true,
  },
  {
    name: "Marin Toparlayıcı Mayo",
    category: "Mayo", price: 89900,
    sizes: NUMERIC_SIZES, colors: [COLORS.siyah, COLORS.lacivert, COLORS.yesil],
    material: "%82 Poliamid %18 Elastan",
    description:
      "Karın bölgesini toparlayan çift katlı kumaş ve destekli göğüs kesimi. Klor dayanımlı kumaşı havuzda rengini korur.",
  },
  {
    name: "Comfort Modal Pijama Alt",
    category: "Erkek Pijama", price: 34900,
    sizes: CLOTHING_SIZES, colors: [COLORS.gri, COLORS.lacivert],
    material: "%60 Modal %40 Pamuk",
    description:
      "Modal karışımlı yumuşak pijama altı. Yan cepleri ve bağcıklı beli ile ev konforu için tasarlandı.",
  },
  {
    name: "Silk Touch Sabahlık",
    category: "Gecelik & Pijama", price: 109900,
    sizes: CLOTHING_SIZES, colors: [COLORS.pudra, COLORS.siyah, COLORS.krem],
    material: "%100 Polyester Saten",
    description:
      "Kendi kuşağıyla birlikte gelen uzun saten sabahlık. Gecelikle birlikte kombinlenebilir, hediye paketinde gönderilir.",
  },
];

/* --------------------------------- AKIŞ --------------------------------- */

async function main() {
  client = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    multipleStatements: false,
  });
  db = drizzle(client, { schema, mode: "default" });

  /* ----------------------- GÜVENLİK KİLİDİ -----------------------
   * Bu dosya örnek veri yükler ve bunu yapmadan önce TÜM TABLOLARI
   * BOŞALTIR. Canlıda yanlışlıkla çalışırsa gerçek siparişler ve
   * ürünler yok olur.
   *
   * Bu yüzden: veritabanında zaten veri varsa hiçbir şey yapmadan
   * çıkar. Gerçekten sıfırlamak istiyorsan SEED_FORCE=1 ver:
   *     SEED_FORCE=1 npm run db:seed
   */
  const [existingRows] = await client.query(
    "select (select count(*) from `users`) as u, (select count(*) from `products`) as p",
  );
  const existing = (existingRows as Array<{ u: number; p: number }>)[0];
  const hasData = (existing?.u ?? 0) > 0 || (existing?.p ?? 0) > 0;

  if (hasData && process.env.SEED_FORCE !== "1") {
    console.log(
      `ℹ Veritabanında zaten veri var (${existing.u} kullanıcı, ${existing.p} ürün).\n` +
        "  Örnek veriler YÜKLENMEDİ — mevcut veriler korundu.\n" +
        "  Gerçekten sıfırlamak istiyorsan: SEED_FORCE=1 npm run db:seed",
    );
    await client.end();
    return;
  }

  console.log("→ Mevcut veriler temizleniyor...");
  await db.delete(stockMovements);
  await db.delete(orderItems);
  await db.delete(payments);
  await db.delete(orders);
  await db.delete(cartItems);
  await db.delete(carts);
  await db.delete(favorites);
  await db.delete(reviews);
  await db.delete(productImages);
  await db.delete(productVariants);
  await db.delete(productCategories);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(brands);
  await db.delete(coupons);
  await db.delete(banners);
  await db.delete(homeSections);
  await db.delete(mediaAssets);
  await db.delete(auditLogs);
  await db.delete(loginAttempts);
  await db.delete(twoFactorCodes);
  await db.delete(trustedDevices);
  await db.delete(sessions);
  await db.delete(userSecurity);
  await db.delete(pages);
  await db.delete(contactMessages);
  await db.delete(newsletterSubscribers);
  await db.delete(addresses);
  await db.delete(users);
  await db.delete(settings);

  /* --- Kullanıcılar --- */
  console.log("→ Kullanıcılar...");
  const adminPass = await bcrypt.hash("Admin123!", 12);
  const customerPass = await bcrypt.hash("Test123!", 12);

  await db.insert(users).values([
    {
      email: "admin@alenora.com", passwordHash: adminPass,
      firstName: "Yönetici", lastName: "Hesabı", role: "ADMIN", phone: "05551112233",
    },
    {
      email: "musteri@ornek.com", passwordHash: customerPass,
      firstName: "Zeynep", lastName: "Demir", role: "CUSTOMER", phone: "05554445566",
    },
  ]);

  /* --- Yönetici güvenlik kaydı --- */
  // Adminde iki adımlı doğrulama açıktır. SMTP tanımlı değilse giriş kodu
  // sunucu konsoluna yazılır; yedek kodlar aşağıda bir kez gösterilir.
  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@alenora.com"))
    .limit(1);

  const backupPlain = Array.from({ length: 8 }, () =>
    randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g)!.join("-"),
  );
  await db.insert(userSecurity).values({
    userId: adminUser.id,
    twoFactorEnabled: true,
    backupCodes: await Promise.all(backupPlain.map((code) => bcrypt.hash(code, 10))),
  });

  /* --- Marka --- */
  // MySQL'de RETURNING yok: kimlikleri önce üretip öyle yazıyoruz.
  const brandId = createId();
  await db.insert(brands).values({ id: brandId, name: "Alenora", slug: "alenora" });
  const brand = { id: brandId };

  /* --- Kategoriler --- */
  console.log("→ Kategoriler...");
  const categoryIdBySlug = new Map<string, string>();
  let sort = 0;

  for (const parent of CATEGORY_TREE) {
    const parentSlug = slugify(parent.name);
    const parentCategoryId = createId();
    await db
      .insert(categories)
      .values({
        id: parentCategoryId,
        name: parent.name,
        slug: parentSlug,
        sortOrder: sort++,
        imageUrl: writeCategoryImage(`${parentSlug}.svg`, parent.name, parent.color),
        metaTitle: `${parent.name} İç Giyim`,
        metaDescription: `${parent.name} iç giyim ürünleri, en yeni koleksiyon ve indirimli fiyatlar.`,
      });
    const parentRow = { id: parentCategoryId };
    categoryIdBySlug.set(parentSlug, parentRow.id);

    for (const child of parent.children) {
      const childSlug = slugify(child.name);
      const childCategoryId = createId();
      await db
        .insert(categories)
        .values({
          id: childCategoryId,
          name: child.name,
          slug: childSlug,
          parentId: parentRow.id,
          sortOrder: sort++,
          imageUrl: writeCategoryImage(`${childSlug}.svg`, child.name, child.color),
          metaTitle: `${child.name} Modelleri`,
          metaDescription: `${child.name} modelleri ve fiyatları. Aynı gün kargo.`,
        });
      const childRow = { id: childCategoryId };
      categoryIdBySlug.set(childSlug, childRow.id);
    }
  }

  /* --- Ürünler --- */
  console.log("→ Ürünler, varyantlar ve görseller...");
  let skuCounter = 1000;
  let imageSeed = 3;

  for (const item of SEED_PRODUCTS) {
    const slug = slugify(item.name);
    const sku = `ALN-${skuCounter++}`;

    const productId = createId();
    await db
      .insert(products)
      .values({
        id: productId,
        name: item.name,
        slug,
        sku,
        description: item.description,
        shortDescription: item.description.split(".")[0] + ".",
        price: item.price,
        compareAtPrice: item.compareAtPrice ?? null,
        costPrice: Math.round(item.price * 0.42),
        taxRate: 10,
        brandId: brand.id,
        isFeatured: item.isFeatured ?? false,
        isNew: item.isNew ?? false,
        material: item.material,
        careInfo:
          "30°C'de ters yüz, çamaşır filesinde yıkayın. Çamaşır suyu kullanmayın, kurutma makinesine koymayın, düşük ısıda ütüleyin.",
        modelInfo: "Modelin ölçüleri: 1.74 m boy, 60 kg. Üzerindeki beden: M / 75B",
        weightGr: 180,
        metaTitle: item.name,
        metaDescription: item.description.slice(0, 155),
        soldCount: Math.floor(Math.random() * 120),
      });
    const product = { id: productId };

    // Kategori bağlantısı (alt kategori + üst kategori)
    const childId = categoryIdBySlug.get(slugify(item.category));
    if (childId) {
      await db.insert(productCategories).values({ productId: product.id, categoryId: childId });
      const parentEntry = CATEGORY_TREE.find((p) =>
        p.children.some((c) => c.name === item.category),
      );
      if (parentEntry) {
        const parentId = categoryIdBySlug.get(slugify(parentEntry.name));
        if (parentId) {
          await db
            .insert(productCategories)
            .values({ productId: product.id, categoryId: parentId });
        }
      }
    }

    // Her renk için bir görsel
    let order = 0;
    for (const color of item.colors) {
      const file = `${slug}-${slugify(color.name)}.svg`;
      const url = writeProductImage(
        file,
        item.name.split(" ").slice(0, 2).join(" "),
        color.name,
        color.name,
        imageSeed++,
      );
      await db.insert(productImages).values({
        productId: product.id,
        url,
        alt: `${item.name} — ${color.name}`,
        colorName: color.name,
        sortOrder: order++,
      });
    }

    // Varyantlar: her renk × her beden
    let variantOrder = 0;
    for (const color of item.colors) {
      for (const size of item.sizes) {
        const stock = Math.floor(Math.random() * 18); // 0-17 (bazıları tükenmiş görünsün)
        const variantId = createId();
        await db
          .insert(productVariants)
          .values({
            id: variantId,
            productId: product.id,
            sku: `${sku}-${slugify(color.name).slice(0, 3).toUpperCase()}-${size}`,
            size,
            colorName: color.name,
            colorHex: color.hex,
            stock,
            sortOrder: variantOrder++,
          });
        const variant = { id: variantId };

        if (stock > 0) {
          await db.insert(stockMovements).values({
            variantId: variant.id,
            type: "PURCHASE",
            quantity: stock,
            note: "Açılış stoğu",
          });
        }
      }
    }
  }

  /* --- Kuponlar --- */
  console.log("→ Kuponlar...");
  await db.insert(coupons).values([
    {
      code: "HOSGELDIN10", type: "PERCENT", value: 10,
      minOrderTotal: 30000, maxDiscount: 15000, usageLimit: 1000,
    },
    {
      code: "KARGOBEDAVA", type: "FREE_SHIPPING", value: 0,
      minOrderTotal: 20000, usageLimit: 500,
    },
    {
      code: "YAZ50", type: "FIXED", value: 5000,
      minOrderTotal: 50000, usageLimit: 200,
    },
  ]);

  /* --- Carousel slaytları --- */
  console.log("→ Carousel slaytları...");
  const heroImages = [
    { file: "hero-1.svg", color: "Pudra" },
    { file: "hero-2.svg", color: "Vizon" },
    { file: "hero-3.svg", color: "Lacivert" },
  ].map((item) => writeBannerImage(item.file, item.color));

  await db.insert(banners).values([
    {
      eyebrow: "Yeni sezon",
      title: "Dantel Koleksiyonu",
      subtitle: "İnce dantel, esnek destek, gün boyu konfor.",
      imageUrl: heroImages[0],
      imageAlt: "Dantelli iç giyim takımı",
      linkUrl: "/kategori/kadin",
      buttonLabel: "Koleksiyonu keşfet",
      secondaryLabel: "Tüm yenilikler",
      secondaryUrl: "/kategori/kadin",
      align: "left", theme: "light", overlay: 32,
      position: "home_hero", sortOrder: 10, isActive: true,
    },
    {
      eyebrow: "Gün boyu rahatlık",
      title: "Pamuklu Konfor Serisi",
      subtitle: "Nefes alan sertifikalı kumaş, dikişsiz kesim.",
      imageUrl: heroImages[1],
      imageAlt: "Pamuklu iç giyim serisi",
      linkUrl: "/kategori/kulot",
      buttonLabel: "Ürünleri gör",
      align: "left", theme: "light", overlay: 28,
      position: "home_hero", sortOrder: 20, isActive: true,
    },
    {
      eyebrow: "3'lü paketlerde avantaj",
      title: "Erkek İç Giyim",
      subtitle: "Boxer ve atletlerde çoklu paket fiyatları.",
      imageUrl: heroImages[2],
      imageAlt: "Erkek iç giyim paketleri",
      linkUrl: "/kategori/erkek",
      buttonLabel: "İncele",
      align: "left", theme: "light", overlay: 35,
      position: "home_hero", sortOrder: 30, isActive: true,
    },
  ]);

  // Slayt görselleri medya kütüphanesine de eklenir ki panelden
  // tekrar seçilebilsinler.
  await db.insert(mediaAssets).values(
    heroImages.map((url, index) => ({
      url,
      fileName: `hero-${index + 1}.svg`,
      mimeType: "image/svg+xml",
      sizeBytes: 0,
      alt: "Örnek slayt görseli",
      folder: "slaytlar",
      // Bu görseller depoda duran statik dosyalar, yüklenmiş değil
      storage: "file",
    })),
  );

  /* --- Ana sayfa düzeni --- */
  console.log("→ Ana sayfa düzeni...");
  const { DEFAULT_SECTIONS } = await import("../lib/home-config");
  const promoImage = writeBannerImage("promo-1.svg", "Bordo");
  await db.insert(homeSections).values(
    DEFAULT_SECTIONS.map((section) => ({
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      // Tanıtım bandına örnek bir görsel ver; panelden değiştirilebilir.
      config:
        section.type === "promo"
          ? { ...section.config, imageUrl: promoImage }
          : section.config,
      sortOrder: section.sortOrder,
      isActive: section.isActive,
    })),
  );

  await db.insert(mediaAssets).values({
    url: promoImage,
    fileName: "promo-1.svg",
    mimeType: "image/svg+xml",
    sizeBytes: 0,
    alt: "Örnek tanıtım görseli",
    folder: "tanitim",
    storage: "file",
  });

  /* --- Kurumsal sayfalar --- */
  console.log("→ Sayfalar...");
  await db.insert(pages).values([
    {
      slug: "hakkimizda", title: "Hakkımızda",
      content:
        "Alenora, her bedene ve her tene yakışan iç giyim üretmek için kuruldu. Ürünlerimizi İstanbul'daki atölyemizde, insan sağlığına uygun sertifikalı kumaşlarla üretiyoruz.\n\nAmacımız, iç giyimin yalnızca görünen değil, gün boyu hissedilen bir konfor olduğunu göstermek. Bu yüzden her modeli üretime almadan önce gerçek kullanıcılarla test ediyoruz.",
    },
    {
      slug: "iade-ve-degisim", title: "İade ve Değişim Koşulları",
      content:
        "Teslim aldığınız tarihten itibaren 14 gün içinde, hijyen etiketi çıkarılmamış ve kullanılmamış ürünleri iade veya değişim için gönderebilirsiniz.\n\nİade süreci:\n1. Hesabım > Siparişlerim bölümünden iade talebi oluşturun.\n2. Ürünü orijinal ambalajı ve faturasıyla paketleyin.\n3. Size ileteceğimiz anlaşmalı kargo koduyla ücretsiz gönderin.\n\nİade onaylandıktan sonra ödeme, kartınıza 3-10 iş günü içinde yansır.\n\nHijyen kuralları gereği hijyen etiketi çıkarılmış külot, boxer, mayo ve bikini altları iade alınamaz.",
    },
    {
      slug: "teslimat-ve-kargo", title: "Teslimat ve Kargo",
      content:
        "Saat 15:00'e kadar verilen siparişler aynı gün kargoya teslim edilir. Kargo süresi Türkiye içinde ortalama 1-3 iş günüdür.\n\n750 TL ve üzeri siparişlerde kargo ücretsizdir. Bu tutarın altındaki siparişlerde 49,90 TL kargo bedeli uygulanır.\n\nKapıda ödeme seçeneğinde 15 TL hizmet bedeli eklenir.",
    },
    {
      slug: "gizlilik-politikasi", title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
      content:
        "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında hazırlanmıştır.\n\nToplanan veriler: ad-soyad, e-posta, telefon, teslimat ve fatura adresi, sipariş geçmişi.\n\nİşleme amacı: siparişin oluşturulması, ödemenin alınması, kargo teslimi, yasal saklama yükümlülükleri ve talep etmeniz halinde pazarlama iletişimi.\n\nKart bilgileri: kredi kartı bilgileriniz sitemizde saklanmaz. Ödeme, lisanslı ödeme kuruluşu iyzico altyapısı üzerinden 3D Secure ile alınır.\n\nHaklarınız: verilerinize erişme, düzeltme, silinmesini isteme ve işlenmesine itiraz etme hakkınız vardır. Talepleriniz için info@alenora.com adresine yazabilirsiniz.\n\nNOT: Bu metin örnek şablondur. Yayına almadan önce bir avukata kontrol ettirmeniz gerekir.",
    },
    {
      slug: "mesafeli-satis-sozlesmesi", title: "Mesafeli Satış Sözleşmesi",
      content:
        "MADDE 1 — TARAFLAR\nSatıcı: [Firma unvanı, adres, vergi no, telefon]\nAlıcı: Sipariş formunda belirtilen kişi.\n\nMADDE 2 — KONU\nBu sözleşme, alıcının satıcıya ait internet sitesi üzerinden elektronik ortamda sipariş verdiği ürünlerin satışı ve teslimi ile ilgili tarafların hak ve yükümlülüklerini düzenler.\n\nMADDE 3 — CAYMA HAKKI\nAlıcı, teslim tarihinden itibaren 14 gün içinde hiçbir gerekçe göstermeksizin cayma hakkına sahiptir. Hijyen etiketi açılmış iç giyim ürünleri bu hakkın kapsamı dışındadır.\n\nNOT: Bu metin örnek şablondur. Yayına almadan önce mutlaka bir avukata kontrol ettirin.",
    },
  ]);

  /* --- Ayarlar --- */
  console.log("→ Ayarlar...");
  const { DEFAULT_SETTINGS } = await import("../lib/default-settings");
  await db
    .insert(settings)
    .values(Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value })));

  /* --- Özet --- */
  const countOf = async (table: string) => {
    const [rows] = await client.query(`select count(*) as c from \`${table}\``);
    return (rows as Array<{ c: number }>)[0]?.c ?? 0;
  };
  const productCount = await countOf("products");
  const variantCount = await countOf("product_variants");
  const categoryCount = await countOf("categories");

  console.log("\n✓ Örnek veriler yüklendi");
  console.log(`  ${categoryCount} kategori, ${productCount} ürün, ${variantCount} varyant`);
  console.log("\n  Admin girişi : admin@alenora.com / Admin123!");
  console.log("  Müşteri      : musteri@ornek.com / Test123!");
  console.log(`\n  Yönetim paneli: /${process.env.ADMIN_PATH ?? "yonetim"}`);
  console.log("  Admin girişinde e-postaya 6 haneli kod gider.");
  console.log("  SMTP tanımlı değilse kod sunucu konsoluna yazılır.");
  console.log("\n  YEDEK KODLAR (bir kez gösterilir, güvenli bir yere kaydet):");
  for (const code of backupPlain) console.log("    " + code);
  console.log("");

  await client.end();
}

main().catch(async (error) => {
  console.error("Seed hatası:", error);
  await client.end();
  process.exit(1);
});
