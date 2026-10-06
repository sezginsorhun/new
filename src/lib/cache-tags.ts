/**
 * ÖNBELLEK ETİKETLERİ
 *
 * Vitrin sayfalarının tamamı her istekte veritabanına gidiyordu. Paylaşımlı
 * hostingde asıl yavaşlık buradan gelir: tek bir ana sayfa açılışı ayarlar,
 * kategoriler, bölümler, slaytlar ve dört ayrı ürün listesi için ayrı ayrı
 * sorgu çalıştırır.
 *
 * Çözüm iki katmanlı:
 *
 *  1) İSTEK İÇİ TEKİLLEŞTİRME (react cache): aynı istek sırasında aynı
 *     veriyi iki bileşen isterse sorgu bir kez çalışır. Örneğin ayarlar
 *     hem header hem footer tarafından isteniyor — artık tek sorgu.
 *     Bu katmanın bayatlama riski YOKTUR.
 *
 *  2) İSTEKLER ARASI ÖNBELLEK (unstable_cache): nadiren değişen veriler
 *     kısa süre saklanır. Panelden bir değişiklik yapıldığında ilgili
 *     etiket geçersiz kılınır ve değişiklik ANINDA görünür.
 *
 * TTL'ler bilerek kısa (2 dakika): bir etiketi geçersiz kılmayı unutsak
 * bile sistem kendi kendini iki dakikada toparlar. Uzun TTL, unutulan bir
 * invalidasyonu saatlerce süren bir hataya dönüştürürdü.
 *
 * ÖNBELLEĞE ALINMAYANLAR — bilerek:
 *   • Ürün detayı ve stok: stok anlık değişir, yanlış "stokta var" göstermek
 *     sipariş iptaline yol açar.
 *   • Sepet, ödeme, sipariş, hesap sayfaları: kişiye özeldir.
 *   • Fiyat hesaplaması: her zaman veritabanından, canlı.
 */

export const CACHE_TAGS = {
  /** Ayarlar: site adı, duyuru şeridi, footer, kargo limitleri */
  settings: "ayarlar",
  /** Kategoriler ve vitrin ürün listeleri */
  catalog: "katalog",
  /** Ana sayfa bölümleri ve carousel slaytları */
  home: "anasayfa",
} as const;

/** Nadiren değişen veriler için ortak süre (saniye). */
export const CACHE_TTL = 120;
