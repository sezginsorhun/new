/**
 * VERİTABANI ŞEMASI — İç giyim e-ticaret
 * MySQL / MariaDB + Drizzle ORM
 *
 * ÖNEMLİ KURAL: Tüm para alanları KURUŞ cinsinden tam sayı (integer) tutulur.
 * 299,90 TL  ->  29990
 * Böylece ondalık yuvarlama hataları hiç oluşmaz.
 */

import {
  mysqlTable,
  text,
  varchar,
  int,
  boolean,
  datetime,
  json,
  mysqlEnum,
  uniqueIndex,
  index,
  primaryKey,
  customType,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { createId } from "@/lib/id";

/**
 * İkili veri sütunu (MySQL `longblob`) — Drizzle'ın hazır tipi yok.
 * Görsel baytları burada saklanır; 4 GB'a kadar veri alır.
 */
const binaryColumn = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "longblob",
});

/* ========================================================================== */
/*  ENUM'LAR                                                                  */
/* ========================================================================== */

/**
 * Roller tek bir yerde tanımlıdır: src/lib/permissions.ts
 * Şema oradan okur ki rol listesi ile yetki haritası birbirinden kopmasın.
 */
export { ROLE_VALUES } from "@/lib/permissions";
import { ROLE_VALUES as ROLE_VALUES_FOR_ENUM } from "@/lib/permissions";

export const ORDER_STATUS_VALUES = [
  "PENDING", // ödeme bekleniyor
  "PAID", // ödeme alındı
  "PREPARING", // hazırlanıyor
  "SHIPPED", // kargoya verildi
  "DELIVERED", // teslim edildi
  "CANCELLED", // iptal edildi
  "REFUNDED", // iade edildi
  "FAILED", // ödeme başarısız
] as const;

export const PAYMENT_METHOD_VALUES = [
  "CREDIT_CARD", // iyzico 3D Secure
  "BANK_TRANSFER", // havale / EFT
  "CASH_ON_DELIVERY", // kapıda ödeme
] as const;

export const PAYMENT_STATUS_VALUES = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
] as const;

export const COUPON_TYPE_VALUES = [
  "PERCENT", // yüzde indirim
  "FIXED", // sabit tutar indirim
  "FREE_SHIPPING", // ücretsiz kargo
] as const;

export const STOCK_MOVEMENT_VALUES = [
  "PURCHASE", // mal girişi
  "SALE", // satış
  "RETURN", // müşteri iadesi
  "CANCEL", // iptal iadesi
  "MANUAL", // elle düzeltme
] as const;

/* ========================================================================== */
/*  KULLANICI                                                                 */
/* ========================================================================== */

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 25 }),
    role: mysqlEnum("role", ROLE_VALUES_FOR_ENUM).notNull().default("CUSTOMER"),
    isActive: boolean("is_active").notNull().default(true),
    acceptsMarketing: boolean("accepts_marketing").notNull().default(false),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const addresses = mysqlTable(
  "addresses",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    userId: varchar("user_id", { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 60 }).notNull(), // "Ev", "İş"
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 25 }).notNull(),
    city: varchar("city", { length: 60 }).notNull(), // İl
    district: varchar("district", { length: 60 }).notNull(), // İlçe
    line1: text("line1").notNull(), // Açık adres
    zipCode: varchar("zip_code", { length: 12 }),
    // Kurumsal fatura
    isCorporate: boolean("is_corporate").notNull().default(false),
    companyName: varchar("company_name", { length: 200 }),
    taxOffice: varchar("tax_office", { length: 120 }),
    taxNumber: varchar("tax_number", { length: 30 }),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

/* ========================================================================== */
/*  KATALOG                                                                   */
/* ========================================================================== */

export const categories = mysqlTable(
  "categories",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    parentId: varchar("parent_id", { length: 30 }),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    showInMenu: boolean("show_in_menu").notNull().default(true),
    metaTitle: varchar("meta_title", { length: 200 }),
    metaDescription: text("meta_description"),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("categories_slug_uq").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
  ],
);

export const brands = mysqlTable(
  "brands",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    logoUrl: text("logo_url"),
  },
  (t) => [uniqueIndex("brands_slug_uq").on(t.slug)],
);

export const products = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    name: varchar("name", { length: 250 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    sku: varchar("sku", { length: 60 }).notNull(),
    description: text("description").notNull().$defaultFn(() => ""),
    shortDescription: text("short_description"),

    // --- Para alanları: KURUŞ ---
    price: int("price").notNull(), // satış fiyatı
    compareAtPrice: int("compare_at_price"), // üstü çizili eski fiyat
    costPrice: int("cost_price"), // alış maliyeti (sadece admin)
    taxRate: int("tax_rate").notNull().default(10), // KDV %

    brandId: varchar("brand_id", { length: 30 }).references(() => brands.id, {
      onDelete: "set null",
    }),

    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),

    weightGr: int("weight_gr"), // kargo hesabı için gram

    // İç giyime özel alanlar
    material: varchar("material", { length: 250 }), // %95 Pamuk %5 Elastan
    careInfo: text("care_info"), // yıkama talimatı
    modelInfo: text("model_info"), // "Modelin ölçüleri: 1.75 / 75B"

    metaTitle: varchar("meta_title", { length: 200 }),
    metaDescription: text("meta_description"),

    viewCount: int("view_count").notNull().default(0),
    soldCount: int("sold_count").notNull().default(0),

    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    uniqueIndex("products_sku_uq").on(t.sku),
    index("products_active_idx").on(t.isActive),
  ],
);

export const productCategories = mysqlTable(
  "product_categories",
  {
    productId: varchar("product_id", { length: 30 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: varchar("category_id", { length: 30 })
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);

export const productImages = mysqlTable(
  "product_images",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    productId: varchar("product_id", { length: 30 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 250 }),
    sortOrder: int("sort_order").notNull().default(0),
    colorName: varchar("color_name", { length: 60 }), // bu görsel hangi renge ait
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

/**
 * Beden + renk kombinasyonu. STOK BURADA TUTULUR.
 * Örn: "Siyah / 75B" -> stock: 12
 */
export const productVariants = mysqlTable(
  "product_variants",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    productId: varchar("product_id", { length: 30 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 80 }).notNull(),
    barcode: varchar("barcode", { length: 60 }),

    size: varchar("size", { length: 30 }).notNull(), // 70B, 75C, S, M, L, 38
    colorName: varchar("color_name", { length: 60 }).notNull(), // Siyah
    colorHex: varchar("color_hex", { length: 9 }).notNull().default("#000000"),

    priceOverride: int("price_override"), // ürün fiyatından farklıysa

    stock: int("stock").notNull().default(0),
    lowStockAlert: int("low_stock_alert").notNull().default(3),

    isActive: boolean("is_active").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("variants_sku_uq").on(t.sku),
    uniqueIndex("variants_combo_uq").on(t.productId, t.size, t.colorName),
    index("variants_product_idx").on(t.productId),
  ],
);

export const stockMovements = mysqlTable(
  "stock_movements",
  {
    id: int("id").primaryKey().autoincrement(),
    variantId: varchar("variant_id", { length: 30 })
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", STOCK_MOVEMENT_VALUES).notNull(),
    quantity: int("quantity").notNull(), // + giriş / - çıkış
    note: text("note"),
    orderId: varchar("order_id", { length: 30 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("stock_movements_variant_idx").on(t.variantId)],
);

export const reviews = mysqlTable(
  "reviews",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    productId: varchar("product_id", { length: 30 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: int("rating").notNull(), // 1-5
    title: varchar("title", { length: 200 }),
    comment: text("comment").notNull(),
    isApproved: boolean("is_approved").notNull().default(false),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("reviews_product_user_uq").on(t.productId, t.userId),
    index("reviews_product_idx").on(t.productId),
  ],
);

export const favorites = mysqlTable(
  "favorites",
  {
    userId: varchar("user_id", { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 30 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

/* ========================================================================== */
/*  SEPET                                                                     */
/* ========================================================================== */

export const carts = mysqlTable(
  "carts",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    userId: varchar("user_id", { length: 30 }).references(() => users.id, {
      onDelete: "cascade",
    }),
    token: varchar("token", { length: 60 }).notNull(), // misafir sepeti cookie anahtarı
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("carts_token_uq").on(t.token), index("carts_user_idx").on(t.userId)],
);

export const cartItems = mysqlTable(
  "cart_items",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    cartId: varchar("cart_id", { length: 30 })
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: varchar("variant_id", { length: 30 })
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: int("quantity").notNull().default(1),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("cart_items_uq").on(t.cartId, t.variantId)],
);

/* ========================================================================== */
/*  SİPARİŞ                                                                   */
/* ========================================================================== */

/**
 * SAYAÇLAR
 *
 * MySQL'de PostgreSQL'deki gibi "sequence" nesnesi yoktur. Sipariş numarası
 * gibi sırayla artması gereken değerler bu tabloda tutulur ve
 * `UPDATE ... LAST_INSERT_ID(value + 1)` kalıbıyla artırılır. Bu kalıp tek
 * sorguda hem artırır hem değeri döner, bu yüzden aynı anda gelen iki
 * sipariş asla aynı numarayı alamaz.
 */
export const counters = mysqlTable("counters", {
  name: varchar("name", { length: 40 }).primaryKey(),
  value: int("value").notNull().default(0),
});

export const orders = mysqlTable(
  "orders",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    orderNumber: varchar("order_number", { length: 30 }).notNull(), // SP-2026-000123
    userId: varchar("user_id", { length: 30 }).references(() => users.id, {
      onDelete: "set null",
    }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 25 }).notNull(),

    status: mysqlEnum("status", ORDER_STATUS_VALUES).notNull().default("PENDING"),
    paymentMethod: mysqlEnum("payment_method", PAYMENT_METHOD_VALUES).notNull(),
    paymentStatus: mysqlEnum("payment_status", PAYMENT_STATUS_VALUES).notNull().default("PENDING"),

    // --- Tutarlar: KURUŞ ---
    subtotal: int("subtotal").notNull(),
    discountTotal: int("discount_total").notNull().default(0),
    shippingTotal: int("shipping_total").notNull().default(0),
    grandTotal: int("grand_total").notNull(),

    couponCode: varchar("coupon_code", { length: 40 }),
    installment: int("installment").notNull().default(1),

    // Adresin anlık kopyası — adres sonradan silinse/değişse sipariş bozulmaz
    shippingAddress: json("shipping_address").notNull(),
    billingAddress: json("billing_address").notNull(),

    shippingCompany: varchar("shipping_company", { length: 80 }),
    trackingNumber: varchar("tracking_number", { length: 80 }),
    shippedAt: datetime("shipped_at", { mode: "date" }),
    deliveredAt: datetime("delivered_at", { mode: "date" }),

    customerNote: text("customer_note"),
    adminNote: text("admin_note"),

    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("orders_number_uq").on(t.orderNumber),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    orderId: varchar("order_id", { length: 30 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: varchar("variant_id", { length: 30 }).references(() => productVariants.id, {
      onDelete: "set null",
    }),

    // Ürün bilgisinin anlık kopyası
    productSlug: varchar("product_slug", { length: 280 }),
    productName: varchar("product_name", { length: 250 }).notNull(),
    variantInfo: varchar("variant_info", { length: 120 }).notNull(), // "Siyah / 75B"
    sku: varchar("sku", { length: 80 }).notNull(),
    imageUrl: text("image_url"),

    unitPrice: int("unit_price").notNull(), // kuruş
    quantity: int("quantity").notNull(),
    taxRate: int("tax_rate").notNull().default(10),
    lineTotal: int("line_total").notNull(), // kuruş
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const payments = mysqlTable(
  "payments",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    orderId: varchar("order_id", { length: 30 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    provider: varchar("provider", { length: 40 }).notNull().default("iyzico"),
    status: mysqlEnum("status", PAYMENT_STATUS_VALUES).notNull().default("PENDING"),
    amount: int("amount").notNull(), // kuruş

    /*
     * Sağlayıcı alanları.
     * TS tarafındaki adlar bilerek nötr: sanal POS değişince kod değişmesin.
     * Veritabanı sütun adları eski hâliyle bırakıldı (iyzico_payment_id) —
     * yeniden adlandırmak veri taşıma gerektirirdi, hiçbir faydası yok.
     * Hangi sağlayıcının işlediği `provider` sütununda yazar.
     */
    conversationId: varchar("conversation_id", { length: 60 }),
    providerPaymentId: varchar("iyzico_payment_id", { length: 60 }),
    providerTransactionId: varchar("iyzico_transaction_id", { length: 60 }),
    installment: int("installment").notNull().default(1),
    cardFamily: varchar("card_family", { length: 40 }), // Bonus, World, Axess
    cardAssociation: varchar("card_association", { length: 40 }), // VISA, MASTER_CARD
    lastFourDigits: varchar("last_four_digits", { length: 4 }),
    binNumber: varchar("bin_number", { length: 8 }),
    errorCode: varchar("error_code", { length: 40 }),
    errorMessage: text("error_message"),
    rawResponse: json("raw_response"),

    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("payments_order_idx").on(t.orderId),
    index("payments_conversation_idx").on(t.conversationId),
  ],
);

/* ========================================================================== */
/*  KAMPANYA                                                                  */
/* ========================================================================== */

export const coupons = mysqlTable(
  "coupons",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    code: varchar("code", { length: 40 }).notNull(),
    type: mysqlEnum("type", COUPON_TYPE_VALUES).notNull(),
    value: int("value").notNull(), // PERCENT: 10 = %10 | FIXED: kuruş
    minOrderTotal: int("min_order_total").notNull().default(0), // kuruş
    maxDiscount: int("max_discount"), // kuruş — yüzde indirimde üst sınır
    usageLimit: int("usage_limit"),
    usedCount: int("used_count").notNull().default(0),
    startsAt: datetime("starts_at", { mode: "date" }),
    endsAt: datetime("ends_at", { mode: "date" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("coupons_code_uq").on(t.code)],
);

/* ========================================================================== */
/*  İÇERİK & AYARLAR                                                          */
/* ========================================================================== */

/** key/value ayar tablosu: kargo ücreti, ücretsiz kargo limiti, iletişim vb. */
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * BANNER / SLAYT
 * Ana sayfa carousel'i ve diğer tanıtım alanları buradan beslenir.
 * Görseller medya kütüphanesinden seçilir; masaüstü ve mobil için ayrı
 * görsel verilebilir (mobilde dikey kesim daha iyi durur).
 */
export const banners = mysqlTable(
  "banners",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    eyebrow: varchar("eyebrow", { length: 80 }), // başlığın üstündeki küçük yazı
    title: varchar("title", { length: 200 }),
    subtitle: varchar("subtitle", { length: 250 }),
    imageUrl: text("image_url").notNull(),
    mobileImageUrl: text("mobile_image_url"),
    imageAlt: varchar("image_alt", { length: 250 }),
    linkUrl: text("link_url"),
    buttonLabel: varchar("button_label", { length: 60 }),
    secondaryLabel: varchar("secondary_label", { length: 60 }),
    secondaryUrl: text("secondary_url"),

    // Görünüm
    align: varchar("align", { length: 10 }).notNull().default("left"), // left | center | right
    theme: varchar("theme", { length: 10 }).notNull().default("light"), // yazı rengi: light | dark
    overlay: int("overlay").notNull().default(25), // karartma yüzdesi 0-80

    position: varchar("position", { length: 40 }).notNull().default("home_hero"),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),

    // Yayın takvimi (boşsa her zaman yayında)
    startsAt: datetime("starts_at", { mode: "date" }),
    endsAt: datetime("ends_at", { mode: "date" }),

    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("banners_position_idx").on(t.position, t.sortOrder)],
);

/**
 * MEDYA KÜTÜPHANESİ
 * Yüklenen her görsel burada kayıtlıdır; banner, kategori ve ürünlerde
 * tekrar tekrar seçilebilir.
 *
 * DEPOLAMA: Yönetilen hosting paketlerinde (Hostinger Web Apps, Vercel vb.)
 * sunucunun dosya sistemi her dağıtımda sıfırlanır. Bu yüzden görsel
 * verisi varsayılan olarak VERİTABANINDA (`data` sütunu) saklanır ve
 * /api/gorsel/<id> adresinden sunulur. Yerel geliştirmede dosya sistemi
 * sürücüsü de kullanılabilir — bkz. src/lib/storage.ts
 */
export const mediaAssets = mysqlTable(
  "media_assets",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    url: text("url").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: int("size_bytes").notNull().default(0),
    width: int("width"),
    height: int("height"),
    alt: varchar("alt", { length: 250 }),
    folder: varchar("folder", { length: 60 }).notNull().default("genel"),
    uploadedBy: varchar("uploaded_by", { length: 30 }),
    /** "db" (veritabanı) | "file" (public/uploads) | "remote" (dış adres) */
    storage: varchar("storage", { length: 10 }).notNull().default("db"),
    /** storage = "db" ise görselin ham baytları burada durur */
    data: binaryColumn("data"),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("media_folder_idx").on(t.folder), index("media_created_idx").on(t.createdAt)],
);

/**
 * ANA SAYFA BÖLÜMLERİ
 * Ana sayfada görünen her blok burada bir satırdır. Sırası değiştirilebilir,
 * kapatılabilir, ayarları `config` içinde JSON olarak tutulur.
 */
export const homeSections = mysqlTable(
  "home_sections",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    type: varchar("type", { length: 40 }).notNull(), // hero | categories | products | usp | promo | newsletter | richtext
    title: varchar("title", { length: 200 }),
    subtitle: varchar("subtitle", { length: 250 }),
    config: json("config"),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("home_sections_sort_idx").on(t.sortOrder)],
);

/* ========================================================================== */
/*  GÜVENLİK                                                                  */
/* ========================================================================== */

/**
 * OTURUMLAR
 * Çerezdeki JWT tek başına yeterli değildir: her istekte buradaki kayıt da
 * kontrol edilir. Böylece bir oturum anında iptal edilebilir (çalınan cihaz,
 * şifre değişimi, "tüm cihazlardan çıkış").
 * Token'ın kendisi değil, SHA-256 özeti saklanır.
 */
export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    userId: varchar("user_id", { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    userAgent: varchar("user_agent", { length: 400 }),
    ip: varchar("ip", { length: 60 }),
    /** Admin oturumu 2FA ile doğrulandı mı? */
    twoFactorAt: datetime("two_factor_at", { mode: "date" }),
    lastSeenAt: datetime("last_seen_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    revokedAt: datetime("revoked_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("sessions_token_uq").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
    index("sessions_expires_idx").on(t.expiresAt),
  ],
);

/**
 * GİRİŞ DENEMELERİ
 * Hem e-posta hem IP bazlı sayaç için ham kayıt. Eski kayıtlar periyodik
 * olarak silinir.
 */
export const loginAttempts = mysqlTable(
  "login_attempts",
  {
    id: int("id").primaryKey().autoincrement(),
    /** "email:ayse@x.com" veya "ip:1.2.3.4" */
    identifier: varchar("identifier", { length: 120 }).notNull(),
    success: boolean("success").notNull().default(false),
    ip: varchar("ip", { length: 60 }),
    userAgent: varchar("user_agent", { length: 400 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("login_attempts_idx").on(t.identifier, t.createdAt)],
);

/**
 * HESAP GÜVENLİK DURUMU
 * Ardışık hatalı deneme sayısı ve geçici kilit burada tutulur.
 */
export const userSecurity = mysqlTable("user_security", {
  userId: varchar("user_id", { length: 30 })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  failedCount: int("failed_count").notNull().default(0),
  lockedUntil: datetime("locked_until", { mode: "date" }),
  lastLoginAt: datetime("last_login_at", { mode: "date" }),
  lastLoginIp: varchar("last_login_ip", { length: 60 }),
  passwordChangedAt: datetime("password_changed_at", { mode: "date" }),
  /** Admin hesaplarında 2FA zorunludur; müşteri isteğe bağlı açabilir. */
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  /** Tek kullanımlık yedek kodların bcrypt özetleri */
  backupCodes: json("backup_codes"),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * İKİ ADIMLI DOĞRULAMA KODLARI
 * Kodun kendisi değil bcrypt özeti saklanır; 10 dakika geçerli, tek kullanımlık.
 */
export const twoFactorCodes = mysqlTable(
  "two_factor_codes",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    userId: varchar("user_id", { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    purpose: varchar("purpose", { length: 30 }).notNull().default("login"),
    attempts: int("attempts").notNull().default(0),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    usedAt: datetime("used_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("two_factor_user_idx").on(t.userId, t.createdAt)],
);

/**
 * GÜVENİLİR CİHAZLAR
 * "Bu cihazı 30 gün hatırla" seçilirse 2FA tekrar sorulmaz.
 */
export const trustedDevices = mysqlTable(
  "trusted_devices",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    userId: varchar("user_id", { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    label: varchar("label", { length: 160 }),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("trusted_devices_token_uq").on(t.tokenHash),
    index("trusted_devices_user_idx").on(t.userId),
  ],
);

/**
 * DENETİM KAYDI (AUDIT LOG)
 * Panelde yapılan her değiştirici işlem buraya yazılır. Silinmez.
 */
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: varchar("user_id", { length: 30 }),
    actorEmail: varchar("actor_email", { length: 255 }),
    action: varchar("action", { length: 80 }).notNull(), // product.update, order.status, auth.login ...
    entity: varchar("entity", { length: 60 }), // product, order, user ...
    entityId: varchar("entity_id", { length: 60 }),
    summary: varchar("summary", { length: 400 }),
    meta: json("meta"),
    ip: varchar("ip", { length: 60 }),
    userAgent: varchar("user_agent", { length: 400 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("audit_created_idx").on(t.createdAt),
    index("audit_action_idx").on(t.action),
    index("audit_user_idx").on(t.userId),
  ],
);

export const pages = mysqlTable(
  "pages",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    slug: varchar("slug", { length: 120 }).notNull(), // iade-kosullari
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("pages_slug_uq").on(t.slug)],
);

export const newsletterSubscribers = mysqlTable(
  "newsletter_subscribers",
  {
    id: int("id").primaryKey().autoincrement(),
    email: varchar("email", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("newsletter_email_uq").on(t.email)],
);

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 25 }),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: datetime("created_at", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

/* ========================================================================== */
/*  İLİŞKİLER (Drizzle relational queries için)                               */
/* ========================================================================== */

export const usersRelations = relations(users, ({ many, one }) => ({
  addresses: many(addresses),
  orders: many(orders),
  favorites: many(favorites),
  reviews: many(reviews),
  cart: one(carts, { fields: [users.id], references: [carts.userId] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryTree",
  }),
  children: many(categories, { relationName: "categoryTree" }),
  products: many(productCategories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  images: many(productImages),
  variants: many(productVariants),
  categories: many(productCategories),
  reviews: many(reviews),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  cartItems: many(cartItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  product: one(products, { fields: [favorites.productId], references: [products.id] }),
}));

/* ========================================================================== */
/*  TİPLER                                                                    */
/* ========================================================================== */

export type User = typeof users.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;

export type AddressSnapshot = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  line1: string;
  zipCode?: string | null;
  isCorporate?: boolean;
  companyName?: string | null;
  taxOffice?: string | null;
  taxNumber?: string | null;
};

export { sql };
