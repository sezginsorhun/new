/**
 * GİZLİ DEĞER KUTUSU — veritabanına yazılan sırlar için (ör. SMTP şifresi)
 *
 * AES-256-GCM. Anahtar AUTH_SECRET'tan türetilir; veritabanı tek başına
 * ele geçse bile şifre okunamaz. AUTH_SECRET değişirse kayıtlı değer
 * çözülemez ve panelden yeniden girilmesi gerekir.
 */

import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET tanımlı değil.");
  return createHash("sha256").update(`secret-box:v1:${secret}`).digest();
}

export function sealSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${data.toString("base64url")}`;
}

export function openSecret(sealed: string | null | undefined): string | null {
  if (!sealed || !sealed.startsWith("v1.")) return null;
  try {
    const [, iv, tag, data] = sealed.split(".");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
