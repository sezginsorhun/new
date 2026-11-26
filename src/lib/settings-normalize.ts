/**
 * AYAR TEMİZLEME — "örnek" değerler sitede asla görünmesin
 *
 * Panelde Ayarlar formu bir kez kaydedildiğinde, o andaki tüm varsayılanlar
 * veritabanına yazılır. Eski kurulumdaki varsayılanlar ise örnek değerlerdi:
 * "0850 000 00 00", "TR00 0000 …" IBAN, "Mersis No: 0000000000000", iç giyim
 * tanıtım metni… Bunlar sitede göründüğünde mağaza sahte görünür; sahte IBAN
 * ise müşteriyi parayı yanlış yere göndermeye bile yöneltebilir.
 *
 * Bu modül ayar OKUNURKEN çalışır, veritabanına yazmaz:
 *   - Bilinen eski örnek değerler yeni karşılıklarıyla değiştirilir.
 *   - Uydurma telefon / IBAN / MERSIS kalıpları boşaltılır (boş alan sitede
 *     hiç gösterilmez).
 *   - Hiç değiştirilmemiş SEO metinlerindeki "Alenora", panelde girilen
 *     site adıyla değişir.
 * Sahibinin elle girdiği gerçek değerlere dokunulmaz.
 */

import { DEFAULT_SETTINGS } from "@/lib/default-settings";

/** Eski kurulumun örnek değerleri → bugünkü karşılığı */
const LEGACY_VALUES: Record<string, string[]> = {
  contact_phone: ["0850 000 00 00"],
  contact_address: ["Merkez Mah. Örnek Cad. No:1, Şişli / İstanbul"],
  instagram_url: ["https://instagram.com/", "https://instagram.com", "https://www.instagram.com/"],
  footer_about: [
    "Nefes alan sertifikalı kumaşlar, iz bırakmayan dikişler ve her bedene yakışan kalıplar.",
  ],
  footer_col1_links: [
    "Kadın|/kategori/kadin\nErkek|/kategori/erkek\nYeni gelenler|/kategori/kadin\nİndirimdekiler|/indirimli",
  ],
  footer_col2_links: [
    "Sipariş takibi|/hesabim/siparisler\nKargo ve teslimat|/sayfa/kargo-teslimat\nİade ve değişim|/sayfa/iade-degisim\nBeden rehberi|/sayfa/beden-rehberi",
  ],
  footer_col3_links: [
    "Hakkımızda|/sayfa/hakkimizda\nİletişim|/iletisim\nGizlilik politikası|/sayfa/gizlilik\nMesafeli satış sözleşmesi|/sayfa/mesafeli-satis",
  ],
  // Eski temanın varsayılanları kaydedilmişse yeni tema uygulansın
  theme_brand: ["#c62a4e"],
  theme_brand_dark: ["#a41f3e"],
  theme_brand_soft: ["#fdeef1"],
  theme_radius: ["2"],
  theme_surface_2: ["#f6f4f3"],
  theme_line: ["#e7e3e0"],
  seo_home_title: ["Alenora — Yetişkin Ürünleri ve İç Giyim"],
  seo_home_description: [
    "Cinsel sağlık ürünleri, çift ürünleri ve iç giyim. Gizli ve isimsiz paketle gönderim, 750 TL üzeri ücretsiz kargo.",
  ],
  seo_default_description: [
    "Alenora — yetişkin ürünleri ve iç giyim. Gizli paketle hızlı gönderim.",
  ],
};

/** Rakamlarının neredeyse tamamı 0 olan telefon/numara: "0850 000 00 00" */
function isZeroPlaceholder(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7) return false;
  const zeros = digits.split("").filter((d) => d === "0").length;
  return zeros >= digits.length - 3;
}

/** IBAN satırı örnek mi? "TR00 0000 0000 …" */
function isPlaceholderIban(line: string): boolean {
  const iban = line.toUpperCase().replace(/\s/g, "").match(/TR\d{24}/)?.[0];
  if (!iban) return /TR0{2}\s?0{4}/i.test(line);
  return /^TR0{6,}/.test(iban) || isZeroPlaceholder(iban);
}

/** Footer notundaki uydurma MERSIS/ETBİS ifadelerini ayıklar. */
function cleanFooterNote(note: string): string {
  if (!/0{8,}/.test(note.replace(/\s/g, ""))) return note;
  // Sıfırlarla dolu satır güvenilir bir beyan değildir; tamamen düşürülür,
  // yerine şirket bilgilerinden kurulan satır gösterilir.
  return "";
}

export function normalizeSettings(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...raw };
  const defaults = DEFAULT_SETTINGS as Record<string, string>;

  for (const [key, legacy] of Object.entries(LEGACY_VALUES)) {
    const value = (out[key] ?? "").replace(/\r\n/g, "\n").trim();
    if (legacy.some((old) => old.trim() === value)) out[key] = defaults[key] ?? "";
  }

  if (isZeroPlaceholder(out.contact_phone ?? "")) out.contact_phone = "";
  if (isZeroPlaceholder(out.whatsapp_number ?? "")) out.whatsapp_number = "";
  if (isZeroPlaceholder(out.company_mersis ?? "")) out.company_mersis = "";
  if (isZeroPlaceholder(out.company_tax_number ?? "")) out.company_tax_number = "";

  out.bank_accounts = (out.bank_accounts ?? "")
    .split("\n")
    .filter((line) => line.trim() && !isPlaceholderIban(line))
    .join("\n");

  out.footer_note = cleanFooterNote(out.footer_note ?? "");

  // Örnek e-posta (info@alenora.com), site adı değiştirilmişse eski markaya aittir.
  const siteName = (out.site_name || "").trim();
  const rebranded = siteName && siteName.toLowerCase() !== "alenora";
  if (rebranded && /@alenora\.com$/i.test(out.contact_email ?? "")) out.contact_email = "";

  // Elle yazılmamış SEO metinlerinde eski marka adı yeni adla değişir.
  if (rebranded) {
    for (const key of [
      "seo_title_template",
      "seo_home_title",
      "seo_home_description",
      "seo_default_description",
    ]) {
      if (out[key]) out[key] = out[key].replace(/Alenora/g, siteName);
    }
  }

  return out;
}
