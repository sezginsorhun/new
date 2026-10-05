"use client";

/**
 * ANA SAYFA CAROUSEL
 *
 * Slaytların tamamı yönetim panelinden gelir: görsel (masaüstü + mobil ayrı),
 * başlık, açıklama, iki buton, hizalama, karartma oranı ve sıra.
 * Burada sabitlenmiş hiçbir içerik yoktur.
 *
 * Erişilebilirlik:
 *  - Sol/sağ ok tuşlarıyla gezilir, odaklanınca ve fareyle üstüne gelince durur.
 *  - "Hareketi azalt" tercihi açıksa otomatik geçiş çalışmaz.
 *  - Noktalar gerçek buton, ekran okuyucuya slayt numarasını söyler.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Slide = {
  id: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  imageAlt: string | null;
  linkUrl: string | null;
  buttonLabel: string | null;
  secondaryLabel: string | null;
  secondaryUrl: string | null;
  align: string;
  theme: string;
  overlay: number;
};

const HEIGHTS: Record<string, string> = {
  short: "h-[260px] sm:h-[340px] lg:h-[400px]",
  medium: "h-[320px] sm:h-[420px] lg:h-[520px]",
  tall: "h-[380px] sm:h-[500px] lg:h-[620px]",
};

export default function HeroCarousel({
  slides,
  autoplayMs = 6000,
  showArrows = true,
  showDots = true,
  height = "tall",
}: {
  slides: Slide[];
  autoplayMs?: number;
  showArrows?: boolean;
  showDots?: boolean;
  height?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused || !autoplayMs) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), autoplayMs);
    return () => clearInterval(timer);
  }, [count, paused, autoplayMs]);

  if (count === 0) return null;

  const heightClass = HEIGHTS[height] ?? HEIGHTS.tall;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Kampanya slaytları"
      className={`relative overflow-hidden bg-[color:var(--color-surface-3)] ${heightClass}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(index + 1);
        if (event.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        const dark = slide.theme === "dark";
        const alignClass =
          slide.align === "center"
            ? "items-center text-center"
            : slide.align === "right"
              ? "items-end text-right"
              : "items-start text-left";

        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slayt"
            aria-label={`${i + 1} / ${count}`}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-700 ${
              active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* Masaüstü görseli */}
            <Image
              src={slide.imageUrl}
              alt={slide.imageAlt ?? slide.title ?? ""}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover ${slide.mobileImageUrl ? "hidden sm:block" : ""}`}
            />
            {/* Mobil için ayrı görsel verilmişse */}
            {slide.mobileImageUrl && (
              <Image
                src={slide.mobileImageUrl}
                alt={slide.imageAlt ?? slide.title ?? ""}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover sm:hidden"
              />
            )}

            <div
              className="absolute inset-0"
              style={{
                background: dark
                  ? `rgba(255,255,255,${(slide.overlay ?? 25) / 100})`
                  : `linear-gradient(90deg, rgba(0,0,0,${(slide.overlay ?? 25) / 100}) 0%, rgba(0,0,0,${
                      (slide.overlay ?? 25) / 250
                    }) 65%)`,
              }}
            />

            <div className="relative flex h-full items-center">
              <div className="container-page">
                <div className={`flex max-w-[520px] flex-col ${alignClass} ${
                  slide.align === "center" ? "mx-auto" : slide.align === "right" ? "ml-auto" : ""
                }`}>
                  {slide.eyebrow && (
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                        dark ? "text-[color:var(--color-ink-soft)]" : "text-white/85"
                      }`}
                    >
                      {slide.eyebrow}
                    </p>
                  )}
                  {slide.title && (
                    <h2
                      className={`mt-3 text-[30px] leading-[1.08] sm:text-[42px] lg:text-[52px] ${
                        dark ? "text-[color:var(--color-ink)]" : "text-white"
                      }`}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p
                      className={`mt-4 max-w-[400px] text-[14.5px] ${
                        dark ? "text-[color:var(--color-ink-soft)]" : "text-white/85"
                      }`}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  {(slide.buttonLabel || slide.secondaryLabel) && (
                    <div className="mt-7 flex flex-wrap gap-3">
                      {slide.buttonLabel && (
                        <Link
                          href={slide.linkUrl || "/"}
                          className={
                            dark
                              ? "btn-primary"
                              : "btn inline-flex bg-white text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-2)]"
                          }
                        >
                          {slide.buttonLabel}
                        </Link>
                      )}
                      {slide.secondaryLabel && (
                        <Link
                          href={slide.secondaryUrl || "/"}
                          className={
                            dark
                              ? "btn-outline"
                              : "btn inline-flex border border-white/70 text-white hover:bg-white hover:text-[color:var(--color-ink)]"
                          }
                        >
                          {slide.secondaryLabel}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Önceki slayt"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[color:var(--color-ink)] transition hover:bg-white sm:flex"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Sonraki slayt"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[color:var(--color-ink)] transition hover:bg-white sm:flex"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1}. slayta git`}
              aria-current={i === index}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-white" : "w-4 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
