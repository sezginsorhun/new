import { discountPercent } from "@/lib/money";

/**
 * FİYAT GÖSTERİMİ — sitenin her yerinde aynı görünüm
 *
 *   1.599,90 ₺          ← tam kısım büyük, kuruş küçük, ₺ simgesi
 *   ̶2̶.̶0̶4̶9̶,̶9̶0̶ ̶₺̶  %22  ← eski fiyat üstü çizili, yanında indirim oranı
 *
 * Kuruş ",00" ise hiç yazılmaz (1.200 ₺). Ekran okuyucuya tek parça,
 * doğal bir metin okunur ("1.599,90 TL, eski fiyat 2.049,90 TL").
 */

const nf = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

function split(kurus: number) {
  const whole = Math.floor(kurus / 100);
  const cents = kurus % 100;
  return { whole: nf.format(whole), cents: cents ? String(cents).padStart(2, "0") : "" };
}

export function priceText(kurus: number): string {
  const { whole, cents } = split(kurus);
  return `${whole}${cents ? `,${cents}` : ""} TL`;
}

function Amount({ kurus, className = "" }: { kurus: number; className?: string }) {
  const { whole, cents } = split(kurus);
  return (
    <span className={`whitespace-nowrap tabular-nums ${className}`} aria-hidden>
      {whole}
      {cents && <span className="text-[0.62em] align-[0.42em] font-semibold">,{cents}</span>}
      <span className="ml-[0.18em] font-semibold">₺</span>
    </span>
  );
}

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { now: string; old: string; badge: string }> = {
  sm: { now: "text-[18px]", old: "text-[12.5px]", badge: "text-[11px] px-1.5 py-0.5" },
  md: { now: "text-[22px]", old: "text-[13.5px]", badge: "text-[11.5px] px-2 py-0.5" },
  lg: { now: "text-[32px]", old: "text-[16px]", badge: "text-[13px] px-2.5 py-1" },
};

export default function Price({
  price,
  compareAtPrice,
  size = "md",
  align = "start",
  showBadge = false,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: Size;
  align?: "start" | "center";
  /** Eski fiyatın yanında "%22" rozeti (kartta rozet görselin üstünde olduğundan kapalı) */
  showBadge?: boolean;
}) {
  const discount = discountPercent(price, compareAtPrice ?? null);
  const s = SIZES[size];
  const label = discount
    ? `${priceText(price)}, eski fiyat ${priceText(compareAtPrice!)}, yüzde ${discount} indirim`
    : priceText(price);

  return (
    <div
      className={`flex flex-col gap-0.5 leading-none ${align === "center" ? "items-center text-center" : "items-start"}`}
      role="group"
      aria-label={label}
    >
      {discount && (
        <div className="flex items-center gap-2">
          <Amount kurus={compareAtPrice!} className={`${s.old} font-medium text-[color:var(--color-muted)] line-through decoration-[1.5px]`} />
          {showBadge && (
            <span className={`${s.badge} rounded-[var(--radius-card)] bg-[color:var(--color-sale-soft)] font-bold text-[color:var(--color-sale)]`} aria-hidden>
              %{discount}
            </span>
          )}
        </div>
      )}
      <Amount
        kurus={price}
        className={`${s.now} font-extrabold tracking-[-0.02em] ${discount ? "text-[color:var(--color-sale)]" : "text-[color:var(--color-ink)]"}`}
      />
    </div>
  );
}
