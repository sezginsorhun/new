/**
 * nilseraluminyum.com — Next.js yapılandırması
 *
 * Sayfaların kendisi `nilser/build.mjs` ile public/ klasörüne düz HTML olarak
 * üretilir (npm run build öncesinde "prebuild" adımı). Next.js bunları
 * sunar ve yalnızca teklif formunu (/api/teklif) çalıştırır.
 */

const SITE_HOST = "nilseraluminyum.com";
const PAGES = ["sineklik", "plise-perde", "cam-balkon", "dusakabin", "iletisim", "katalog", "kvkk", "tesekkurler"];

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  serverExternalPackages: ["nodemailer"],

  async redirects() {
    return [
      // www → çıplak alan adı (tek kanonik adres)
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${SITE_HOST}` }],
        destination: `https://${SITE_HOST}/:path*`,
        permanent: true,
      },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },

  async rewrites() {
    return {
      // public/ içindeki klasör sayfalarını temiz adreslerle sun
      afterFiles: [
        { source: "/", destination: "/index.html" },
        ...PAGES.map((p) => ({ source: `/${p}/`, destination: `/${p}/index.html` })),
      ],
    };
  },

  async headers() {
    return [
      {
        // Katalog PDF'i hariç: CSP tarayıcının PDF görüntüleyicisini engelleyebilir
        source: "/((?!assets/katalog/).*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        source: "/assets/:dir(img|fonts)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
