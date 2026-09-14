"use server";

import { revalidatePath } from "next/cache";
import {
  addToCart as addToCartLib,
  removeCartItem,
  updateCartItem,
  validateCoupon,
  getCartTotals,
} from "@/lib/cart";

export type CartActionResult = { ok: boolean; message?: string };

export async function addToCartAction(
  variantId: string,
  quantity = 1,
): Promise<CartActionResult> {
  if (!variantId) return { ok: false, message: "Lütfen beden ve renk seç." };

  const result = await addToCartLib(variantId, quantity);
  if (!result.ok) return { ok: false, message: result.error };

  revalidatePath("/sepet");
  revalidatePath("/", "layout");
  return { ok: true, message: "Ürün sepete eklendi." };
}

export async function updateCartItemAction(
  itemId: string,
  quantity: number,
): Promise<CartActionResult> {
  const result = await updateCartItem(itemId, quantity);
  revalidatePath("/sepet");
  revalidatePath("/", "layout");
  return result.ok ? { ok: true } : { ok: false, message: result.error };
}

export async function removeCartItemAction(itemId: string): Promise<CartActionResult> {
  const result = await removeCartItem(itemId);
  revalidatePath("/sepet");
  revalidatePath("/", "layout");
  return result.ok ? { ok: true } : { ok: false, message: result.error };
}

/** Kupon kodunu doğrular; geçerliyse indirim tutarını geri döner. */
export async function checkCouponAction(code: string) {
  const totals = await getCartTotals();
  if (totals.subtotal === 0) {
    return { ok: false as const, message: "Sepetin boş." };
  }
  const result = await validateCoupon(code, totals.subtotal);
  if (!result.ok) return { ok: false as const, message: result.error };

  const withCoupon = await getCartTotals(code);
  return {
    ok: true as const,
    code: result.coupon.code,
    discountTotal: withCoupon.discountTotal,
    shippingTotal: withCoupon.shippingTotal,
    grandTotal: withCoupon.grandTotal,
    message:
      result.coupon.type === "FREE_SHIPPING"
        ? "Kargo bedava kuponu uygulandı."
        : "Kupon uygulandı.",
  };
}
