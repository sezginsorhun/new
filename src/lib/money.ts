/**
 * PARA İŞLEMLERİ
 *
 * Kural: Veritabanında ve tüm hesaplamalarda para KURUŞ (integer) tutulur.
 *   299,90 TL -> 29990 kuruş
 * Sadece ekrana yazdırırken TL'ye çevrilir. Böylece 0.1 + 0.2 = 0.30000000004
 * gibi kayan nokta hataları hiç oluşmaz.
 */

/** 29990 -> "299,90 TL" */
export function formatPrice(kurus: number): string {
  return (
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(kurus / 100) + " TL"
  );
}

/** 29990 -> "299,90"  (birim yazısı olmadan) */
export function formatAmount(kurus: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kurus / 100);
}

/** "299,90" veya "299.90" -> 29990 */
export function parsePrice(input: string | number): number {
  if (typeof input === "number") return Math.round(input * 100);
  const normalized = input.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

/** Sanal POS sağlayıcılarına gönderilecek format: 29990 -> "299.90" */
export function toProviderPrice(kurus: number): string {
  return (kurus / 100).toFixed(2);
}

/** KDV dahil fiyattan KDV tutarını ayırır. */
export function taxOf(grossKurus: number, taxRate: number): number {
  return Math.round(grossKurus - grossKurus / (1 + taxRate / 100));
}

/** İndirim yüzdesi: 39990 -> 29990 arası %25 */
export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
