import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proje kökünü net belirt (üst klasörlerdeki package.json'lar karışmasın)
  turbopack: { root: __dirname },

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

  // Ödeme adımında banka 3D sayfası iframe içinde açıldığı için
  // güvenlik başlıklarını fazla kısıtlamıyoruz.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },

  serverExternalPackages: ["postgres", "bcryptjs"],
};

export default nextConfig;
