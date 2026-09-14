import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Alenora";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — İç Giyim`,
    template: `%s | ${siteName}`,
  },
  description:
    "Kadın ve erkek iç giyim, gecelik, pijama, plaj giyim. Her tende güzel. 750 TL üzeri ücretsiz kargo.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf8f6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
