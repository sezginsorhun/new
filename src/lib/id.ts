import { randomBytes } from "crypto";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/** Kısa, URL güvenli, çakışma riski çok düşük ID üretir. */
export function createId(length = 24): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Misafir sepeti / oturum token'ı */
export function createToken(): string {
  return randomBytes(24).toString("hex");
}
