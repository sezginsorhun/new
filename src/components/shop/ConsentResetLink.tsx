"use client";

/**
 * ÇEREZ TERCİHİNİ YENİDEN SOR
 *
 * KVKK açısından önemli: onayı geri almak, vermek kadar kolay olmalıdır.
 * Bu bağlantı kaydedilmiş tercihi siler ve sayfayı yeniler — band yeniden
 * açılır, ziyaretçi kararını değiştirebilir.
 */

import { CONSENT_COOKIE } from "@/lib/consent";

export default function ConsentResetLink() {
  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
        window.location.reload();
      }}
      className="link-underline"
    >
      Çerez tercihleri
    </button>
  );
}
