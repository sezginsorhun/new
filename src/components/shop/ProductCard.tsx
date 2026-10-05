"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProductCardData } from "@/lib/catalog";
import { discountPercent, formatPrice } from "@/lib/money";

export default function ProductCard({ product }: { product: ProductCardData }) {
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const discount = discountPercent(product.price, product.compareAtPrice);

  // Seçili renge ait görsel varsa onu göster
  const colorImage = activeColor
    ? product.images.find((img) => img.colorName === activeColor)
    : null;
  const primary = colorImage ?? product.images[0];
  const secondary = product.images.find((img) => img !== primary);

  return (
    <article className="group relative">
      <Link href={`/urun/${product.slug}`} className="block">
        <div className="relative overflow-hidden bg-[color:var(--color-surface-3)] aspect-product">
          {primary ? (
            <>
              <Image
                src={primary.url}
                alt={primary.alt ?? product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              {secondary && (
                <Image
                  src={secondary.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  aria-hidden
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-[color:var(--color-muted)]">
              Görsel yok
            </div>
          )}

          {/* Rozetler */}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {discount && <span className="badge badge-sale">%{discount}</span>}
            {product.isNew && !discount && <span className="badge badge-new">Yeni</span>}
          </div>

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75">
              <span className="badge badge-new">Tükendi</span>
            </div>
          )}

          {/* Hızlı bakış — masaüstünde kartın üstüne gelince çıkar */}
          {product.inStock && (
            <span className="pointer-events-none absolute inset-x-2.5 bottom-2.5 hidden translate-y-1 items-center justify-center bg-[color:var(--color-ink)] py-2.5 text-[12px] font-semibold text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
              İncele
            </span>
          )}
        </div>
      </Link>

      <div className="pt-3">
        {product.reviewCount > 0 && product.rating !== null && (
          <p className="mb-1 flex items-center gap-1 text-[11.5px] text-[color:var(--color-muted)]">
            <span aria-hidden className="text-[color:var(--color-ink)]">
              {"★".repeat(Math.round(product.rating))}
              <span className="text-[color:var(--color-line-strong)]">
                {"★".repeat(5 - Math.round(product.rating))}
              </span>
            </span>
            <span className="sr-only">{product.rating} yıldız,</span>
            {product.reviewCount}
          </p>
        )}

        <Link href={`/urun/${product.slug}`}>
          <h3 className="text-[13.5px] font-medium leading-snug tracking-[-0.01em] text-[color:var(--color-ink)]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span
            className={`text-[14.5px] font-bold tracking-tight ${
              discount ? "text-[color:var(--color-sale)]" : ""
            }`}
          >
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-[12px] text-[color:var(--color-muted)] line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Renk seçenekleri */}
        {product.colors.length > 1 && (
          <div className="mt-2.5 flex items-center gap-1.5">
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
            {product.colors.length > 5 && (
              <span className="text-[11px] text-[color:var(--color-muted)]">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
