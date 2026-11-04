"use client";

/**
 * 18+ PERDESİ — düğmeler
 *
 * Sunucu tarafı (AgeGate) bu bileşeni yalnızca karar verilmemişken render
 * eder; burada "görünsün mü" kontrolü yoktur, bu yüzden sunucu/istemci
 * uyuşmazlığı oluşmaz.
 *
 * Perde SAYDAM DEĞİLDİR: arkadaki içerik tamamen kapanır. Yarı saydam
 * olsaydı yaşını onaylamamış biri ürünleri bulanık da olsa görürdü.
 *
 * "Hayır" cevabı çereze YAZILMAZ (bkz. lib/age-gate.ts) — yanlış tıklayan
 * biri siteye aylarca giremez hâle gelmesin.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AGE_COOKIE, AGE_MAX_AGE } from "@/lib/age-gate";

export default function AgeGateClient({ siteName }: { siteName: string }) {
  const [state, setState] = useState<"soru" | "red" | "kapandi">("soru");

  /* Perde açıkken arkadaki sayfa kaydırılamaz. */
  useEffect(() => {
    if (state === "kapandi") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [state]);

  function onayla() {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${AGE_COOKIE}=evet; Path=/; Max-Age=${AGE_MAX_AGE}; SameSite=Lax${secure}`;
    setState("kapandi");
  }

  if (state === "kapandi") return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="yas-baslik"
      // Zemin BİLEREK tam opak (--color-cream = #ffffff): arkadaki vitrin
      // yarı saydam bile olsa görünmemeli.
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[color:var(--color-cream)] px-4 py-10"
    >
      <div className="w-full max-w-[460px] text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
          {siteName}
        </p>

        {state === "soru" ? (
          <>
            <h1 id="yas-baslik" className="mt-6 text-[26px] leading-tight">
              Bu sitede yetişkinlere yönelik ürünler satılmaktadır
            </h1>
            <p className="mt-4 text-[13.5px] leading-relaxed text-[color:var(--color-muted)]">
              Devam etmek için 18 yaşından büyük olduğunu onaylaman gerekiyor.
              Onayın tarayıcında saklanır, her ziyarette tekrar sorulmaz.
            </p>

            <div className="mt-8 flex flex-col gap-2.5">
              <button type="button" onClick={onayla} className="btn-primary w-full py-3 text-[14px]">
                18 yaşından büyüğüm, devam et
              </button>
              <button
                type="button"
                onClick={() => setState("red")}
                className="btn-ghost w-full py-3 text-[14px]"
              >
                18 yaşından küçüğüm
              </button>
            </div>

            <p className="mt-7 text-[12px] leading-relaxed text-[color:var(--color-muted)]">
              Devam ederek{" "}
              <Link href="/sayfa/kullanim-kosullari" className="link-underline text-[color:var(--color-ink)]">
                kullanım koşullarını
              </Link>{" "}
              ve{" "}
              <Link href="/sayfa/gizlilik-politikasi" className="link-underline text-[color:var(--color-ink)]">
                KVKK aydınlatma metnini
              </Link>{" "}
              okuduğunu kabul etmiş olursun.
            </p>
          </>
        ) : (
          <>
            <h1 id="yas-baslik" className="mt-6 text-[26px] leading-tight">
              Bu siteyi görüntüleyemiyorsun
            </h1>
            <p className="mt-4 text-[13.5px] leading-relaxed text-[color:var(--color-muted)]">
              İçerik yalnızca 18 yaşından büyük ziyaretçiler içindir. Anlayışın
              için teşekkür ederiz.
            </p>
            <button
              type="button"
              onClick={() => setState("soru")}
              className="btn-ghost mt-8 text-[13px]"
            >
              Yanlış seçtim, geri dön
            </button>
          </>
        )}
      </div>
    </div>
  );
}
