import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * İÇERİK GÜVENLİK POLİTİKASI (CSP)
 * Bir XSS açığı oluşsa bile saldırganın yapabileceklerini sınırlar:
 * yalnızca bu siteden gelen script çalışır, dış sunucuya veri gönderilemez,
 * sayfa başka sitelerin içine gömülemez.
 *
 * Geliştirme modunda Next.js'in canlı yenilemesi için eval ve websocket
 * izinleri açılır; canlıda kapalıdır.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  // Banka 3D Secure sayfası ödeme adımında iframe içinde açılır
  "frame-src 'self' https://*.iyzipay.com",
  "form-action 'self' https://*.iyzipay.com",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), usb=(), payment=(self)",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Proje kökünü net belirt (üst klasörlerdeki package.json'lar karışmasın)
  turbopack: { root: __dirname },

  // Sunucu sürümünü yanıt başlığında duyurma
  poweredByHeader: false,

  // Geliştirme sunucusuna yerel adreslerden erişime izin ver
  // (Next 16 varsayılan olarak yalnızca localhost'u kabul eder).
  allowedDevOrigins: ["localhost", "127.0.0.1", "0.0.0.0"],

  images: {
    // Örnek ürün görselleri SVG olarak üretiliyor.
    // CSP ile SVG içindeki script'ler etkisiz hale getirilir.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Dış görsel kaynağı (Cloudinary/S3) kullanacaksan buraya ekle:
    remotePatterns: [
      // { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/webp"],
  },

  async headers() {
    return [
      {
        // Tüm sayfalar
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Ödeme adımı: banka 3D Secure sayfası iframe içinde açıldığı için
        // bu sayfada çerçevelemeye kendi alan adımız içinde izin verilir.
        source: "/odeme/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: csp.replace("object-src 'none'", "frame-ancestors 'self' https://*.iyzipay.com; object-src 'none'"),
          },
        ],
      },
      {
        // Yüklenen görseller: tarayıcı türü asla tahmin etmesin
        source: "/uploads/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Content-Disposition", value: "inline" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  serverExternalPackages: ["mysql2", "bcryptjs"],
};

export default nextConfig;
