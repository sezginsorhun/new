/**
 * Örnek ürün görselleri üretir (public/images/products/*.svg).
 * Telif sorunu olmayan, kod ile üretilmiş soyut görseller.
 * Gerçek fotoğraflarını admin panelinden yükleyince bunların yerini alır.
 */

import { mkdirSync, writeFileSync } from "fs";
import path from "path";

type Palette = { bg: string; accent: string; ink: string };

const PALETTES: Record<string, Palette> = {
  Siyah: { bg: "#2a2528", accent: "#4a4247", ink: "#e9e2e5" },
  Beyaz: { bg: "#eae2dc", accent: "#cdbfb5", ink: "#5b4c43" },
  Pudra: { bg: "#eed3cb", accent: "#d8ab9e", ink: "#6f4a40" },
  Bordo: { bg: "#5c2430", accent: "#7a3543", ink: "#f0dde1" },
  Vizon: { bg: "#d4baa4", accent: "#b6977d", ink: "#5c462f" },
  Lacivert: { bg: "#252f45", accent: "#3a4761", ink: "#dfe4ee" },
  Gri: { bg: "#aba4a0", accent: "#8e8783", ink: "#3d3735" },
  Krem: { bg: "#e8dbc6", accent: "#cfbda1", ink: "#5f5442" },
  Yeşil: { bg: "#33453a", accent: "#465c4e", ink: "#dde8e0" },
  Mavi: { bg: "#9fbdd0", accent: "#7ba0ba", ink: "#2e4756" },
};

function svg(label: string, sub: string, palette: Palette, seed: number) {
  const { bg, accent, ink } = palette;
  // Yumuşak, kumaş hissi veren dalgalar
  const waves = Array.from({ length: 4 }, (_, i) => {
    const y = 320 + i * 130 + ((seed * (i + 3)) % 40);
    const c1 = 180 + ((seed * (i + 5)) % 120);
    const c2 = 700 - ((seed * (i + 2)) % 140);
    return `<path d="M0 ${y} C ${c1} ${y - 90}, ${c2} ${y + 110}, 900 ${y - 30} L900 1200 L0 1200 Z"
      fill="${accent}" opacity="${0.18 + i * 0.09}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.32" r="0.62">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#g)"/>
  ${waves}
  <rect width="900" height="1200" fill="url(#glow)"/>
  <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle" fill="${ink}">
    <text x="450" y="556" font-size="46" letter-spacing="1">${escapeXml(label)}</text>
    <text x="450" y="606" font-size="20" letter-spacing="6" opacity="0.72"
      font-family="-apple-system, Helvetica, Arial, sans-serif">${escapeXml(sub.toUpperCase())}</text>
  </g>
</svg>`;
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

export function writeProductImage(
  fileName: string,
  label: string,
  sub: string,
  colorName: string,
  seed: number,
): string {
  const dir = path.join(process.cwd(), "public", "images", "products");
  mkdirSync(dir, { recursive: true });
  const palette = PALETTES[colorName] ?? PALETTES.Pudra;
  writeFileSync(path.join(dir, fileName), svg(label, sub, palette, seed), "utf8");
  return `/images/products/${fileName}`;
}

/**
 * Hero banner zemini. Başlık/alt başlık yazısı HTML tarafında (HeroSlider)
 * basıldığı için görselin İÇİNE yazı koymuyoruz — yoksa üst üste biner.
 */
export function writeBannerImage(fileName: string, colorName: string): string {
  const dir = path.join(process.cwd(), "public", "images", "banners");
  mkdirSync(dir, { recursive: true });
  const p = PALETTES[colorName] ?? PALETTES.Pudra;
  const content = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="820" viewBox="0 0 1920 820">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.bg}"/><stop offset="100%" stop-color="${p.accent}"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.72" cy="0.34" r="0.58">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="820" fill="url(#bg)"/>
  <circle cx="1430" cy="300" r="330" fill="#ffffff" opacity="0.10"/>
  <path d="M0 600 C 420 470, 900 720, 1920 520 L1920 820 L0 820 Z" fill="${p.accent}" opacity="0.45"/>
  <path d="M0 690 C 520 590, 1080 790, 1920 640 L1920 820 L0 820 Z" fill="${p.bg}" opacity="0.4"/>
  <rect width="1920" height="820" fill="url(#halo)"/>
</svg>`;
  writeFileSync(path.join(dir, fileName), content, "utf8");
  return `/images/banners/${fileName}`;
}

export function writeCategoryImage(fileName: string, label: string, colorName: string): string {
  const dir = path.join(process.cwd(), "public", "images", "categories");
  mkdirSync(dir, { recursive: true });
  const p = PALETTES[colorName] ?? PALETTES.Pudra;
  const content = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stop-color="${p.bg}"/><stop offset="100%" stop-color="${p.accent}"/>
  </linearGradient></defs>
  <rect width="640" height="800" fill="url(#g)"/>
  <circle cx="470" cy="250" r="210" fill="#ffffff" opacity="0.10"/>
  <path d="M0 560 C 200 480, 420 640, 640 540 L640 800 L0 800 Z" fill="${p.accent}" opacity="0.5"/>
  <text x="48" y="726" font-size="34" fill="${p.ink}" font-family="Georgia, serif">${escapeXml(label)}</text>
</svg>`;
  writeFileSync(path.join(dir, fileName), content, "utf8");
  return `/images/categories/${fileName}`;
}
