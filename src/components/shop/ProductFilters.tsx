"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { formatAmount } from "@/lib/money";

export type FilterOptions = {
  sizes: string[];
  colors: { name: string; hex: string }[];
  minPrice: number;
  maxPrice: number;
};

export default function ProductFilters({
  options,
  total,
}: {
  options: FilterOptions;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedSizes = params.getAll("beden");
  const selectedColors = params.getAll("renk");
  const inStockOnly = params.get("stok") === "1";
  const maxPrice = params.get("max");

  function update(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete("sayfa"); // filtre değişince 1. sayfaya dön
    router.push(`?${next.toString()}`, { scroll: false });
  }

  function toggleMulti(key: string, value: string) {
    update((next) => {
      const current = next.getAll(key);
      next.delete(key);
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updated.forEach((v) => next.append(key, v));
    });
  }

  const activeCount =
    selectedSizes.length + selectedColors.length + (inStockOnly ? 1 : 0) + (maxPrice ? 1 : 0);

  const panel = (
    <div className="space-y-7">
      {/* Beden */}
      {options.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Beden
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {options.sizes.map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleMulti("beden", size)}
                  aria-pressed={active}
                  className={`min-w-[44px] border px-2.5 py-1.5 text-[12px] transition-colors ${
                    active
                      ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
                      : "border-[color:var(--color-line-strong)] bg-white hover:border-[color:var(--color-ink)]"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Renk */}
      {options.colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Renk
          </legend>
          <div className="space-y-2">
            {options.colors.map((color) => {
              const active = selectedColors.includes(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => toggleMulti("renk", color.name)}
                  aria-pressed={active}
                  className="flex w-full items-center gap-2.5 text-left text-[13px]"
                >
                  <span
                    className={`h-4 w-4 rounded-full ring-1 ring-offset-2 ${
                      active ? "ring-[color:var(--color-ink)]" : "ring-[color:var(--color-line-strong)]"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className={active ? "font-medium" : "text-[color:var(--color-ink-soft)]"}>
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Fiyat */}
      {options.maxPrice > options.minPrice && (
        <fieldset>
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Fiyat üst sınırı
          </legend>
          <input
            type="range"
            min={options.minPrice}
            max={options.maxPrice}
            step={1000}
            defaultValue={maxPrice ? Number(maxPrice) : options.maxPrice}
            onChange={(event) => {
              const value = event.target.value;
              update((next) => {
                if (Number(value) >= options.maxPrice) next.delete("max");
                else next.set("max", value);
              });
            }}
            className="w-full accent-[color:var(--color-brand)]"
            aria-label="Fiyat üst sınırı"
          />
          <div className="mt-1 flex justify-between text-[12px] text-[color:var(--color-muted)]">
            <span>{formatAmount(options.minPrice)} TL</span>
            <span>{formatAmount(maxPrice ? Number(maxPrice) : options.maxPrice)} TL</span>
          </div>
        </fieldset>
      )}

      {/* Stok */}
      <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={() =>
            update((next) => {
              if (inStockOnly) next.delete("stok");
              else next.set("stok", "1");
            })
          }
          className="h-4 w-4 accent-[color:var(--color-brand)]"
        />
        Sadece stokta olanlar
      </label>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() =>
            update((next) => {
              ["beden", "renk", "stok", "max"].forEach((key) => next.delete(key));
            })
          }
          className="text-[12px] text-[color:var(--color-sale)] underline"
        >
          Filtreleri temizle ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobil aç/kapa */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="btn-outline btn-sm lg:hidden"
      >
        <SlidersHorizontal size={14} strokeWidth={1.5} />
        Filtrele{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>

      {/* Masaüstü kenar çubuğu */}
      <aside className="hidden w-[220px] shrink-0 lg:block">
        <p className="mb-5 border-b border-[color:var(--color-line)] pb-3 text-[12px] text-[color:var(--color-muted)]">
          {total} ürün
        </p>
        {panel}
      </aside>

      {/* Mobil çekmece */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileOpen(false)}
            aria-label="Kapat"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-[family-name:var(--font-display)] text-xl">Filtreler</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Kapat">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            {panel}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              {total} ürünü göster
            </button>
          </div>
        </div>
      )}
    </>
  );
}
