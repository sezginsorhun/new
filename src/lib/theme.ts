/**
 * TEMA — panelden düzenlenen görünüm
 *
 * İki katman var:
 *
 *  1) DEĞİŞKENLER — renk, köşe yuvarlaklığı, yazı boyutu. Panelde renk
 *     seçici ve kaydırıcıyla ayarlanır, CSS bilmeyi gerektirmez. Buradan
 *     üretilen `:root { ... }` bloğu globals.css'teki varsayılanların
 *     üzerine yazar.
 *
 *  2) ÖZEL CSS — serbest yazılan CSS. Değişkenlerle çözülemeyen her şey
 *     için. Aynı <style> etiketinin sonuna eklenir.
 *
 * NEREYE BASILIR
 * Yalnızca VİTRİN düzeninde ((shop)/layout.tsx). Yönetim paneline bilerek
 * uygulanmaz: hatalı bir CSS siteyi bozduğunda, onu düzeltecek ekranın da
 * bozulmuş olması seni dışarıda bırakırdı. Panel her zaman sağlam kalır.
 *
 * GÜVENLİK
 * Bu CSS sayfaya olduğu gibi gömülür. Yazabilen tek kişi `content.manage`
 * yetkisi olan yöneticidir, yani kaynak güvenilir sayılır — ama bir yazım
 * hatası ya da kopyala-yapıştır kazası sayfadan ÇIKIP HTML'e dönüşmemeli.
 * `sanitizeCustomCss` bunu engeller: </style> kaçışı, <script>, @import ve
 * javascript: gibi kalıplar temizlenir.
 */

import { DEFAULT_SETTINGS } from "./default-settings";

/* ------------------------------ değişkenler ------------------------------ */

/**
 * Panelden ayarlanabilen CSS değişkenleri.
 * `key`   → settings tablosundaki anahtar
 * `cssVar`→ globals.css'teki değişken adı
 */
export const THEME_COLORS = [
  { key: "theme_brand", cssVar: "--color-brand", label: "Vurgu rengi", help: "Butonlar, indirim etiketleri, bağlantılar" },
  { key: "theme_brand_dark", cssVar: "--color-brand-dark", label: "Vurgu — koyu", help: "Butonun üzerine gelince" },
  { key: "theme_brand_soft", cssVar: "--color-brand-soft", label: "Vurgu — açık", help: "Vurgulu kutuların zemini" },
  { key: "theme_ink", cssVar: "--color-ink", label: "Ana yazı", help: "Başlıklar ve gövde metni" },
  { key: "theme_ink_soft", cssVar: "--color-ink-soft", label: "İkincil yazı", help: "Açıklama metinleri" },
  { key: "theme_muted", cssVar: "--color-muted", label: "Soluk yazı", help: "Yardım metinleri, tarihler" },
  { key: "theme_cream", cssVar: "--color-cream", label: "Sayfa zemini", help: "Sitenin arka planı" },
  { key: "theme_surface_2", cssVar: "--color-surface-2", label: "Vurgulu bölüm zemini", help: "Gri şeritler, kutular" },
  { key: "theme_line", cssVar: "--color-line", label: "Çizgi rengi", help: "Kart ve tablo kenarlıkları" },
] as const;

export const THEME_NUMBERS = [
  {
    key: "theme_radius",
    cssVar: "--radius-card",
    label: "Köşe yuvarlaklığı",
    unit: "px",
    min: 0,
    max: 24,
    step: 1,
    help: "0 = tamamen düz köşe",
  },
  {
    key: "theme_font_scale",
    cssVar: null, // html { font-size } olarak uygulanır
    label: "Yazı boyutu",
    unit: "%",
    min: 85,
    max: 125,
    step: 1,
    help: "Tüm sitedeki yazıları birlikte büyütür/küçültür",
  },
] as const;

export type ThemeColorKey = (typeof THEME_COLORS)[number]["key"];
export type ThemeNumberKey = (typeof THEME_NUMBERS)[number]["key"];

/* ------------------------------ doğrulama -------------------------------- */

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Geçersiz bir renk sayfayı bozmasın: kabul etmiyorsak hiç yazmıyoruz. */
export function isValidColor(value: string): boolean {
  return HEX.test(value.trim());
}

/**
 * Özel CSS'i zararsız hale getirir.
 *
 * Buradaki asıl iş `</style>` kaçışını kapatmak: o dizi yazılabilseydi CSS
 * bloğu kapanır ve devamı HTML olarak çalışırdı. Geri kalan kalıplar
 * (script, @import, javascript:, expression()) tarayıcıların eski
 * sürümlerinde kod çalıştırmaya ya da dışarıdan dosya çekmeye yarayabildiği
 * için ayıklanır.
 *
 * Temizlenen her şeyin yerine CSS yorumu konur, böylece panelde "neden
 * çalışmadı" sorusunun cevabı kaynakta görünür.
 */
export function sanitizeCustomCss(input: string): string {
  if (!input) return "";
  return input
    .slice(0, 20_000) // kazara yapıştırılan dev dosyalar sayfayı şişirmesin
    .replace(/<\s*\/?\s*(style|script|iframe|object|embed)[^>]*>/gi, "/* engellendi */")
    .replace(/@import[^;]*;?/gi, "/* @import engellendi */")
    .replace(/javascript\s*:/gi, "/* engellendi */")
    .replace(/expression\s*\(/gi, "/* engellendi */(")
    .replace(/behavior\s*:/gi, "/* engellendi */");
}

/* ------------------------------ CSS üretimi ------------------------------ */

/**
 * Ayarlardan `<style>` içeriğini üretir.
 * Varsayılandan farkı olmayan değer YAZILMAZ — çıktı kısa kalsın ve
 * globals.css'i gereksiz yere gölgelemesin diye.
 */
export function buildThemeCss(settings: Record<string, string>): string {
  const rootLines: string[] = [];

  for (const { key, cssVar } of THEME_COLORS) {
    const value = (settings[key] ?? "").trim();
    if (!value || !isValidColor(value)) continue;
    if (value.toLowerCase() === String(DEFAULT_SETTINGS[key] ?? "").toLowerCase()) continue;
    rootLines.push(`  ${cssVar}: ${value};`);
  }

  const radius = Number(settings.theme_radius);
  if (Number.isFinite(radius) && radius >= 0 && radius <= 24) {
    if (String(radius) !== DEFAULT_SETTINGS.theme_radius) {
      rootLines.push(`  --radius-card: ${radius}px;`);
    }
  }

  const blocks: string[] = [];
  if (rootLines.length) blocks.push(`:root {\n${rootLines.join("\n")}\n}`);

  const scale = Number(settings.theme_font_scale);
  if (Number.isFinite(scale) && scale >= 85 && scale <= 125 && scale !== 100) {
    blocks.push(`html { font-size: ${scale}%; }`);
  }

  const custom = sanitizeCustomCss(settings.custom_css ?? "");
  if (custom.trim()) {
    blocks.push(`/* --- panelden yazılan özel CSS --- */\n${custom.trim()}`);
  }

  return blocks.join("\n\n");
}

/** Tema varsayılandan farklı mı? Panelde "sıfırla" düğmesini göstermek için. */
export function isThemeCustomized(settings: Record<string, string>): boolean {
  return buildThemeCss(settings).length > 0;
}
