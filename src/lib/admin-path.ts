/**
 * GİZLİ YÖNETİM ADRESİ
 *
 * Panel dosyaları projede /admin altında durur ama dışarıya ASLA bu adresle
 * açılmaz. Dışarıdan erişim yalnızca .env'deki ADMIN_PATH ile tanımlı gizli
 * yoldan olur; proxy.ts bu yolu /admin'e çevirir ve doğrudan /admin isteğine
 * 404 döner.
 *
 *   ADMIN_PATH=yonetim-8f3a2c
 *   →  https://alenora.com/yonetim-8f3a2c
 *
 * Bu "gizlilik" tek başına güvenlik değildir; asıl koruma giriş + rol +
 * 2FA kontrolüdür. Ama bot taramalarını ve otomatik saldırı denemelerini
 * pratikte sıfıra indirir.
 *
 * Bu dosya hem sunucuda hem istemcide çalışabilir (server-only değildir),
 * çünkü panel içindeki bağlantıların doğru adresi üretmesi gerekir.
 */

const FALLBACK = "yonetim";

function clean(value: string | undefined): string {
  const path = (value ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!path) return FALLBACK;
  // Sadece harf, rakam, tire ve alt çizgi
  if (!/^[a-z0-9][a-z0-9_-]{2,48}$/i.test(path)) return FALLBACK;
  return path;
}

/**
 * Sunucu tarafında ADMIN_PATH, istemcide NEXT_PUBLIC_ADMIN_PATH okunur.
 * İkisi de aynı değeri taşımalıdır (README'de anlatılıyor).
 */
export const ADMIN_PATH = clean(
  process.env.ADMIN_PATH ?? process.env.NEXT_PUBLIC_ADMIN_PATH,
);

/** /admin/urunler  →  /yonetim-8f3a2c/urunler */
export function adminUrl(subPath = ""): string {
  const tail = subPath.replace(/^\/?(admin\/?)?/, "").replace(/^\/+/, "");
  return `/${ADMIN_PATH}${tail ? `/${tail}` : ""}`;
}

/** Gizli yol mu? */
export function isAdminPath(pathname: string): boolean {
  return pathname === `/${ADMIN_PATH}` || pathname.startsWith(`/${ADMIN_PATH}/`);
}

/** /yonetim-8f3a2c/urunler → /admin/urunler */
export function toInternalAdminPath(pathname: string): string {
  const rest = pathname.slice(`/${ADMIN_PATH}`.length);
  return `/admin${rest}`;
}
