/**
 * OTURUM VE KİMLİK DOĞRULAMA
 *
 * Katmanlar:
 *  1) Şifre        — bcrypt, 12 tur. Düz metin asla saklanmaz.
 *  2) Çerez        — httpOnly + secure + sameSite=lax, imzalı JWT taşır.
 *  3) Veritabanı   — her oturumun bir satırı vardır. Çerez geçerli olsa bile
 *                    satır iptal edilmişse oturum geçersizdir. Böylece
 *                    "tüm cihazlardan çıkış" anında etki eder.
 *  4) 2FA          — ADMIN oturumları, e-posta ile gelen 6 haneli kod
 *                    doğrulanmadan panele erişemez.
 *
 * Çerezde taşınan JWT sadece bir "bilet"tir; yetki kararı her zaman
 * veritabanındaki güncel kayda göre verilir.
 */

import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions, trustedDevices, userSecurity } from "@/db/schema";
import { getRequestInfo } from "@/lib/request-info";
import { createId } from "@/lib/id";

export const SESSION_COOKIE = "session";
export const PENDING_COOKIE = "pending_2fa";
export const TRUST_COOKIE = "trusted_device";
export const CSRF_COOKIE = "csrf";

/** Müşteri oturumu 30 gün, admin oturumu 8 saat yaşar. */
const CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30;
const ADMIN_MAX_AGE = 60 * 60 * 8;
const PENDING_MAX_AGE = 60 * 10; // 2FA ekranında geçirilebilecek süre
const TRUST_MAX_AGE = 60 * 60 * 24 * 30;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET eksik ya da 32 karakterden kısa. `openssl rand -base64 48` ile üret ve .env'e yaz.",
    );
  }
  return new TextEncoder().encode(secret);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** İki metni, uzunluk bilgisi sızdırmadan sabit sürede karşılaştırır. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(sha256(a), "hex");
  const bufB = Buffer.from(sha256(b), "hex");
  return timingSafeEqual(bufA, bufB);
}

export type SessionPayload = {
  sid: string;
  userId: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  name: string;
};

/* ================================ ŞİFRE ================================= */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Şifre gücü kontrolü. Çok yaygın ve tahmin edilebilir şifreler reddedilir.
 */
const WEAK_PASSWORDS = new Set([
  "12345678", "123456789", "1234567890", "password", "sifre123", "qwerty123",
  "11111111", "alenora123", "admin123", "parola123", "123123123", "passw0rd",
]);

export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < 10) return "Şifre en az 10 karakter olmalı.";
  if (password.length > 200) return "Şifre çok uzun.";
  if (!/[a-zçğıöşü]/i.test(password)) return "Şifre en az bir harf içermeli.";
  if (!/\d/.test(password)) return "Şifre en az bir rakam içermeli.";
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return "Bu şifre çok yaygın kullanılıyor, başka bir şifre seç.";
  }
  if (email) {
    const local = email.split("@")[0]?.toLowerCase() ?? "";
    if (local.length > 2 && password.toLowerCase().includes(local)) {
      return "Şifre e-posta adresini içeremez.";
    }
  }
  return null;
}

/* =============================== OTURUM ================================= */

/**
 * Yeni oturum açar: veritabanına satır yazar, imzalı bileti çereze koyar.
 * `twoFactorVerified` false ise admin panele giremez (sadece 2FA ekranı).
 */
export async function createSession(
  user: { id: string; email: string; role: "CUSTOMER" | "ADMIN"; firstName: string; lastName: string },
  options?: { twoFactorVerified?: boolean },
): Promise<void> {
  const { ip, userAgent } = await getRequestInfo();
  const maxAge = user.role === "ADMIN" ? ADMIN_MAX_AGE : CUSTOMER_MAX_AGE;
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  // MySQL'de INSERT ... RETURNING yok; kimliği önce biz üretip yazıyoruz.
  const sessionId = createId();
  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    tokenHash: sha256(rawToken),
    userAgent,
    ip,
    expiresAt,
    twoFactorAt: options?.twoFactorVerified ? new Date() : null,
  });

  const payload: SessionPayload = {
    sid: sessionId,
    userId: user.id,
    email: user.email,
    role: user.role,
    name: `${user.firstName} ${user.lastName}`.trim(),
  };

  const token = await new SignJWT({ ...payload, t: rawToken })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  store.delete(PENDING_COOKIE);
}

/** Çerezdeki bileti çözer. Veritabanına bakmaz — hızlı ön kontrol içindir. */
export async function readSessionCookie(): Promise<(SessionPayload & { t: string }) | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sid || !payload.userId) return null;
    return {
      sid: String(payload.sid),
      userId: String(payload.userId),
      email: String(payload.email ?? ""),
      role: payload.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
      name: String(payload.name ?? ""),
      t: String(payload.t ?? ""),
    };
  } catch {
    return null;
  }
}

export type ActiveSession = {
  user: typeof users.$inferSelect;
  session: typeof sessions.$inferSelect;
};

/**
 * Geçerli oturumu veritabanından doğrular.
 * Çerez geçerli olsa bile satır iptal/süresi dolmuşsa null döner.
 */
export async function getActiveSession(): Promise<ActiveSession | null> {
  const cookieData = await readSessionCookie();
  if (!cookieData) return null;

  const [row] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, cookieData.sid),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;
  // Bilet gerçekten bu satıra mı ait? (JWT taklit edilemese de çift kontrol)
  if (!cookieData.t || row.tokenHash !== sha256(cookieData.t)) return null;

  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  if (!user || !user.isActive) return null;

  // Son görülme zamanını en fazla 5 dakikada bir güncelle (yazma yükü olmasın)
  if (Date.now() - row.lastSeenAt.getTime() > 5 * 60_000) {
    await db
      .update(sessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(sessions.id, row.id));
  }

  return { user, session: row };
}

export async function getSession(): Promise<SessionPayload | null> {
  const active = await getActiveSession();
  if (!active) return null;
  return {
    sid: active.session.id,
    userId: active.user.id,
    email: active.user.email,
    role: active.user.role,
    name: `${active.user.firstName} ${active.user.lastName}`.trim(),
  };
}

export async function getCurrentUser() {
  const active = await getActiveSession();
  return active?.user ?? null;
}

/** Oturumu kapatır (satırı iptal eder, çerezi siler). */
export async function destroySession(): Promise<void> {
  const cookieData = await readSessionCookie();
  if (cookieData?.sid) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, cookieData.sid));
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(PENDING_COOKIE);
  store.delete(CSRF_COOKIE);
}

/** Bir kullanıcının tüm oturumlarını kapatır. */
export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  const conditions = [eq(sessions.userId, userId), isNull(sessions.revokedAt)];
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      exceptSessionId
        ? and(...conditions, sql`${sessions.id} <> ${exceptSessionId}`)
        : and(...conditions),
    );
}

export async function revokeSession(sessionId: string, userId: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
}

export async function listUserSessions(userId: string) {
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .orderBy(desc(sessions.lastSeenAt))
    .limit(30);
}

/* =========================== 2FA BEKLEME BİLETİ ========================== */

/** Şifre doğru ama kod henüz girilmedi: kısa ömürlü ara bilet. */
export async function createPendingToken(userId: string): Promise<void> {
  const token = await new SignJWT({ userId, purpose: "2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_MAX_AGE}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_MAX_AGE,
  });
}

export async function readPendingUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(PENDING_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== "2fa") return null;
    return String(payload.userId);
  } catch {
    return null;
  }
}

export async function clearPendingToken(): Promise<void> {
  const store = await cookies();
  store.delete(PENDING_COOKIE);
}

/* =========================== GÜVENİLİR CİHAZ ============================ */

export async function markDeviceTrusted(userId: string, label: string): Promise<void> {
  const raw = randomBytes(32).toString("hex");
  await db.insert(trustedDevices).values({
    userId,
    tokenHash: sha256(raw),
    label: label.slice(0, 160),
    expiresAt: new Date(Date.now() + TRUST_MAX_AGE * 1000),
  });
  const store = await cookies();
  store.set(TRUST_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRUST_MAX_AGE,
  });
}

export async function isDeviceTrusted(userId: string): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(TRUST_COOKIE)?.value;
  if (!raw) return false;
  const [row] = await db
    .select({ id: trustedDevices.id })
    .from(trustedDevices)
    .where(
      and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.tokenHash, sha256(raw)),
        gt(trustedDevices.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function forgetTrustedDevices(userId: string): Promise<void> {
  await db.delete(trustedDevices).where(eq(trustedDevices.userId, userId));
  const store = await cookies();
  store.delete(TRUST_COOKIE);
}

/* ================================ YETKİ ================================= */

export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FORBIDDEN" | "NEEDS_2FA") {
    super(code);
  }
}

/** Sadece giriş yapmış kullanıcılar. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHORIZED");
  return user;
}

/**
 * Sadece 2FA'dan geçmiş adminler.
 * Her yönetim sayfası ve her yönetim aksiyonu bunu çağırır — tek kontrol
 * noktası proxy değildir.
 */
export async function requireAdmin() {
  const active = await getActiveSession();
  if (!active) throw new AuthError("UNAUTHORIZED");
  if (active.user.role !== "ADMIN") throw new AuthError("FORBIDDEN");
  if (!active.session.twoFactorAt) throw new AuthError("NEEDS_2FA");
  return active.user;
}

/** Admin oturumu mu, 2FA bekliyor mu — durumu birlikte döner. */
export async function adminSessionState() {
  const active = await getActiveSession();
  if (!active) return { state: "anonymous" as const };
  if (active.user.role !== "ADMIN") return { state: "not-admin" as const, user: active.user };
  if (!active.session.twoFactorAt) return { state: "needs-2fa" as const, user: active.user };
  return { state: "ok" as const, user: active.user, session: active.session };
}

/** Bir kullanıcının güvenlik satırını (yoksa oluşturarak) getirir. */
export async function getUserSecurity(userId: string) {
  const [row] = await db
    .select()
    .from(userSecurity)
    .where(eq(userSecurity.userId, userId))
    .limit(1);
  if (row) return row;

  // Satır yoksa oluştur, sonra geri oku (MySQL'de RETURNING yok).
  await db.insert(userSecurity).values({ userId }).onDuplicateKeyUpdate({
    set: { userId },
  });
  const [created] = await db
    .select()
    .from(userSecurity)
    .where(eq(userSecurity.userId, userId))
    .limit(1);
  return created ?? { userId, failedCount: 0, lockedUntil: null, twoFactorEnabled: false };
}
