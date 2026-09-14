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
        <div className="relative overflow-hidden bg-[#f3ece8] aspect-product">
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
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {discount && (
              <span className="badge bg-[color:var(--color-sale)] text-white">%{discount} indirim</span>
            )}
            {product.isNew && !discount && (
              <span className="badge bg-white text-[color:var(--color-ink)]">Yeni</span>
            )}
          </div>

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="badge bg-[color:var(--color-ink)] text-white">Tükendi</span>
            </div>
          )}
        </div>
      </Link>

      <div className="pt-3.5">
        <Link href={`/urun/${product.slug}`}>
          <h3 className="font-[family-name:var(--font-sans)] text-[13.5px] leading-snug text-[color:var(--color-ink)] transition-colors group-hover:text-[color:var(--color-brand)]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[14px] font-semibold tracking-tight">
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
