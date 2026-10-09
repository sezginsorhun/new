"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Lock, Tag } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { checkCouponAction } from "@/actions/cart";

export default function CartSummary({
  subtotal,
  shippingTotal,
  freeShippingThreshold,
  remainingForFreeShipping,
  grandTotal,
  isLoggedIn,
}: {
  subtotal: number;
  shippingTotal: number;
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
  grandTotal: number;
  /** Sipariş yalnızca üyelerden alınır; düğme buna göre değişir. */
  isLoggedIn: boolean;
}) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{
    code: string;
    discountTotal: number;
    shippingTotal: number;
    grandTotal: number;
  } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function apply() {
    if (!code.trim()) return;
    startTransition(async () => {
      const result = await checkCouponAction(code);
      if (result.ok) {
        setApplied({
          code: result.code,
          discountTotal: result.discountTotal,
          shippingTotal: result.shippingTotal,
          grandTotal: result.grandTotal,
        });
        setMessage({ ok: true, text: result.message });
      } else {
        setApplied(null);
        setMessage({ ok: false, text: result.message });
      }
    });
  }

  const shownShipping = applied ? applied.shippingTotal : shippingTotal;
  const shownTotal = applied ? applied.grandTotal : grandTotal;
  const progress =
    freeShippingThreshold > 0
      ? Math.min((subtotal / freeShippingThreshold) * 100, 100)
      : 100;

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      {/* Ücretsiz kargo çubuğu */}
      {freeShippingThreshold > 0 && remainingForFreeShipping > 0 && (
        <div className="card mb-4 p-4">
          <p className="text-[12.5px] text-[color:var(--color-ink-soft)]">
            Ücretsiz kargo için <strong>{formatPrice(remainingForFreeShipping)}</strong> daha
            ekle.
          </p>
          <div className="mt-2.5 h-1.5 w-full bg-[color:var(--color-line)]">
            <div
              className="h-full bg-[color:var(--color-brand)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-[17px]">Sipariş Özeti</h2>

        {/* Kupon */}
        <div className="mt-4">
          <label className="label" htmlFor="coupon">İndirim kuponu</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag
                size={14}
                strokeWidth={1.5}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
              />
              <input
                id="coupon"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="KUPON KODU"
                className="field pl-9 text-[13px] uppercase"
              />
            </div>
            <button
              type="button"
              onClick={apply}
              disabled={pending || !code.trim()}
              className="btn-outline btn-sm shrink-0"
            >
              {pending ? "..." : "Uygula"}
            </button>
          </div>
          {message && (
            <p
              role="status"
              className={`mt-1.5 text-[12px] ${
                message.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
              }`}
            >
              {message.text}
            </p>
          )}
          <p className="help">Denemek için: HOSGELDIN10, KARGOBEDAVA, YAZ50</p>
        </div>

        {/* Tutarlar */}
        <dl className="mt-5 space-y-2.5 border-t border-[color:var(--color-line)] pt-4 text-[13.5px]">
          <div className="flex justify-between">
            <dt className="text-[color:var(--color-ink-soft)]">Ara toplam</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>

          {applied && applied.discountTotal > 0 && (
            <div className="flex justify-between text-[color:var(--color-success)]">
              <dt>İndirim ({applied.code})</dt>
              <dd>-{formatPrice(applied.discountTotal)}</dd>
            </div>
          )}

          <div className="flex justify-between">
            <dt className="text-[color:var(--color-ink-soft)]">Kargo</dt>
            <dd>
              {shownShipping === 0 ? (
                <span className="text-[color:var(--color-success)]">Ücretsiz</span>
              ) : (
                formatPrice(shownShipping)
              )}
            </dd>
          </div>

          <div className="flex items-baseline justify-between border-t border-[color:var(--color-line)] pt-3 text-[16px] font-semibold">
            <dt>Toplam</dt>
            <dd>{formatPrice(shownTotal)}</dd>
          </div>
        </dl>

        {/*
          Giriş yapılmamışsa müşteriyi ödeme sayfasına gönderip orada
          geri çevirmek yerine doğrudan girişe alıyoruz: ne olacağını
          önceden söylemek, tıkladıktan sonra sürpriz yaşatmaktan iyidir.
          Sepet çerezde durduğu için giriş sonrası kaybolmaz.
        */}
        <Link
          href={
            isLoggedIn
              ? applied
                ? `/odeme?kupon=${encodeURIComponent(applied.code)}`
                : "/odeme"
              : `/giris?next=${encodeURIComponent(
                  applied ? `/odeme?kupon=${applied.code}` : "/odeme",
                )}`
          }
          className="btn-primary mt-5 w-full"
        >
          <Lock size={14} strokeWidth={1.5} />
          {isLoggedIn ? "Ödemeye Geç" : "Giriş Yap ve Devam Et"}
        </Link>

        <p className="mt-3 text-center text-[11.5px] text-[color:var(--color-muted)]">
          {isLoggedIn
            ? "Ödeme sayfasında kart bilgileriniz 3D Secure ile korunur."
            : "Sipariş verebilmek için üyelik gerekiyor. Sepetin kaybolmaz."}
        </p>
      </div>

      <Link
        href="/"
        className="mt-4 block text-center text-[12.5px] text-[color:var(--color-brand)] underline"
      >
        Alışverişe devam et
      </Link>
    </aside>
  );
}
