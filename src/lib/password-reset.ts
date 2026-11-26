/**
 * ŞİFRE SIFIRLAMA JETONU
 *
 * Veritabanında ayrı bir tablo tutmadan, imzalı ve kısa ömürlü bir jeton:
 *   - AUTH_SECRET ile HS256 imzalı → dışarıdan üretilemez
 *   - 30 dakika geçerli
 *   - İçinde kullanıcının o anki şifre hash'inin parmak izi var → şifre bir
 *     kez değişince (bu bağlantıyla ya da başka yoldan) eski bağlantılar
 *     kendiliğinden geçersiz olur; aynı bağlantı ikinci kez kullanılamaz.
 */

import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { sha256 } from "@/lib/auth";

const PURPOSE = "password-reset";
const LIFETIME = "30m";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET tanımlı değil.");
  return new TextEncoder().encode(secret);
}

function fingerprint(passwordHash: string | null): string {
  return sha256(`reset:${passwordHash ?? "none"}`).slice(0, 32);
}

export async function createResetToken(user: { id: string; passwordHash: string | null }) {
  return new SignJWT({ purpose: PURPOSE, fp: fingerprint(user.passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(LIFETIME)
    .sign(secretKey());
}

/** Jeton geçerliyse kullanıcı kimliğini, değilse null döner. */
export async function readResetToken(token: string): Promise<{ userId: string; fp: string } | null> {
  if (!token || token.length > 1000) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== PURPOSE || typeof payload.sub !== "string" || typeof payload.fp !== "string") {
      return null;
    }
    return { userId: payload.sub, fp: payload.fp };
  } catch {
    return null;
  }
}

export function resetTokenMatches(fp: string, passwordHash: string | null): boolean {
  return fp === fingerprint(passwordHash);
}
