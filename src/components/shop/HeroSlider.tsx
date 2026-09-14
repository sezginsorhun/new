"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/db/schema";

export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length, paused]);

  if (banners.length === 0) return null;

  const go = (next: number) => setIndex((next + banners.length) % banners.length);

  return (
    <section
      className="relative overflow-hidden bg-[#f0e6e0]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Öne çıkan kampanyalar"
    >
      <div className="relative h-[380px] sm:h-[460px] lg:h-[560px]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.title ?? ""}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 to-transparent" />

            <div className="container-page relative flex h-full items-center">
              <div className="max-w-[440px] animate-fade-up text-white">
                {banner.subtitle && (
                  <p className="text-[11px] font-medium uppercase tracking-[0.26em] opacity-90">
                    {banner.subtitle}
                  </p>
                )}
                {banner.title && (
                  <h1 className="mt-3 font-[family-name:var(--font-display)] text-[34px] leading-[1.15] text-white sm:text-[44px] lg:text-[52px]">
                    {banner.title}
                  </h1>
                )}
                {banner.linkUrl && (
                  <Link
                    href={banner.linkUrl}
                    className="mt-7 inline-flex items-center bg-white px-7 py-3.5 text-[12px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-brand)] hover:text-white"
                  >
                    {banner.buttonLabel ?? "Keşfet"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Önceki"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2.5 text-[color:var(--color-ink)] transition-colors hover:bg-white sm:block"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Sonraki"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2.5 text-[color:var(--color-ink)] transition-colors hover:bg-white sm:block"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}. görsele git`}
                aria-current={i === index}
                className={`h-1 transition-all ${
                  i === index ? "w-8 bg-white" : "w-4 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
