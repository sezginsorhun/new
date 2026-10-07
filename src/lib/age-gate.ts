/**
 * 18+ YAŞ DOĞRULAMA
 *
 * Yetişkin ürünleri satan bir vitrin, ziyaretçiye içeriği göstermeden önce
 * yaşını sormak zorundadır. Bu basit bir beyan kontrolüdür — kimlik
 * doğrulaması değildir, öyle olduğu iddia da edilmez. Amaç, reşit olmayan
 * birinin içeriğe kazara denk gelmesini engellemek.
 *
 * KARAR ÇEREZDE TUTULUR, localStorage'da DEĞİL.
 * Çünkü karar sunucuda okunabilmelidir: perde sunucu tarafında render
 * edilir, böylece sayfa bir an görünüp sonra kapanmaz (istemcide kontrol
 * edilseydi içerik bir kare boyunca açıkta kalırdı).
 *
 * "HAYIR" ÇEREZE YAZILMAZ.
 * Yanlışlıkla "18 yaşından küçüğüm" diyen biri siteye bir yıl boyunca
 * giremez hâle gelmemeli. Reddeden kişiye kapanış ekranı gösterilir;
 * sayfayı yenilediğinde soru yeniden sorulur.
 */

export const AGE_COOKIE = "yas_onay";
export const AGE_MAX_AGE = 60 * 60 * 24 * 180; // 6 ay

export function isAgeConfirmed(raw: string | undefined): boolean {
  return raw === "evet";
}

/**
 * Perdenin GÖSTERİLMEDİĞİ yollar.
 *
 * Neden muaf:
 *  • /sayfa/...   → KVKK aydınlatma metni, mesafeli satış, iade şartları.
 *    Yasal metinler her zaman okunabilir olmalıdır; yaş sorusunun arkasına
 *    saklanamaz.
 *  • /giris, /kayit, /dogrulama → yönetici de panele buradan giriyor.
 *    Perde buraya konulsa panel girişi yaş sorusuna takılırdı.
 *  • /iletisim    → ulaşım bilgisi engellenmemeli.
 *  • /sayfa-bulunamadi → 404 ekranı.
 */
const EXEMPT_PREFIXES = [
  "/sayfa/",
  "/sayfa-bulunamadi",
  "/giris",
  "/kayit",
  "/dogrulama",
  "/iletisim",
];

export function ageGateExempt(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}
