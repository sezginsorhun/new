/**
 * İKİ ADIMLI DOĞRULAMA (2FA)
 *
 * Yönetici girişinde şifre tek başına yetmez: e-posta adresine 6 haneli
 * bir kod gider. Kod veritabanında düz metin DEĞİL, bcrypt özeti olarak
 * saklanır; 10 dakika geçerlidir, 5 yanlış denemede iptal olur ve tek
 * kullanımlıktır.
 *
 * Yedek kodlar: SMTP erişimi kaybolursa panele girebilmek için 8 adet
 * tek kullanımlık kod üretilir (kurulumda ekranda bir kez gösterilir).
 */

import "server-only";
import { randomInt, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { twoFactorCodes, userSecurity } from "@/db/schema";
import { sendTwoFactorCode } from "@/lib/mail";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
/** Aynı kullanıcıya en fazla bu sıklıkta yeni kod gönderilir (saniye) */
const RESEND_COOLDOWN = 45;

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type IssueResult =
  | { ok: true; cooldownSeconds: number; devCode?: string }
  | { ok: false; message: string; cooldownSeconds: number };

/** Yeni kod üretir, e-posta ile gönderir. */
export async function issueTwoFactorCode(user: {
  id: string;
  email: string;
  firstName: string;
}): Promise<IssueResult> {
  // Çok sık kod istenmesin
  const [last] = await db
    .select()
    .from(twoFactorCodes)
    .where(eq(twoFactorCodes.userId, user.id))
    .orderBy(desc(twoFactorCodes.createdAt))
    .limit(1);

  if (last) {
    const elapsed = (Date.now() - last.createdAt.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN && !last.usedAt) {
      return {
        ok: false,
        message: `Yeni kod istemek için ${Math.ceil(RESEND_COOLDOWN - elapsed)} saniye bekle.`,
        cooldownSeconds: Math.ceil(RESEND_COOLDOWN - elapsed),
      };
    }
  }

  // Önceki bekleyen kodları geçersiz kıl
  await db
    .update(twoFactorCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(twoFactorCodes.userId, user.id), isNull(twoFactorCodes.usedAt)));

  const code = generateCode();
  await db.insert(twoFactorCodes).values({
    userId: user.id,
    codeHash: await bcrypt.hash(code, 10),
    purpose: "login",
    expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
  });

  await sendTwoFactorCode({
    to: user.email,
    name: user.firstName,
    code,
    minutes: CODE_TTL_MINUTES,
  });

  // SMTP tanımlı değilse geliştirici kodu konsolda görsün diye döneriz.
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
  if (!smtpConfigured) {
    console.info(`[2FA] ${user.email} için doğrulama kodu: ${code}`);
  }
  return {
    ok: true,
    cooldownSeconds: RESEND_COOLDOWN,
    devCode: smtpConfigured ? undefined : code,
  };
}

export type VerifyResult = { ok: true } | { ok: false; message: string };

/** Girilen kodu doğrular. Doğruysa kodu kullanılmış işaretler. */
export async function verifyTwoFactorCode(
  userId: string,
  input: string,
): Promise<VerifyResult> {
  const clean = input.replace(/\D/g, "");
  if (clean.length !== 6) return { ok: false, message: "Kod 6 haneli olmalı." };

  const [row] = await db
    .select()
    .from(twoFactorCodes)
    .where(
      and(
        eq(twoFactorCodes.userId, userId),
        isNull(twoFactorCodes.usedAt),
        gt(twoFactorCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(twoFactorCodes.createdAt))
    .limit(1);

  if (!row) {
    return { ok: false, message: "Kodun süresi dolmuş. Yeni kod iste." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await db
      .update(twoFactorCodes)
      .set({ usedAt: new Date() })
      .where(eq(twoFactorCodes.id, row.id));
    return { ok: false, message: "Çok fazla hatalı deneme. Yeni kod iste." };
  }

  const match = await bcrypt.compare(clean, row.codeHash);
  if (!match) {
    await db
      .update(twoFactorCodes)
      .set({ attempts: sql`${twoFactorCodes.attempts} + 1` })
      .where(eq(twoFactorCodes.id, row.id));
    const left = MAX_ATTEMPTS - (row.attempts + 1);
    return {
      ok: false,
      message: left > 0 ? `Kod hatalı. ${left} deneme hakkın kaldı.` : "Çok fazla hatalı deneme. Yeni kod iste.",
    };
  }

  await db
    .update(twoFactorCodes)
    .set({ usedAt: new Date() })
    .where(eq(twoFactorCodes.id, row.id));
  return { ok: true };
}

/* ----------------------------- YEDEK KODLAR ----------------------------- */

/** 8 adet yedek kod üretir; düz hallerini SADECE bir kez döner. */
export async function generateBackupCodes(userId: string): Promise<string[]> {
  const plain = Array.from({ length: 8 }, () =>
    randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g)!.join("-"),
  );
  const hashes = await Promise.all(plain.map((code) => bcrypt.hash(code, 10)));
  await db
    .insert(userSecurity)
    .values({ userId, backupCodes: hashes, twoFactorEnabled: true })
    .onDuplicateKeyUpdate({
      set: { backupCodes: hashes, twoFactorEnabled: true, updatedAt: sql`now()` },
    });
  return plain;
}

/** Yedek kodu doğrular ve kullanıldıysa listeden çıkarır. */
export async function consumeBackupCode(userId: string, input: string): Promise<boolean> {
  const clean = input.trim().toUpperCase();
  if (clean.length < 8) return false;

  const [row] = await db
    .select()
    .from(userSecurity)
    .where(eq(userSecurity.userId, userId))
    .limit(1);
  const hashes = (row?.backupCodes as string[] | null) ?? [];
  if (!hashes.length) return false;

  for (const hash of hashes) {
    if (await bcrypt.compare(clean, hash)) {
      await db
        .update(userSecurity)
        .set({ backupCodes: hashes.filter((h) => h !== hash), updatedAt: sql`now()` })
        .where(eq(userSecurity.userId, userId));
      return true;
    }
  }
  return false;
}

/** Süresi geçmiş kodları temizler. */
export async function pruneExpiredCodes(): Promise<void> {
  await db
    .delete(twoFactorCodes)
    .where(sql`${twoFactorCodes.expiresAt} < now() - interval 1 day`);
}
