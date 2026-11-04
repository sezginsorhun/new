/**
 * 18+ PERDESİ — karar okuyucu
 *
 * Çerezi ve istenen yolu SUNUCUDA okur. Karar verilmişse ya da yol muafsa
 * hiçbir şey render edilmez — yani perde boşuna gelip gitmez.
 *
 * İstenen yol, proxy'nin isteğe eklediği `x-yol` başlığından okunuyor:
 * layout bileşenleri Next.js'te pathname'i doğrudan göremez.
 */

import { cookies, headers } from "next/headers";
import { AGE_COOKIE, ageGateExempt, isAgeConfirmed } from "@/lib/age-gate";
import { getSetting } from "@/lib/settings";
import AgeGateClient from "./AgeGateClient";

export default async function AgeGate() {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  if (isAgeConfirmed(cookieStore.get(AGE_COOKIE)?.value)) return null;
  if (ageGateExempt(headerList.get("x-yol"))) return null;

  const siteName = (await getSetting("site_name")) || "Alenora";
  return <AgeGateClient siteName={siteName} />;
}
