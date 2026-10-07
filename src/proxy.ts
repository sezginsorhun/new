/**
 * PROXY (Next.js 16'da eski adıyla "middleware")
 *
 * Üç iş yapar:
 *  1) GİZLİ YÖNETİM YOLU — /yonetim-xxxx isteklerini içeride /admin'e çevirir.
 *     Doğrudan /admin isteğine 404 döner, yani panelin varlığı dışarıdan
 *     anlaşılmaz.
 *  2) HIZLI ÖN KONTROL — oturum çerezi yoksa korunan sayfalara hiç girilmez.
 *     (Asıl yetki kararı her sayfada requireAdmin()/requireUser() ile
 *     veritabanından verilir. Güvenlik buraya BIRAKILMAZ.)
 *  3) CSRF JETONU — panel açılırken çereze yazılır.
 *
 * Güvenlik başlıkları (CSP, HSTS, çerçeveleme, izin politikaları) burada
 * DEĞİL, next.config.ts içinde tanımlıdır: orası her isteğe uygulanır ve
 * geliştirme sunucusunun canlı yenileme bağlantısını bozmaz.
 */

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_PATH, isAdminPath, toInternalAdminPath } from "@/lib/admin-path";
import { clientIpFromHeaders, isAllowedAdminIp } from "@/lib/ip-allowlist";
import { canEnterPanel } from "@/lib/permissions";

const PROTECTED_CUSTOMER = ["/hesabim"];

async function readToken(token: string | undefined) {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return payload as { userId?: string; role?: string; sid?: string };
  } catch {
    return null;
  }
}

/**
 * CSRF jetonu.
 * Panel sayfaları açılırken yoksa üretilir. httpOnly DEĞİLDİR: panel içindeki
 * JavaScript bunu okuyup isteklere ekler. Başka bir sitedeki sayfa bu çerezi
 * okuyamaz, bu yüzden sahte istek üretemez.
 */
function ensureCsrfCookie(request: NextRequest, response: NextResponse): NextResponse {
  if (request.cookies.get("csrf")?.value) return response;
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  response.cookies.set("csrf", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

/** Panel sayfaları hiçbir yerde önbelleğe alınmaz, aranmaz. */
function adminNoStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

/** Sitenin normal 404 ekranını 404 durumuyla gösterir. */
function notFound(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/sayfa-bulunamadi";
  return NextResponse.rewrite(url, { status: 404 });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* 1) Panelin gerçek yolu dışarıya kapalı -------------------------------- */
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Dışarıdan /admin denemesi: panel yokmuş gibi davran.
    // Sitenin normal "sayfa bulunamadı" ekranı gösterilir, böylece panelin
    // var olup olmadığı yanıttan anlaşılamaz.
    return notFound(request);
  }

  /* 2) Gizli yol → içeride /admin ---------------------------------------- */
  if (isAdminPath(pathname)) {
    /*
     * IP kısıtı — kimlik kontrolünden ÖNCE.
     * İzinli olmayan bir adresten gelen istek, doğru şifreyi bilse bile
     * giriş ekranını hiç görmez: panel yokmuş gibi 404 alır. Böylece
     * gizli adres sızsa bile dışarıdan deneme yapılamaz.
     * Liste boşsa bu blok hiçbir şey yapmaz (bkz. lib/ip-allowlist.ts).
     */
    const ip = clientIpFromHeaders((name) => request.headers.get(name));
    if (!isAllowedAdminIp(ip, process.env.ADMIN_IP_ALLOWLIST)) {
      return notFound(request);
    }

    const session = await readToken(request.cookies.get("session")?.value);

    if (!session?.userId) {
      const loginUrl = new URL("/giris", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!canEnterPanel(session.role)) {
      // Panelde yapacak işi olmayan (müşteri) bir kullanıcıya panel yokmuş
      // gibi görünür. Hangi SAYFAYA girebileceği burada DEĞİL, sayfanın
      // kendi requirePermission() çağrısında belirlenir — proxy yalnızca
      // "bu kişinin panelde hiç işi var mı" sorusunu yanıtlar.
      return notFound(request);
    }

    const url = request.nextUrl.clone();
    url.pathname = toInternalAdminPath(pathname);
    return ensureCsrfCookie(request, adminNoStore(NextResponse.rewrite(url)));
  }

  /* 3) Müşteri hesabı ----------------------------------------------------- */
  if (PROTECTED_CUSTOMER.some((p) => pathname.startsWith(p))) {
    const session = await readToken(request.cookies.get("session")?.value);
    if (!session?.userId) {
      const loginUrl = new URL("/giris", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  /*
   * 4) İSTENEN YOLU İLERİ TAŞI
   * Next.js'te layout bileşenleri hangi sayfanın istendiğini göremez.
   * 18+ perdesi, yasal metinler ve giriş ekranı gibi muaf yollarda
   * görünmemeli — bu yüzden yolu bir başlık olarak isteğe ekliyoruz ve
   * AgeGate bunu sunucuda okuyor.
   */
  const forwarded = new Headers(request.headers);
  forwarded.set("x-yol", pathname);
  return NextResponse.next({ request: { headers: forwarded } });
}

export const config = {
  /**
   * Yalnızca korunan yollar buradan geçer. Güvenlik başlıkları (CSP, HSTS vb.)
   * tüm site için next.config.ts içinde tanımlıdır — böylece geliştirme
   * sunucusunun canlı yenileme bağlantısı etkilenmez.
   */
  // Gizli yönetim adresi .env'den geldiği için burada sabit yazılamaz;
  // bu yüzden statik dosyalar dışındaki her istek buradan geçer ve
  // korunmayan yollar hemen devam ettirilir.
  matcher: [
    "/((?!_next|api/gorsel|api/saglik|favicon.ico|uploads|robots.txt|sitemap.xml).*)",
  ],
};

export { ADMIN_PATH };
