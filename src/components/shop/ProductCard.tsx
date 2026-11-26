"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Heart, ShoppingBag } from "lucide-react";
import type { ProductCardData } from "@/lib/catalog";
import { discountPercent } from "@/lib/money";
import { addToCartAction } from "@/actions/cart";
import { toggleFavoriteAction } from "@/actions/account";
import Price from "./Price";

/**
 * ÜRÜN KARTI
 * Çerçeveli kart · kare görsel (ürün kırpılmadan, beyaz zeminde) · indirim
 * rozeti · iki satırlık ad · ortalı fiyat · "Sepete Ekle" ve favori.
 *
 * Tek seçenekli üründe "Sepete Ekle" ürünü doğrudan sepete atar; birden
 * fazla seçeneği olan üründe ürün sayfasına götürür (seçim orada yapılır).
 * Yıldızlar yalnızca GERÇEK onaylı yorum varsa görünür.
 */
export default function ProductCard({ product }: { product: ProductCardData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const discount = discountPercent(product.price, product.compareAtPrice);
  const href = `/urun/${product.slug}`;

  const colorImage = activeColor
    ? product.images.find((img) => img.colorName === activeColor)
    : null;
  const primary = colorImage ?? product.images[0];
  const secondary = product.images.find((img) => img !== primary);

  function addToCart() {
    if (!product.quickAddVariantId) {
      router.push(href);
      return;
    }
    startTransition(async () => {
      const result = await addToCartAction(product.quickAddVariantId!, 1);
      if (result.ok) {
        setAdded(true);
        router.refresh();
        setTimeout(() => setAdded(false), 2200);
      } else {
        router.push(href);
      }
    });
  }

  function toggleFavorite() {
    startTransition(async () => {
      const result = await toggleFavoriteAction(product.id);
      if (result.requiresLogin) {
        router.push(`/giris?next=${encodeURIComponent(href)}`);
        return;
      }
      setFavorite(result.isFavorite);
    });
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-line)] bg-white transition-shadow duration-200 hover:border-[color:var(--color-line-strong)] hover:shadow-[0_6px_24px_rgba(40,20,70,0.08)]">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-white">
        {primary ? (
          <>
            <Image
              src={primary.url}
              alt={primary.alt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
            />
            {secondary && (
              <Image
                src={secondary.url}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                aria-hidden
                className="bg-white object-contain p-3 opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-[color:var(--color-muted)]">
            Görsel yok
          </div>
        )}

        {/* Rozetler */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {discount && (
            <span className="rounded-md bg-[color:var(--color-sale-soft)] px-2 py-1 text-[11.5px] font-bold text-[color:var(--color-sale)]">
              %{discount}
            </span>
          )}
        </div>
        {product.isNew && (
          <span className="absolute left-2 top-2 rounded-md bg-[color:var(--color-brand)] px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white">
            Yeni
          </span>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-md bg-[color:var(--color-ink)] px-2.5 py-1 text-[11.5px] font-semibold text-white">
              Tükendi
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-3.5">
        <Link href={href} className="block">
          <h3 className="line-clamp-2 min-h-[2.7em] text-[13px] font-medium leading-[1.35] text-[color:var(--color-ink)] sm:text-[13.5px]">
            {product.name}
          </h3>
        </Link>

        {product.reviewCount > 0 && product.rating !== null && (
          <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[color:var(--color-muted)]">
            <span aria-hidden className="tracking-[0.05em] text-[#f5a623]">
              {"★".repeat(Math.round(product.rating))}
              <span className="text-[color:var(--color-line-strong)]">
                {"★".repeat(5 - Math.round(product.rating))}
              </span>
            </span>
            <span className="sr-only">{product.rating} yıldız,</span>({product.reviewCount})
          </p>
        )}

        {/* Renk seçenekleri */}
        {product.colors.length > 1 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {product.colors.slice(0, 5).map((color) => (
              <button
                key={color.name}
                type="button"
                onMouseEnter={() => setActiveColor(color.name)}
                onFocus={() => setActiveColor(color.name)}
                onClick={() => setActiveColor(color.name)}
                title={color.name}
                aria-label={`${color.name} rengini göster`}
                className={`h-3.5 w-3.5 rounded-full ring-offset-2 transition-all ${
                  activeColor === color.name
                    ? "ring-1 ring-[color:var(--color-ink)]"
                    : "ring-1 ring-[color:var(--color-line-strong)]"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        )}

        <div className="mt-auto pt-3">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" align="center" />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={addToCart}
            disabled={pending || !product.inStock}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-card)] bg-[color:var(--color-brand)] px-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[color:var(--color-brand-dark)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {added ? (
              <>
                <Check size={15} strokeWidth={2.2} /> Eklendi
              </>
            ) : !product.inStock ? (
              "Tükendi"
            ) : product.quickAddVariantId ? (
              <>
                <ShoppingBag size={15} strokeWidth={1.8} className="hidden sm:block" /> Sepete Ekle
              </>
            ) : (
              "Seçenekleri Gör"
            )}
          </button>
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={pending}
            aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            aria-pressed={favorite}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-[color:var(--color-line-strong)] bg-white transition-colors hover:border-[color:var(--color-brand)]"
          >
            <Heart
              size={17}
              strokeWidth={1.7}
              className={favorite ? "fill-[color:var(--color-sale)] text-[color:var(--color-sale)]" : "text-[color:var(--color-ink-soft)]"}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
