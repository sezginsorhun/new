"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  perPage,
  total,
}: {
  page: number;
  perPage: number;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const pageCount = Math.ceil(total / perPage);

  if (pageCount <= 1) return null;

  function go(target: number) {
    const next = new URLSearchParams(params.toString());
    if (target <= 1) next.delete("sayfa");
    else next.set("sayfa", String(target));
    router.push(`?${next.toString()}`);
  }

  // 1 ... 4 5 [6] 7 8 ... 12
  const numbers: (number | "gap")[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) numbers.push(i);
    else if (numbers[numbers.length - 1] !== "gap") numbers.push("gap");
  }

  return (
    <nav className="mt-14 flex items-center justify-center gap-1.5" aria-label="Sayfalama">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center border border-[color:var(--color-line-strong)] bg-white disabled:opacity-35"
        aria-label="Önceki sayfa"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
      </button>

      {numbers.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1.5 text-[color:var(--color-muted)]">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            aria-current={item === page ? "page" : undefined}
            className={`h-9 min-w-9 px-2 text-[13px] transition-colors ${
              item === page
                ? "bg-[color:var(--color-ink)] text-white"
                : "border border-[color:var(--color-line-strong)] bg-white hover:border-[color:var(--color-ink)]"
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= pageCount}
        className="flex h-9 w-9 items-center justify-center border border-[color:var(--color-line-strong)] bg-white disabled:opacity-35"
        aria-label="Sonraki sayfa"
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </button>
    </nav>
  );
}
