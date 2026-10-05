/**
 * HIZ SINIRI (RATE LIMIT) ve HESAP KİLİDİ
 *
 * Kaba kuvvet saldırısına karşı iki ayrı kalkan:
 *   1) IP başına   — aynı bilgisayardan art arda deneme
 *   2) Hesap başına — farklı IP'lerden aynı hesabı deneme
 *
 * Sayaçlar veritabanında tutulur; böylece sunucu yeniden başlasa ya da
 * birden fazla sunucu çalışsa bile sınır geçerliliğini korur.
 */

import "server-only";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts, userSecurity } from "@/db/schema";

/* ------------------------------ AYARLAR -------------------------------- */

export const LIMITS = {
  /** IP başına 15 dakikada en fazla başarısız deneme */
  ipWindowMinutes: 15,
  ipMaxFails: 20,

  /** E-posta başına 15 dakikada en fazla başarısız deneme */
  emailWindowMinutes: 15,
  emailMaxFails: 8,

  /** Ardışık hatalı denemede hesabın kilitleneceği eşik */
  lockAfterFails: 5,
  /** Kilit süresi (dakika) — her 5 hatada katlanarak artar, en fazla 60 dk */
  lockMinutes: 5,
  lockMaxMinutes: 60,

  /** Genel amaçlı eylem sınırı (iletişim formu, bülten, kupon denemesi) */
  genericWindowMinutes: 10,
  genericMax: 15,
} as const;

export type LimitResult = {
  allowed: boolean;
  /** Kaç saniye sonra tekrar denenebilir */
  retryAfterSeconds: number;
  reason?: "ip" | "email" | "locked" | "generic";
  message?: string;
};

const OK: LimitResult = { allowed: true, retryAfterSeconds: 0 };

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

async function countFails(identifier: string, windowMinutes: number): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier),
        eq(loginAttempts.success, false),
        gte(loginAttempts.createdAt, minutesAgo(windowMinutes)),
      ),
    );
  return rows[0]?.n ?? 0;
}

/** Her giriş denemesini (başarılı/başarısız) kaydeder. */
export async function recordAttempt(params: {
  email?: string;
  ip: string;
  userAgent?: string;
  success: boolean;
}): Promise<void> {
  const rows: (typeof loginAttempts.$inferInsert)[] = [
    {
      identifier: `ip:${params.ip}`,
      success: params.success,
      ip: params.ip,
      userAgent: params.userAgent?.slice(0, 400) ?? null,
    },
  ];
  if (params.email) {
    rows.push({
      identifier: `email:${params.email.toLowerCase()}`,
      success: params.success,
      ip: params.ip,
      userAgent: params.userAgent?.slice(0, 400) ?? null,
    });
  }
  await db.insert(loginAttempts).values(rows);
}

/**
 * Giriş denemesine izin var mı?
 * Hem IP hem e-posta sayaçlarına ve hesabın kilit durumuna bakar.
 */
export async function checkLoginAllowed(params: {
  email?: string;
  ip: string;
  userId?: string;
}): Promise<LimitResult> {
  // 1) Hesap kilitli mi?
  if (params.userId) {
    const [sec] = await db
      .select()
      .from(userSecurity)
      .where(eq(userSecurity.userId, params.userId))
      .limit(1);
    if (sec?.lockedUntil && sec.lockedUntil.getTime() > Date.now()) {
      const seconds = Math.ceil((sec.lockedUntil.getTime() - Date.now()) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: seconds,
        reason: "locked",
        message: `Çok fazla hatalı deneme yapıldı. Hesap ${formatWait(seconds)} sonra tekrar denenebilir.`,
      };
    }
  }

  // 2) IP sayacı
  const ipFails = await countFails(`ip:${params.ip}`, LIMITS.ipWindowMinutes);
  if (ipFails >= LIMITS.ipMaxFails) {
    const seconds = LIMITS.ipWindowMinutes * 60;
    return {
      allowed: false,
      retryAfterSeconds: seconds,
      reason: "ip",
      message: `Bu bağlantıdan çok fazla deneme yapıldı. ${formatWait(seconds)} sonra tekrar dene.`,
    };
  }

  // 3) E-posta sayacı
  if (params.email) {
    const emailFails = await countFails(
      `email:${params.email.toLowerCase()}`,
      LIMITS.emailWindowMinutes,
    );
    if (emailFails >= LIMITS.emailMaxFails) {
      const seconds = LIMITS.emailWindowMinutes * 60;
      return {
        allowed: false,
        retryAfterSeconds: seconds,
        reason: "email",
        message: `Bu hesap için çok fazla deneme yapıldı. ${formatWait(seconds)} sonra tekrar dene.`,
      };
    }
  }

  return OK;
}

/** Hatalı giriş sonrası sayacı artırır, eşiği aşarsa hesabı geçici kilitler. */
export async function registerFailure(userId: string): Promise<void> {
  // MySQL'de RETURNING yok: önce artır, sonra güncel değeri oku.
  await db
    .insert(userSecurity)
    .values({ userId, failedCount: 1 })
    .onDuplicateKeyUpdate({
      set: {
        failedCount: sql`${userSecurity.failedCount} + 1`,
        updatedAt: sql`now()`,
      },
    });

  const [sec] = await db
    .select()
    .from(userSecurity)
    .where(eq(userSecurity.userId, userId))
    .limit(1);

  if (sec && sec.failedCount >= LIMITS.lockAfterFails) {
    // Her kilit turunda süre katlanır: 5, 10, 20, 40, en fazla 60 dakika
    const round = Math.floor(sec.failedCount / LIMITS.lockAfterFails);
    const minutes = Math.min(
      LIMITS.lockMinutes * Math.pow(2, round - 1),
      LIMITS.lockMaxMinutes,
    );
    await db
      .update(userSecurity)
      .set({ lockedUntil: new Date(Date.now() + minutes * 60_000), updatedAt: sql`now()` })
      .where(eq(userSecurity.userId, userId));
  }
}

/** Başarılı girişte sayaç ve kilit sıfırlanır. */
export async function registerSuccess(userId: string, ip: string): Promise<void> {
  await db
    .insert(userSecurity)
    .values({ userId, failedCount: 0, lastLoginAt: new Date(), lastLoginIp: ip })
    .onDuplicateKeyUpdate({
      set: {
        failedCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        updatedAt: sql`now()`,
      },
    });
}

/**
 * Giriş dışı eylemler için genel sınır (iletişim formu, bülten, kupon denemesi).
 * `key` eylemi ayırt eder: "contact", "coupon" gibi.
 */
export async function checkGenericLimit(key: string, ip: string): Promise<LimitResult> {
  const identifier = `${key}:${ip}`.slice(0, 120);
  const used = await countFails(identifier, LIMITS.genericWindowMinutes);
  if (used >= LIMITS.genericMax) {
    const seconds = LIMITS.genericWindowMinutes * 60;
    return {
      allowed: false,
      retryAfterSeconds: seconds,
      reason: "generic",
      message: `Çok fazla istek gönderdin. ${formatWait(seconds)} sonra tekrar dene.`,
    };
  }
  await db.insert(loginAttempts).values({ identifier, success: false, ip });
  return OK;
}

/** 30 günden eski deneme kayıtlarını siler (zaman zaman çağrılır). */
export async function pruneOldAttempts(): Promise<void> {
  await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, minutesAgo(60 * 24 * 30)));
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} saniye`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} dakika`;
}

/**
 * Zamanlama saldırılarına karşı: yanıt süresini sabitlemek için
 * kullanıcı bulunamasa bile şifre doğrulama maliyeti kadar beklenir.
 */
export const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.e6cEGQ5fVr6N6Pz6pUqXqA7Z3bYQ9Hy";
