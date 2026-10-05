/**
 * ROBOTS.TXT
 *
 * Arama motorlarına nereyi taramasını söyler. Yönetim paneli, sepet,
 * ödeme ve hesap sayfaları taranmaz — hem gereksiz hem gizli.
 *
 * Gizli yönetim adresi BİLEREK buraya yazılmaz: robots.txt herkese
 * açıktır, oraya yazmak adresi ilan etmek olur. Onun yerine /admin
 * kapatılır (zaten 404 döner).
 */

import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/sepet", "/odeme", "/hesabim", "/giris", "/kayit", "/dogrulama", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
