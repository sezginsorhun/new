/**
 * VERİTABANI ŞEMASI — İç giyim e-ticaret
 * PostgreSQL + Drizzle ORM
 *
 * ÖNEMLİ KURAL: Tüm para alanları KURUŞ cinsinden tam sayı (integer) tutulur.
 * 299,90 TL  ->  29990
 * Böylece ondalık yuvarlama hataları hiç oluşmaz.
 */

import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
  serial,
  pgSequence,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createId } from "@/lib/id";

/* ========================================================================== */
/*  ENUM'LAR                                                                  */
/* ========================================================================== */

export const roleEnum = pgEnum("role", ["CUSTOMER", "ADMIN"]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING", // ödeme bekleniyor
  "PAID", // ödeme alındı
  "PREPARING", // hazırlanıyor
  "SHIPPED", // kargoya verildi
  "DELIVERED", // teslim edildi
  "CANCELLED", // iptal edildi
  "REFUNDED", // iade edildi
  "FAILED", // ödeme başarısız
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "CREDIT_CARD", // iyzico 3D Secure
  "BANK_TRANSFER", // havale / EFT
  "CASH_ON_DELIVERY", // kapıda ödeme
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
]);

export const couponTypeEnum = pgEnum("coupon_type", [
  "PERCENT", // yüzde indirim
  "FIXED", // sabit tutar indirim
  "FREE_SHIPPING", // ücretsiz kargo
]);

export const stockMovementEnum = pgEnum("stock_movement_type", [
  "PURCHASE", // mal girişi
  "SALE", // satış
  "RETURN", // müşteri iadesi
  "CANCEL", // iptal iadesi
  "MANUAL", // elle düzeltme
]);

/* ========================================================================== */
/*  KULLANICI                                                                 */
/* ========================================================================== */

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 25 }),
    role: roleEnum("role").notNull().default("CUSTOMER"),
    isActive: boolean("is_active").notNull().default(true),
    acceptsMarketing: boolean("accepts_marketing").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const addresses = pgTable(
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

/* ========================================================================== */
/*  KATALOG                                                                   */
/* ========================================================================== */

export const categories = pgTable(
  "categories",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    parentId: varchar("parent_id", { length: 30 }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    showInMenu: boolean("show_in_menu").notNull().default(true),
    metaTitle: varchar("meta_title", { length: 200 }),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_slug_uq").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
  ],
);

export const brands = pgTable(
  "brands",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    logoUrl: text("logo_url"),
  },
  (t) => [uniqueIndex("brands_slug_uq").on(t.slug)],
);

export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    name: varchar("name", { length: 250 }).notNull(),
    slug: varchar("slug", { length: 280 }).notNull(),
    sku: varchar("sku", { length: 60 }).notNull(),
    description: text("description").notNull().default(""),
    shortDescription: text("short_description"),

    // --- Para alanları: KURUŞ ---
    price: integer("price").notNull(), // satış fiyatı
    compareAtPrice: integer("compare_at_price"), // üstü çizili eski fiyat
    costPrice: integer("cost_price"), // alış maliyeti (sadece admin)
    taxRate: integer("tax_rate").notNull().default(10), // KDV %

    brandId: varchar("brand_id", { length: 30 }).references(() => brands.id, {
      onDelete: "set null",
    }),

    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),

    weightGr: integer("weight_gr"), // kargo hesabı için gram

    // İç giyime özel alanlar
    material: varchar("material", { length: 250 }), // %95 Pamuk %5 Elastan
    careInfo: text("care_info"), // yıkama talimatı
    modelInfo: text("model_info"), // "Modelin ölçüleri: 1.75 / 75B"

    metaTitle: varchar("meta_title", { length: 200 }),
    metaDescription: text("meta_description"),

    viewCount: integer("view_count").notNull().default(0),
    soldCount: integer("sold_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    uniqueIndex("products_sku_uq").on(t.sku),
    index("products_active_idx").on(t.isActive),
  ],
);

export const productCategories = pgTable(
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

export const productImages = pgTable(
  "product_images",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    productId: varchar("product_id", { length: 30 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 250 }),
    sortOrder: integer("sort_order").notNull().default(0),
    colorName: varchar("color_name", { length: 60 }), // bu görsel hangi renge ait
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

/**
 * Beden + renk kombinasyonu. STOK BURADA TUTULUR.
 * Örn: "Siyah / 75B" -> stock: 12
 */
export const productVariants = pgTable(
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

    priceOverride: integer("price_override"), // ürün fiyatından farklıysa

    stock: integer("stock").notNull().default(0),
    lowStockAlert: integer("low_stock_alert").notNull().default(3),

    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("variants_sku_uq").on(t.sku),
    uniqueIndex("variants_combo_uq").on(t.productId, t.size, t.colorName),
    index("variants_product_idx").on(t.productId),
  ],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: serial("id").primaryKey(),
    variantId: varchar("variant_id", { length: 30 })
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    type: stockMovementEnum("type").notNull(),
    quantity: integer("quantity").notNull(), // + giriş / - çıkış
    note: text("note"),
    orderId: varchar("order_id", { length: 30 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("stock_movements_variant_idx").on(t.variantId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    productId: varchar("product_id", { length: 30 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    title: varchar("title", { length: 200 }),
    comment: text("comment").notNull(),
    isApproved: boolean("is_approved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("reviews_product_user_uq").on(t.productId, t.userId),
    index("reviews_product_idx").on(t.productId),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: varchar("user_id", { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 30 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

/* ========================================================================== */
/*  SEPET                                                                     */
/* ========================================================================== */

export const carts = pgTable(
  "carts",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    userId: varchar("user_id", { length: 30 }).references(() => users.id, {
      onDelete: "cascade",
    }),
    token: varchar("token", { length: 60 }).notNull(), // misafir sepeti cookie anahtarı
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("carts_token_uq").on(t.token), index("carts_user_idx").on(t.userId)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    cartId: varchar("cart_id", { length: 30 })
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: varchar("variant_id", { length: 30 })
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cart_items_uq").on(t.cartId, t.variantId)],
);

/* ========================================================================== */
/*  SİPARİŞ                                                                   */
/* ========================================================================== */

/**
 * Sipariş numarası sayacı.
 * Veritabanı seviyesinde artar; aynı anda gelen iki sipariş
 * asla aynı numarayı almaz.
 */
export const orderNumberSeq = pgSequence("order_number_seq", {
  startWith: 1,
  increment: 1,
});

export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    orderNumber: varchar("order_number", { length: 30 }).notNull(), // SP-2026-000123
    userId: varchar("user_id", { length: 30 }).references(() => users.id, {
      onDelete: "set null",
    }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 25 }).notNull(),

    status: orderStatusEnum("status").notNull().default("PENDING"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),

    // --- Tutarlar: KURUŞ ---
    subtotal: integer("subtotal").notNull(),
    discountTotal: integer("discount_total").notNull().default(0),
    shippingTotal: integer("shipping_total").notNull().default(0),
    grandTotal: integer("grand_total").notNull(),

    couponCode: varchar("coupon_code", { length: 40 }),
    installment: integer("installment").notNull().default(1),

    // Adresin anlık kopyası — adres sonradan silinse/değişse sipariş bozulmaz
    shippingAddress: jsonb("shipping_address").notNull(),
    billingAddress: jsonb("billing_address").notNull(),

    shippingCompany: varchar("shipping_company", { length: 80 }),
    trackingNumber: varchar("tracking_number", { length: 80 }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),

    customerNote: text("customer_note"),
    adminNote: text("admin_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_number_uq").on(t.orderNumber),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = pgTable(
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

    unitPrice: integer("unit_price").notNull(), // kuruş
    quantity: integer("quantity").notNull(),
    taxRate: integer("tax_rate").notNull().default(10),
    lineTotal: integer("line_total").notNull(), // kuruş
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    orderId: varchar("order_id", { length: 30 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    provider: varchar("provider", { length: 40 }).notNull().default("iyzico"),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    amount: integer("amount").notNull(), // kuruş

    // iyzico alanları
    conversationId: varchar("conversation_id", { length: 60 }),
    iyzicoPaymentId: varchar("iyzico_payment_id", { length: 60 }),
    iyzicoTransactionId: varchar("iyzico_transaction_id", { length: 60 }),
    installment: integer("installment").notNull().default(1),
    cardFamily: varchar("card_family", { length: 40 }), // Bonus, World, Axess
    cardAssociation: varchar("card_association", { length: 40 }), // VISA, MASTER_CARD
    lastFourDigits: varchar("last_four_digits", { length: 4 }),
    binNumber: varchar("bin_number", { length: 8 }),
    errorCode: varchar("error_code", { length: 40 }),
    errorMessage: text("error_message"),
    rawResponse: jsonb("raw_response"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payments_order_idx").on(t.orderId),
    index("payments_conversation_idx").on(t.conversationId),
  ],
);

/* ========================================================================== */
/*  KAMPANYA                                                                  */
/* ========================================================================== */

export const coupons = pgTable(
  "coupons",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    code: varchar("code", { length: 40 }).notNull(),
    type: couponTypeEnum("type").notNull(),
    value: integer("value").notNull(), // PERCENT: 10 = %10 | FIXED: kuruş
    minOrderTotal: integer("min_order_total").notNull().default(0), // kuruş
    maxDiscount: integer("max_discount"), // kuruş — yüzde indirimde üst sınır
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("coupons_code_uq").on(t.code)],
);

/* ========================================================================== */
/*  İÇERİK & AYARLAR                                                          */
/* ========================================================================== */

/** key/value ayar tablosu: kargo ücreti, ücretsiz kargo limiti, iletişim vb. */
export const settings = pgTable("settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const banners = pgTable("banners", {
  id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
  title: varchar("title", { length: 200 }),
  subtitle: varchar("subtitle", { length: 250 }),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  buttonLabel: varchar("button_label", { length: 60 }),
  position: varchar("position", { length: 40 }).notNull().default("home_hero"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const pages = pgTable(
  "pages",
  {
    id: varchar("id", { length: 30 }).primaryKey().$defaultFn(createId),
    slug: varchar("slug", { length: 120 }).notNull(), // iade-kosullari
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pages_slug_uq").on(t.slug)],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("newsletter_email_uq").on(t.email)],
);

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 25 }),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
