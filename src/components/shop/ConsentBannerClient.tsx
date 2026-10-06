"use client";

/**
 * KVKK / ÇEREZ ONAY BANDI — düğmeler
 *
 * Sunucu tarafı (ConsentBanner) bandı yalnızca henüz karar verilmemişse
 * render eder; bu yüzden burada "gösterilsin mi" kontrolü yoktur ve
 * sunucu/istemci uyuşmazlığı oluşmaz.
 *
 * Tercih çereze yazılır. Reddetme de bir karardır: aynı çereze "ret"
 * yazılır ki ziyaretçiye her sayfada tekrar sorulmasın.
 */

import { useState } from "react";
import Link from "next/link";
import { CONSENT_COOKIE, CONSENT_MAX_AGE, type ConsentValue } from "@/lib/consent";

export default function ConsentBannerClient() {
  const [closed, setClosed] = useState(false);

  function decide(value: ConsentValue) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
    setClosed(true);
  }

  if (closed) return null;

  return (
    <div
      role="region"
      aria-label="Çerez ve kişisel veri tercihi"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-line)] bg-white"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
        <p className="flex-1 text-[12.5px] leading-relaxed text-[color:var(--color-muted)]">
          Siteyi çalıştırmak için zorunlu çerezleri kullanıyoruz. Ek olarak, deneyimi
          geliştirmek ve ölçümleme yapmak için isteğe bağlı çerezler kullanmak istiyoruz.
          Kişisel verilerinin nasıl işlendiğini{" "}
          <Link href="/sayfa/gizlilik-politikasi" className="link-underline text-[color:var(--color-ink)]">
            KVKK Aydınlatma Metni
          </Link>
          &apos;nde bulabilirsin. Reddetsen de alışverişe devam edebilirsin.
        </p>

        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => decide("ret")} className="btn-ghost text-[13px]">
            Kabul etmiyorum
          </button>
          <button type="button" onClick={() => decide("kabul")} className="btn-primary text-[13px]">
            Kabul ediyorum
          </button>
        </div>
      </div>
    </div>
  );
}
