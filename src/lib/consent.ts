/**
 * KVKK / ÇEREZ ONAYI
 *
 * 6698 sayılı kanun ve çerez mevzuatı açısından çerezler ikiye ayrılır:
 *
 *  ZORUNLU ÇEREZLER — sepet, oturum, CSRF jetonu. Bunlar hizmetin
 *  çalışması için gereklidir, onaya tabi DEĞİLDİR ve "kabul etmiyorum"
 *  denildiğinde de çalışmaya devam eder. (Aksi hâlde site kullanılamaz
 *  hâle gelir ki kanun bunu istemez.)
 *
 *  İSTEĞE BAĞLI ÇEREZLER — analiz ve pazarlama. Bunlar yalnızca açık
 *  onay varsa çalışır.
 *
 * Tercih bir çerezde saklanır (localStorage'da değil), çünkü sunucu
 * tarafında da okunabilmesi gerekir: isteğe bağlı script'ler sunucuda
 * render edilirken karara göre eklenir ya da eklenmez.
 *
 * Onayı geri almak, vermek kadar kolay olmalıdır: footer'daki
 * "Çerez tercihleri" bağlantısı tercihi siler ve bandı yeniden açar.
 */

export const CONSENT_COOKIE = "kvkk_onay";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 yıl

export type ConsentValue = "kabul" | "ret";

export function parseConsent(raw: string | undefined): ConsentValue | null {
  if (raw === "kabul" || raw === "ret") return raw;
  return null;
}

/**
 * İsteğe bağlı (analiz/pazarlama) çerezler çalışabilir mi?
 * Karar verilmemişse ÇALIŞAMAZ — sessizlik onay değildir.
 */
export function optionalCookiesAllowed(raw: string | undefined): boolean {
  return parseConsent(raw) === "kabul";
}
