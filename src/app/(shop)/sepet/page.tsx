import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { getCartTotals } from "@/lib/cart";
import CartLines from "@/components/shop/CartLines";
import CartSummary from "@/components/shop/CartSummary";

export const metadata: Metadata = {
  title: "Sepetim",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const cart = await getCartTotals();

  if (cart.lines.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <ShoppingBag
          size={44}
          strokeWidth={1}
          className="mx-auto text-[color:var(--color-line-strong)]"
        />
        <h1 className="mt-5 text-[26px]">Sepetin boş</h1>
        <p className="mt-2 text-[14px] text-[color:var(--color-ink-soft)]">
          Beğendiğin ürünleri sepete ekleyip buradan siparişini tamamlayabilirsin.
        </p>
        <Link href="/" className="btn-primary mt-7">
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-[30px]">
        Sepetim{" "}
        <span className="text-[15px] text-[color:var(--color-muted)]">
          ({cart.itemCount} ürün)
        </span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <CartLines lines={cart.lines} />
        <CartSummary
          subtotal={cart.subtotal}
          shippingTotal={cart.shippingTotal}
          freeShippingThreshold={cart.freeShippingThreshold}
          remainingForFreeShipping={cart.remainingForFreeShipping}
          grandTotal={cart.grandTotal}
        />
      </div>
    </div>
  );
}
