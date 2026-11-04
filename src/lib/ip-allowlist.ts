/**
 * YÖNETİM PANELİ IP KISITI
 *
 * `ADMIN_IP_ALLOWLIST` ortam değişkeninde yazan adreslerden gelmeyen
 * istekler paneli göremez — panel yokmuş gibi 404 alırlar.
 *
 * TASARIM KARARLARI (kendini kilitlememek için):
 *
 *  • Değişken BOŞSA kısıtlama uygulanmaz. Yanlışlıkla boş bırakmak
 *    kilitlenmeye değil, sadece korumanın kapalı kalmasına yol açar.
 *    Kilitlenmek, geri dönüşü zor olduğu için daha büyük zarardır.
 *
 *  • Liste ortam değişkenindedir, kodda değil. IP'n değişirse hPanel'den
 *    30 saniyede güncellenir; kod gönderip yeniden derlemek gerekmez.
 *
 *  • Virgülle birden çok değer yazılabilir. Tek IP (`88.1.2.3`), CIDR
 *    aralığı (`88.1.2.0/24`) ve IPv6 desteklenir. Dinamik IP kullanan
 *    bağlantılarda ISS'nin verdiği /24 aralığını yazmak, her modem
 *    yenilemesinde kilitlenmemenin pratik yoludur.
 *
 *  • `*` yazılırsa herkese açıktır (kısıtı geçici kapatmanın açık yolu).
 *
 * UYARI: IP, `X-Forwarded-For` başlığından okunur ve bu başlık taklit
 * edilebilir. Bu yüzden IP kısıtı TEK BAŞINA bir güvenlik katmanı değildir;
 * gizli panel adresi, şifre, 2FA ve hız sınırının ÜSTÜNE eklenen bir
 * katmandır. Hiçbiri bunun yerine geçmez, bu da onların yerine geçmez.
 */

/** Ortam değişkenini okunabilir bir listeye çevirir. */
export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** IPv4 adresini 32 bitlik sayıya çevirir. Geçersizse null. */
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

/** IPv6'yı karşılaştırmak için sadeleştirir (kısaltmaları açar). */
function normalizeIpv6(ip: string): string {
  const clean = ip.replace(/^\[|\]$/g, "").split("%")[0].toLowerCase();
  if (!clean.includes(":")) return clean;
  const [head, tail] = clean.split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  const fill = 8 - headParts.length - tailParts.length;
  const parts =
    clean.includes("::") && fill > 0
      ? [...headParts, ...Array(fill).fill("0"), ...tailParts]
      : clean.split(":");
  return parts.map((p) => p.padStart(4, "0")).join(":");
}

/** Tek bir kuralın verilen IP ile eşleşip eşleşmediğine bakar. */
function matches(rule: string, ip: string): boolean {
  if (rule === "*") return true;

  // IPv4 aralığı: 88.1.2.0/24
  if (rule.includes("/") && rule.includes(".")) {
    const [network, bitsRaw] = rule.split("/");
    const bits = Number(bitsRaw);
    if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
    const networkInt = ipv4ToInt(network);
    const ipInt = ipv4ToInt(ip);
    if (networkInt === null || ipInt === null) return false;
    if (bits === 0) return true;
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    return (networkInt & mask) === (ipInt & mask);
  }

  // Düz IPv4
  if (rule.includes(".") && ip.includes(".")) {
    return ipv4ToInt(rule) !== null && ipv4ToInt(rule) === ipv4ToInt(ip);
  }

  // IPv6
  if (rule.includes(":") && ip.includes(":")) {
    return normalizeIpv6(rule) === normalizeIpv6(ip);
  }

  return false;
}

/**
 * Panel bu IP'ye açık mı?
 * Liste boşsa herkese açıktır (bkz. yukarıdaki tasarım kararı).
 */
export function isAllowedAdminIp(ip: string, raw: string | undefined): boolean {
  const rules = parseAllowlist(raw);
  if (rules.length === 0) return true;
  const candidate = (ip || "").trim();
  if (!candidate) return false;
  return rules.some((rule) => matches(rule, candidate));
}

/** İsteğin geldiği IP. Ters vekil arkasında ilk X-Forwarded-For değeridir. */
export function clientIpFromHeaders(get: (name: string) => string | null): string {
  const forwarded = get("x-forwarded-for") ?? "";
  return (
    forwarded.split(",")[0]?.trim() ||
    get("cf-connecting-ip") ||
    get("x-real-ip") ||
    ""
  );
}
