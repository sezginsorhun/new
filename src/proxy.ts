/**
 * PROXY (Next.js 16'da eski adıyla "middleware")
 *
 * Sadece hızlı bir ön kontrol yapar: oturum çerezi var mı ve rolü uygun mu?
 * Gerçek yetki kontrolü her sayfada requireUser() / requireAdmin() ile
 * veritabanı üzerinden tekrar yapılır — güvenlik buraya bırakılmaz.
 */

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_CUSTOMER = ["/hesabim"];
const PROTECTED_ADMIN = ["/admin"];

async function readSession(token: string | undefined) {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return payload as { userId?: string; role?: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsCustomer = PROTECTED_CUSTOMER.some((path) => pathname.startsWith(path));
  const needsAdmin = PROTECTED_ADMIN.some((path) => pathname.startsWith(path));

  if (!needsCustomer && !needsAdmin) return NextResponse.next();

  const session = await readSession(request.cookies.get("session")?.value);

  if (!session?.userId) {
    const loginUrl = new URL("/giris", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (needsAdmin && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hesabim/:path*", "/admin/:path*"],
};
