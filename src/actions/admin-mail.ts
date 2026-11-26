"use server";

/**
 * E-POSTA GÖNDERİMİ (SMTP) AYARLARI
 *
 * Yalnızca "users.manage" yetkisi (süper yönetici). Gerekçe: SMTP'yi
 * değiştirebilen biri, diğer yöneticilerin giriş kodlarını kendi
 * sunucusundan geçirip okuyabilirdi — bu, rol yükseltme demektir.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { getSettings, setSettings } from "@/lib/settings";
import { sealSecret, openSecret } from "@/lib/secret-box";
import { sendTestMail, type MailConfig } from "@/lib/mail";
import { logAudit } from "@/lib/audit";
import { checkGenericLimit } from "@/lib/rate-limit";
import { getRequestInfo } from "@/lib/request-info";

export type MailState = { ok: boolean; message: string } | null;

const schema = z.object({
  host: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/, "Sunucu adı geçersiz."),
  port: z.coerce
    .number()
    .refine((port) => [25, 465, 587, 2525].includes(port), "Port 465 veya 587 olmalı."),
  user: z.string().trim().toLowerCase().email("Kullanıcı adı bir e-posta adresi olmalı.").max(255),
  from: z.string().trim().max(200).optional(),
  password: z.string().max(200).optional(),
});

function parse(formData: FormData) {
  return schema.safeParse({
    host: formData.get("smtp_host"),
    port: formData.get("smtp_port"),
    user: formData.get("smtp_user"),
    from: formData.get("mail_from") || undefined,
    password: formData.get("smtp_pass") || undefined,
  });
}

export async function saveMailSettingsAction(_prev: MailState, formData: FormData): Promise<MailState> {
  await assertSameOrigin();
  const admin = await requirePermission("users.manage");
  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const entries: Record<string, string> = {
    smtp_host: parsed.data.host,
    smtp_port: String(parsed.data.port),
    smtp_user: parsed.data.user,
    mail_from: parsed.data.from ?? "",
  };
  // Şifre alanı boş bırakılırsa kayıtlı şifre korunur.
  if (parsed.data.password) entries.smtp_pass_enc = sealSecret(parsed.data.password);
  await setSettings(entries);

  await logAudit({
    action: "settings.update",
    userId: admin.id,
    actorEmail: admin.email,
    summary: `E-posta gönderim ayarı güncellendi (${parsed.data.host}, ${parsed.data.user}${parsed.data.password ? ", şifre değişti" : ""})`,
  });
  revalidatePath("/admin/ayarlar");
  return { ok: true, message: "E-posta ayarları kaydedildi. Şimdi deneme e-postası gönder." };
}

export async function sendTestMailAction(_prev: MailState, formData: FormData): Promise<MailState> {
  await assertSameOrigin();
  const admin = await requirePermission("users.manage");
  const { ip } = await getRequestInfo();
  const limit = await checkGenericLimit("mail-test", ip);
  if (!limit.allowed) return { ok: false, message: limit.message ?? "Çok fazla deneme." };

  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  // Formdaki şifre boşsa kayıtlı şifreyle dener (kaydetmeden test edilebilsin).
  const settings = await getSettings();
  const pass = parsed.data.password || openSecret(settings.smtp_pass_enc);
  if (!pass) return { ok: false, message: "E-posta şifresini gir." };

  const config: MailConfig = {
    host: parsed.data.host,
    port: parsed.data.port,
    user: parsed.data.user,
    pass,
    from: parsed.data.from || `${settings.site_name} <${parsed.data.user}>`,
    source: "panel",
  };
  const result = await sendTestMail(admin.email, config);
  return result.ok
    ? { ok: true, message: `Deneme e-postası ${admin.email} adresine gönderildi. Gelen kutunu (ve gereksiz klasörünü) kontrol et.` }
    : { ok: false, message: `Gönderilemedi: ${result.error}` };
}
