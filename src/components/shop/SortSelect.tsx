"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "newest", label: "En yeniler" },
  { value: "bestseller", label: "En çok satanlar" },
  { value: "price-asc", label: "Fiyat: düşükten yükseğe" },
  { value: "price-desc", label: "Fiyat: yüksekten düşüğe" },
  { value: "name", label: "İsme göre (A-Z)" },
];

export default function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-[12px] text-[color:var(--color-muted)]">
      <span className="hidden sm:inline">Sırala</span>
      <select
        value={params.get("sirala") ?? "newest"}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("sirala", event.target.value);
          next.delete("sayfa");
          router.push(`?${next.toString()}`, { scroll: false });
        }}
        className="field !w-auto !py-1.5 text-[12.5px]"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
