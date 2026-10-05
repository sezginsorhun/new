/**
 * SEPET
 *
 * - Misafir kullanıcı: cookie'de rastgele bir `cart_token` tutulur, sepet DB'de.
 * - Giriş yapılınca misafir sepeti kullanıcının sepetiyle birleştirilir.
 * - Fiyatlar HER ZAMAN veritabanından okunur; tarayıcıdan gelen fiyata güvenilmez.
 */

import "server-only";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  carts,
  cartItems,
  productVariants,
  products,
  productImages,
  coupons,
} from "@/db/schema";
import { createToken, createId } from "@/lib/id";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

const CART_COOKIE = "cart_token";

export type CartLine = {
  itemId: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  imageUrl: string | null;
  unitPrice: number; // kuruş
  quantity: number;
  stock: number;
  lineTotal: number; // kuruş
  taxRate: number;
};

export type CartTotals = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  couponCode: string | null;
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
};

/* ---------------------------- SEPETİ BULMA ------------------------------ */

/** Mevcut sepeti getirir; yoksa oluşturur. */
export async function getOrCreateCart(): Promise<{ id: string; token: string }> {
  const session = await getSession();
  const store = await cookies();
  let token = store.get(CART_COOKIE)?.value ?? null;

  // 1) Giriş yapılmışsa kullanıcının sepeti esastır
  if (session) {
    const owned = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, session.userId))
      .limit(1);

    if (owned[0]) {
      // Misafirken oluşmuş bir sepet varsa içindekileri taşı
      if (token && token !== owned[0].token) {
        await mergeGuestCart(token, owned[0].id);
      }
      if (token !== owned[0].token) {
        store.set(CART_COOKIE, owned[0].token, cookieOptions());
      }
      return { id: owned[0].id, token: owned[0].token };
    }

    // Kullanıcının sepeti yok: misafir sepeti varsa onu sahiplendir
    if (token) {
      const guest = await db.select().from(carts).where(eq(carts.token, token)).limit(1);
      if (guest[0] && !guest[0].userId) {
        await db.update(carts).set({ userId: session.userId }).where(eq(carts.id, guest[0].id));
        return { id: guest[0].id, token: guest[0].token };
      }
    }

    const newToken = createToken();
    // MySQL'de RETURNING yok: kimliği önce üretip yazıyoruz.
    const newCartId = createId();
    await db.insert(carts).values({
      id: newCartId,
      token: newToken,
      userId: session.userId,
    });
    const created = [{ id: newCartId, token: newToken }];
    store.set(CART_COOKIE, newToken, cookieOptions());
    return { id: created[0].id, token: newToken };
  }

  // 2) Misafir
  if (token) {
    const existing = await db.select().from(carts).where(eq(carts.token, token)).limit(1);
    if (existing[0]) return { id: existing[0].id, token };
  }

  token = createToken();
  const guestCartId = createId();
  await db.insert(carts).values({ id: guestCartId, token });
  const created = [{ id: guestCartId, token }];
  store.set(CART_COOKIE, token, cookieOptions());
  return { id: created[0].id, token };
}

/** Sadece okuma yapan yerlerde kullan — cookie yazmaz, sepet yoksa null döner. */
export async function findCart(): Promise<{ id: string } | null> {
  const session = await getSession();
  if (session) {
    const owned = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, session.userId))
      .limit(1);
    if (owned[0]) return owned[0];
  }
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.token, token))
    .limit(1);
  return rows[0] ?? null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 gün
  };
}

async function mergeGuestCart(guestToken: string, targetCartId: string) {
  const guest = await db.select().from(carts).where(eq(carts.token, guestToken)).limit(1);
  if (!guest[0] || guest[0].id === targetCartId) return;

  const guestItems = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, guest[0].id));

  for (const item of guestItems) {
    await db
      .insert(cartItems)
      .values({
        cartId: targetCartId,
        variantId: item.variantId,
        quantity: item.quantity,
      })
      .onDuplicateKeyUpdate({
        set: { quantity: sql`${cartItems.quantity} + ${item.quantity}` },
      });
  }

  await db.delete(carts).where(eq(carts.id, guest[0].id));
}

/* ---------------------------- SEPET İŞLEMLERİ --------------------------- */

export async function addToCart(variantId: string, quantity = 1) {
  const cart = await getOrCreateCart();

  const variant = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant[0] || !variant[0].isActive) {
    return { ok: false as const, error: "Ürün bulunamadı." };
  }
  if (variant[0].stock < 1) {
    return { ok: false as const, error: "Bu beden tükendi." };
  }

  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId)))
    .limit(1);

  const desired = (existing[0]?.quantity ?? 0) + quantity;
  if (desired > variant[0].stock) {
    return {
      ok: false as const,
      error: `Bu üründen en fazla ${variant[0].stock} adet ekleyebilirsin.`,
    };
  }

  await db
    .insert(cartItems)
    .values({ cartId: cart.id, variantId, quantity })
    .onDuplicateKeyUpdate({
      set: { quantity: desired },
    });

  await db.update(carts).set({ updatedAt: sql`now()` }).where(eq(carts.id, cart.id));
  return { ok: true as const };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const cart = await findCart();
  if (!cart) return { ok: false as const, error: "Sepet bulunamadı." };

  if (quantity <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
    return { ok: true as const };
  }

  const rows = await db
    .select({ variantId: cartItems.variantId, stock: productVariants.stock })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
    .limit(1);

  if (!rows[0]) return { ok: false as const, error: "Ürün sepette bulunamadı." };
  if (quantity > rows[0].stock) {
    return { ok: false as const, error: `Stokta ${rows[0].stock} adet kaldı.` };
  }

  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId));
  return { ok: true as const };
}

export async function removeCartItem(itemId: string) {
  const cart = await findCart();
  if (!cart) return { ok: false as const, error: "Sepet bulunamadı." };
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  return { ok: true as const };
}

export async function clearCart(cartId: string) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}

/* ---------------------------- SEPET HESABI ------------------------------ */

/** Sepet satırlarını ve tüm tutarları hesaplar. Fiyatlar DB'den okunur. */
export async function getCartTotals(couponCode?: string | null): Promise<CartTotals> {
  const cart = await findCart();
  const settingsMap = await getSettings();
  const shippingFee = Number(settingsMap.shipping_fee) || 0;
  const freeShippingThreshold = Number(settingsMap.free_shipping_threshold) || 0;

  const empty: CartTotals = {
    lines: [],
    itemCount: 0,
    subtotal: 0,
    discountTotal: 0,
    shippingTotal: 0,
    grandTotal: 0,
    couponCode: null,
    freeShippingThreshold,
    remainingForFreeShipping: freeShippingThreshold,
  };
  if (!cart) return empty;

  const rows = await db
    .select({
      itemId: cartItems.id,
      quantity: cartItems.quantity,
      variantId: productVariants.id,
      size: productVariants.size,
      colorName: productVariants.colorName,
      colorHex: productVariants.colorHex,
      variantSku: productVariants.sku,
      stock: productVariants.stock,
      priceOverride: productVariants.priceOverride,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      productPrice: products.price,
      taxRate: products.taxRate,
      isActive: products.isActive,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));

  if (rows.length === 0) return empty;

  // Kapak görsellerini tek sorguda çek
  const imageRows = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      sortOrder: productImages.sortOrder,
    })
    .from(productImages);
  const coverByProduct = new Map<string, string>();
  for (const img of imageRows.sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!coverByProduct.has(img.productId)) coverByProduct.set(img.productId, img.url);
  }

  const lines: CartLine[] = rows
    .filter((r) => r.isActive)
    .map((r) => {
      const unitPrice = r.priceOverride ?? r.productPrice;
      const quantity = Math.min(r.quantity, Math.max(r.stock, 0));
      return {
        itemId: r.itemId,
        variantId: r.variantId,
        productId: r.productId,
        productName: r.productName,
        productSlug: r.productSlug,
        sku: r.variantSku,
        size: r.size,
        colorName: r.colorName,
        colorHex: r.colorHex,
        imageUrl: coverByProduct.get(r.productId) ?? null,
        unitPrice,
        quantity,
        stock: r.stock,
        lineTotal: unitPrice * quantity,
        taxRate: r.taxRate,
      };
    })
    .filter((l) => l.quantity > 0);

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  // --- Kupon ---
  let discountTotal = 0;
  let freeShipping = false;
  let appliedCoupon: string | null = null;

  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal);
    if (result.ok) {
      appliedCoupon = result.coupon.code;
      if (result.coupon.type === "FREE_SHIPPING") {
        freeShipping = true;
      } else if (result.coupon.type === "PERCENT") {
        discountTotal = Math.round((subtotal * result.coupon.value) / 100);
        if (result.coupon.maxDiscount) {
          discountTotal = Math.min(discountTotal, result.coupon.maxDiscount);
        }
      } else {
        discountTotal = Math.min(result.coupon.value, subtotal);
      }
    }
  }

  // --- Kargo ---
  const afterDiscount = subtotal - discountTotal;
  const shippingTotal =
    freeShipping || (freeShippingThreshold > 0 && afterDiscount >= freeShippingThreshold)
      ? 0
      : shippingFee;

  return {
    lines,
    itemCount,
    subtotal,
    discountTotal,
    shippingTotal,
    grandTotal: afterDiscount + shippingTotal,
    couponCode: appliedCoupon,
    freeShippingThreshold,
    remainingForFreeShipping: Math.max(freeShippingThreshold - afterDiscount, 0),
  };
}

/* ------------------------------- KUPON ---------------------------------- */

export async function validateCoupon(code: string, subtotal: number) {
  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.trim().toUpperCase()))
    .limit(1);

  const coupon = rows[0];
  if (!coupon || !coupon.isActive) {
    return { ok: false as const, error: "Kupon kodu geçersiz." };
  }
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false as const, error: "Kupon henüz başlamadı." };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { ok: false as const, error: "Kuponun süresi doldu." };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false as const, error: "Kupon kullanım limiti doldu." };
  }
  if (subtotal < coupon.minOrderTotal) {
    return {
      ok: false as const,
      error: `Bu kupon en az ${(coupon.minOrderTotal / 100).toFixed(2)} TL sepet tutarında geçerli.`,
    };
  }
  return { ok: true as const, coupon };
}

export const CART_COOKIE_NAME = CART_COOKIE;
