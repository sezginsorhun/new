import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * SİTE GENELİ ETİKETLER
 *
 * Başlık, açıklama ve paylaşım görseli artık koda gömülü DEĞİL; yönetim
 * panelindeki Sistem → SEO ekranından geliyor. Böylece sekme başlığını
 * değiştirmek için dağıtım beklemek gerekmez.
 *
 * `title.template` içindeki %s, her sayfanın kendi başlığıyla değişir.
 * Ana sayfa bu şablonun DIŞINDADIR — kendi `generateMetadata`'sında
 * `title.absolute` kullanır, yoksa "Alenora | Alenora" gibi bir başlık
 * çıkardı.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  const template = settings.seo_title_template?.includes("%s")
    ? settings.seo_title_template
    : "%s"; // şablon bozuksa sayfa başlığını olduğu gibi göster
  const indexable = settings.seo_index !== "0";
  const ogImage = settings.seo_og_image?.trim();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.seo_home_title || settings.site_name || "Alenora",
      template,
    },
    description: settings.seo_default_description || undefined,
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: settings.site_name || "Alenora",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    /*
     * Dizine ekleme panelden kapatılabilir. Kapatmak siteyi aramalardan
     * düşürür — bu yüzden ekranda açık bir uyarı var.
     */
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    ...(settings.seo_google_verification?.trim()
      ? { verification: { google: settings.seo_google_verification.trim() } }
      : {}),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
