/**
 * "IP ADRESİM NE?" UCU
 *
 * Panelin IP kısıtını ayarlarken kendi adresini bilmen gerekir. Bu uç,
 * isteği yapan tarayıcının sunucudan görünen IP'sini düz metin olarak
 * döner — tarayıcıda açıp doğrudan okuyabilirsin.
 *
 * Neden üçüncü taraf bir "IP adresim ne" sitesi değil: oradaki adres
 * senin tarayıcının o siteye giderken kullandığı adrestir; burada ise
 * tenotesi.com'un GERÇEKTEN gördüğü adresi alırsın. Kısıtı uygulayan
 * taraf burası olduğu için doğru değer de burada okunandır.
 *
 * Gizli bir bilgi açığa çıkarmaz: ziyaretçiye zaten kendi IP'sini söyler.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { clientIpFromHeaders, isAllowedAdminIp, parseAllowlist } from "@/lib/ip-allowlist";

export const dynamic = "force-dynamic";

export async function GET() {
  const h = await headers();
  const ip = clientIpFromHeaders((name) => h.get(name));
  const raw = process.env.ADMIN_IP_ALLOWLIST;
  const rules = parseAllowlist(raw);

  const lines = [
    `IP adresin: ${ip || "okunamadı"}`,
    "",
    rules.length === 0
      ? "Panel IP kısıtı: KAPALI (herkes gizli adresten giriş ekranını görebilir)"
      : `Panel IP kısıtı: AÇIK — ${rules.length} kural tanımlı`,
    rules.length === 0
      ? ""
      : `Bu adres panele girebilir mi: ${isAllowedAdminIp(ip, raw) ? "EVET" : "HAYIR"}`,
    "",
    "Kısıtı ayarlamak için hPanel → Dağıtımlar → Ayarlar bölümünde",
    "ADMIN_IP_ALLOWLIST değişkenine bu adresi yaz.",
  ];

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
