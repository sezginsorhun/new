"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type GalleryImage = { id: string; url: string; alt: string | null; colorName: string | null };

export default function ProductGallery({
  images,
  activeColor,
  productName,
}: {
  images: GalleryImage[];
  activeColor: string | null;
  productName: string;
}) {
  const [index, setIndex] = useState(0);

  // Renk seçilince o renge ait görsel varsa öne al
  const ordered = activeColor
    ? [
        ...images.filter((img) => img.colorName === activeColor),
        ...images.filter((img) => img.colorName !== activeColor),
      ]
    : images;

  const current = ordered[Math.min(index, ordered.length - 1)];

  if (!current) {
    return (
      <div className="flex aspect-product items-center justify-center bg-[#f3ece8] text-[13px] text-[color:var(--color-muted)]">
        Görsel yok
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* Küçük görseller */}
      {ordered.length > 1 && (
        <div className="no-scrollbar hidden w-[76px] shrink-0 space-y-2 overflow-y-auto sm:block">
          {ordered.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}. görseli göster`}
              aria-current={i === index}
              className={`relative block w-full overflow-hidden border aspect-product ${
                i === index ? "border-[color:var(--color-ink)]" : "border-transparent"
              }`}
            >
              <Image src={image.url} alt="" fill sizes="76px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Ana görsel */}
      <div className="relative min-w-0 flex-1 overflow-hidden bg-[#f3ece8] aspect-product">
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt ?? productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover"
        />

        {ordered.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + ordered.length) % ordered.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 sm:hidden"
              aria-label="Önceki görsel"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % ordered.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 sm:hidden"
              aria-label="Sonraki görsel"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
              {ordered.map((image, i) => (
                <span
                  key={image.id}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-[color:var(--color-ink)]" : "bg-white/80"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
