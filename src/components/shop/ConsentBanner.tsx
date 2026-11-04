/**
 * KVKK / ÇEREZ ONAY BANDI — karar okuyucu
 *
 * Çerezi sunucuda okur ve bandı yalnızca henüz karar verilmemişse
 * gösterir. Böylece tekrar ziyaretlerde band bir an görünüp kaybolmaz
 * (istemci tarafında kontrol edilseydi öyle olurdu).
 */

import { cookies } from "next/headers";
import { CONSENT_COOKIE, parseConsent } from "@/lib/consent";
import ConsentBannerClient from "./ConsentBannerClient";

export default async function ConsentBanner() {
  const store = await cookies();
  const decided = parseConsent(store.get(CONSENT_COOKIE)?.value);
  if (decided) return null;
  return <ConsentBannerClient />;
}
