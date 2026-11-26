"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  initial = "",
  large = false,
}: {
  initial?: string;
  /** Başlıktaki büyük arama kutusu: sağda dolu "Ara" düğmesi */
  large?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const term = value.trim();
        router.push(term ? `/arama?q=${encodeURIComponent(term)}` : "/arama");
      }}
      className="relative"
    >
      {large ? (
        <div className="flex h-[44px] overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-line-strong)] bg-white focus-within:border-[color:var(--color-brand)]">
          <input
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ürün, kategori ya da marka ara..."
            aria-label="Ürün ara"
            className="min-w-0 flex-1 bg-transparent px-4 text-[13.5px] outline-none placeholder:text-[color:var(--color-muted)]"
          />
          <button
            type="submit"
            aria-label="Ara"
            className="flex w-[52px] items-center justify-center bg-[color:var(--color-brand)] text-white transition-colors hover:bg-[color:var(--color-brand-dark)]"
          >
            <Search size={18} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <>
      <Search
        size={16}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ürün ara..."
        aria-label="Ürün ara"
        className="field !py-2 pl-9 text-[13px]"
      />
        </>
      )}
    </form>
  );
}
