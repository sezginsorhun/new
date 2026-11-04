/**
 * GÜVENLİK YARDIMCILARI
 *  - CSRF jetonu (çift gönderim yöntemi)
 *  - İstek kaynağı (Origin) kontrolü
 *  - Yönlendirme adresi temizleme (open redirect koruması)
 *  - Metin temizleme (XSS'e karşı)
 */

import "server-only";
import { cookies, headers } from "next/headers";
import { CSRF_COOKIE, safeEqual } from "@/lib/auth";

/* --------------------------------- CSRF --------------------------------- */

/**
 * Çift gönderim (double submit) yöntemi:
 * Aynı rastgele değer hem httpOnly olmayan bir çerezde hem de formun gizli
 * alanında bulunur. Başka bir site formu gönderdiğinde çerezi okuyup
 * forma yazamaz; böylece istek reddedilir.
 *
 * Not: Next.js Server Action'ları zaten Origin/Host eşleşmesini kendisi
 * kontrol eder. Bu katman, API route'ları ve ekstra güvence içindir.
 */
/**
 * Jetonun kendisi proxy.ts içinde üretilip çereze yazılır (sayfa çiziminde
 * çerez yazılamaz). Burada sadece okunur; Server Action'lara gömmek için.
 */
export async function getCsrfToken(): Promise<string> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value ?? "";
}

export async function verifyCsrfToken(submitted: string | null | undefined): Promise<boolean> {
  if (!submitted) return false;
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;
  return safeEqual(cookieToken, submitted);
}

/* ------------------------------- ORIGIN --------------------------------- */

/** İsteğin gerçekten bu siteden geldiğini doğrular. */
export async function isSameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");
  if (!origin) return true; // tarayıcı dışı/aynı site GET istekleri
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function assertSameOrigin(): Promise<void> {
  if (!(await isSameOrigin())) {
    throw new Error("İstek kaynağı doğrulanamadı.");
  }
}

/* ---------------------------- YÖNLENDİRME ------------------------------- */

/**
 * Kullanıcıdan gelen `next` parametresi ile açık yönlendirme yapılmasını
 * engeller: sadece bu sitenin içindeki yollara izin verilir.
 */
export function safeRedirectPath(value: unknown, fallback: string): string {
  const path = typeof value === "string" ? value.trim() : "";
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback; // //evil.com
  if (/[\r\n]/.test(path)) return fallback;
  return path;
}

/* -------------------------------- METİN --------------------------------- */

/** HTML'e basılacak kullanıcı metnini zararsız hale getirir. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Yönetici panelinden girilen basit zengin metni temizler.
 * Sadece güvenli etiketler kalır; script, iframe, on* olayları ve
 * javascript: adresleri silinir.
 */
const ALLOWED_TAGS =
  /^(p|br|strong|b|em|i|u|ul|ol|li|h2|h3|h4|blockquote|a|hr|span|table|thead|tbody|tr|th|td)$/i;

export function sanitizeRichText(html: string): string {
  let out = html
    .replace(/<\s*(script|style|iframe|object|embed|form|input|link|meta)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "");

  // İzin verilmeyen etiketleri sök (içeriği kalsın)
  out = out.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tag: string) =>
    ALLOWED_TAGS.test(tag) ? match : "",
  );
  return out;
}

/** Dış bağlantıya izin verilen protokoller. */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed.startsWith("//") ? null : trimmed;
  try {
    const url = new URL(trimmed);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
