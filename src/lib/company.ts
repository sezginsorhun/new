/**
 * SATICI BİLGİLERİ
 *
 * Panel → Ayarlar → Satıcı Bilgileri alanlarından kurulur. Boş alanlar
 * hiçbir yerde yazılmaz: yasal metinde "………" ya da uydurma numara
 * görünmesi, alanın hiç olmamasından daha kötüdür.
 */

export type CompanyInfo = {
  title: string;
  taxOffice: string;
  taxNumber: string;
  mersis: string;
  kep: string;
  etbis: string;
  address: string;
  phone: string;
  email: string;
  site: string;
};

export function companyInfo(settings: Record<string, string>): CompanyInfo {
  const t = (key: string) => (settings[key] ?? "").trim();
  return {
    title: t("company_title") || t("site_name"),
    taxOffice: t("company_tax_office"),
    taxNumber: t("company_tax_number"),
    mersis: t("company_mersis"),
    kep: t("company_kep"),
    etbis: t("company_etbis"),
    address: t("contact_address"),
    phone: t("contact_phone"),
    email: t("contact_email"),
    site: (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
  };
}

/** Footer'daki tek satırlık yasal bilgi */
export function companyLegalLine(settings: Record<string, string>): string {
  const c = companyInfo(settings);
  if (!t(settings.company_title)) return "";
  return [
    c.title,
    c.taxOffice && c.taxNumber ? `${c.taxOffice} V.D. ${c.taxNumber}` : "",
    c.mersis ? `MERSİS: ${c.mersis}` : "",
    c.etbis ? "ETBİS'e kayıtlıdır" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function t(value: string | undefined) {
  return (value ?? "").trim();
}

/** Yasal metinlerde kullanılan "satıcı bilgileri" bloğu (satır satır) */
export function companyBlock(settings: Record<string, string>): string[] {
  const c = companyInfo(settings);
  return [
    `Unvan: ${c.title}`,
    c.address ? `Adres: ${c.address}` : "",
    c.phone ? `Telefon: ${c.phone}` : "",
    c.email ? `E-posta: ${c.email}` : "",
    c.kep ? `KEP: ${c.kep}` : "",
    c.taxOffice || c.taxNumber
      ? `Vergi dairesi / no: ${[c.taxOffice, c.taxNumber].filter(Boolean).join(" / ")}`
      : "",
    c.mersis ? `MERSİS no: ${c.mersis}` : "",
    c.site ? `Web sitesi: ${c.site}` : "",
  ].filter(Boolean);
}
