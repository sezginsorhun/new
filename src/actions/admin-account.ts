"use server";

/**
 * YÖNETİCİ HESAP AYARLARI
 *
 * Giriş e-posta adresini değiştirmek sıradan bir profil güncellemesi
 * DEĞİLDİR: bu adres hem kullanıcı adıdır hem de iki adımlı doğrulama
 * kodunun gittiği yerdir. Adresi ele geçiren biri hesabı ele geçirir.
 *
 * Bu yüzden burada üç koruma var:
 *   1) Sadece yönetici çağırabilir (requireAdmin).
 *   2) Mevcut şifre doğrulanır — açık bir oturumu olan biri bile
 *      şifreyi bilmeden adresi değiştiremez.
 *   3) İşlem denetim kaydına eski ve yeni adresle birlikte yazılır.
 *
 * Ayrıca eski adrese gönderilmiş bekleyen doğrulama kodları iptal edilir;
 * yoksa eski adrese giden bir kod yeni adresle giriş yapmaya yarardı.
 */

import { revalidatePath } from "next/cache";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessions, twoFactorCodes, users } from "@/db/schema";
import { hashPassword, requireAdmin, requirePermission, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ROLE_LABELS, ROLE_VALUES, type Role } from "@/lib/permissions";

export type AdminAccountState = { ok: boolean; message: string } | null;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "E-posta adresi çok kısa.")
  .max(255, "E-posta adresi çok uzun.")
  .email("Geçerli bir e-posta adresi yaz.");

export async function changeAdminEmailAction(
  _prev: AdminAccountState,
  formData: FormData,
): Promise<AdminAccountState> {
  const admin = await requireAdmin();
  if (!admin.passwordHash) {
    return { ok: false, message: "Bu hesapta şifre tanımlı değil." };
  }

  const parsed = emailSchema.safeParse(formData.get("email") ?? "");
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }
  const nextEmail = parsed.data;

  const password = String(formData.get("currentPassword") ?? "");
  if (!password) {
    return { ok: false, message: "Mevcut şifreni gir." };
  }
  if (!(await verifyPassword(password, admin.passwordHash))) {
    await logAudit({
      action: "auth.login_failed",
      userId: admin.id,
      actorEmail: admin.email,
      summary: "E-posta değiştirme denemesinde hatalı şifre",
    });
    return { ok: false, message: "Mevcut şifren hatalı." };
  }

  if (nextEmail === admin.email.toLowerCase()) {
    return { ok: false, message: "Bu adres zaten kayıtlı olan adres." };
  }

  // Başka bir hesap bu adresi kullanıyor mu?
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, nextEmail), ne(users.id, admin.id)))
    .limit(1);
  if (taken) {
    return { ok: false, message: "Bu e-posta adresi başka bir hesapta kayıtlı." };
  }

  const previousEmail = admin.email;

  await db.update(users).set({ email: nextEmail }).where(eq(users.id, admin.id));

  // Eski adrese gitmiş bekleyen kodlar artık geçersiz.
  await db
    .update(twoFactorCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(twoFactorCodes.userId, admin.id), isNull(twoFactorCodes.usedAt)));

  await logAudit({
    action: "auth.email_changed",
    userId: admin.id,
    actorEmail: nextEmail,
    entity: "user",
    entityId: admin.id,
    summary: `Giriş e-postası ${previousEmail} → ${nextEmail}`,
    meta: { from: previousEmail, to: nextEmail },
  });

  revalidatePath("/admin/guvenlik");
  return {
    ok: true,
    message: `E-posta adresin ${nextEmail} olarak güncellendi. Bundan sonra bu adresle giriş yapacaksın ve doğrulama kodları buraya gelecek.`,
  };
}

/* ======================= KULLANICI YÖNETİMİ ============================= *
 *
 * Buradaki her işlem yalnızca yönetici tarafından yapılabilir ve denetim
 * kaydına yazılır.
 *
 * İKİ KİLİTLENME KORUMASI vardır — ikisi de bilerek konmuştur:
 *   1) Yönetici kendi rolünü düşüremez ve kendi hesabını kapatamaz.
 *   2) Sistemdeki SON yönetici rolünden düşürülemez veya kapatılamaz.
 * Bu korumalar olmadan tek bir yanlış tıklama paneli herkese kapatabilir
 * ve geri dönüş yalnızca veritabanına elle müdahaleyle mümkün olurdu.
 */

const profileSchema = z.object({
  firstName: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(100),
  lastName: z.string().trim().min(2, "Soyad en az 2 karakter olmalı.").max(100),
  phone: z
    .string()
    .trim()
    .max(25, "Telefon çok uzun.")
    .regex(/^[0-9+()\s-]*$/, "Telefon yalnızca rakam ve + ( ) - içerebilir.")
    .optional()
    .or(z.literal("")),
});

/** Sistemde kaç aktif süper yönetici var? */
async function superAdminCount(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(users)
    .where(and(eq(users.role, "SUPER_ADMIN"), eq(users.isActive, true)));
  return Number(row?.n ?? 0);
}

/** Yöneticinin bir kullanıcının ad/soyad/telefon/e-posta bilgisini düzenlemesi. */
export async function updateUserAction(
  _prev: AdminAccountState,
  formData: FormData,
): Promise<AdminAccountState> {
  const admin = await requirePermission("users.manage");
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { ok: false, message: "Kullanıcı belirtilmedi." };

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { ok: false, message: "Kullanıcı bulunamadı." };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const emailParsed = emailSchema.safeParse(formData.get("email") ?? "");
  if (!emailParsed.success) return { ok: false, message: emailParsed.error.issues[0].message };
  const nextEmail = emailParsed.data;

  if (nextEmail !== target.email.toLowerCase()) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, nextEmail), ne(users.id, userId)))
      .limit(1);
    if (taken) return { ok: false, message: "Bu e-posta adresi başka bir hesapta kayıtlı." };
  }

  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
      email: nextEmail,
      updatedAt: sql`now()`,
    })
    .where(eq(users.id, userId));

  await logAudit({
    action: "customer.update",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "user",
    entityId: userId,
    summary:
      nextEmail !== target.email.toLowerCase()
        ? `${target.email} → ${nextEmail} (bilgiler güncellendi)`
        : `${target.email} bilgileri güncellendi`,
  });

  revalidatePath("/admin/kullanicilar");
  return { ok: true, message: "Kullanıcı bilgileri güncellendi." };
}

/** Rol değiştirme — kilitlenme korumalı. */
export async function setUserRoleAction(userId: string, role: Role) {
  const admin = await requirePermission("users.manage");

  if (!ROLE_VALUES.includes(role)) {
    return { ok: false, message: "Geçersiz rol." };
  }
  if (userId === admin.id) {
    return { ok: false, message: "Kendi rolünü değiştiremezsin." };
  }

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { ok: false, message: "Kullanıcı bulunamadı." };
  if (target.role === role) return { ok: true, message: "Rol zaten bu." };

  // Son süper yönetici düşürülemez: aksi hâlde kullanıcı ve rol yönetimine
  // erişebilen kimse kalmaz ve geri dönüş yalnızca veritabanına elle
  // müdahaleyle mümkün olur.
  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN" && (await superAdminCount()) <= 1) {
    return { ok: false, message: "Sistemdeki son süper yöneticiyi düşüremezsin." };
  }

  await db.update(users).set({ role, updatedAt: sql`now()` }).where(eq(users.id, userId));

  await logAudit({
    action: "customer.update",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "user",
    entityId: userId,
    summary: `${target.email} rolü ${target.role} → ${role}`,
  });

  revalidatePath("/admin/kullanicilar");
  return { ok: true, message: `Rol "${ROLE_LABELS[role]}" olarak değiştirildi.` };
}

/** Hesabı aç/kapat — kilitlenme korumalı. Kapatılan hesabın oturumları da düşer. */
export async function setUserActiveAction(userId: string, isActive: boolean) {
  const admin = await requirePermission("users.manage");

  if (userId === admin.id && !isActive) {
    return { ok: false, message: "Kendi hesabını kapatamazsın." };
  }

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { ok: false, message: "Kullanıcı bulunamadı." };

  if (target.role === "SUPER_ADMIN" && !isActive && (await superAdminCount()) <= 1) {
    return { ok: false, message: "Sistemdeki son süper yöneticinin hesabını kapatamazsın." };
  }

  await db.update(users).set({ isActive, updatedAt: sql`now()` }).where(eq(users.id, userId));

  // Kapatılan hesabın açık oturumları anında geçersiz olmalı; yoksa
  // kullanıcı çerezi duruyorken gezmeye devam eder.
  if (!isActive) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }

  await logAudit({
    action: "customer.update",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "user",
    entityId: userId,
    summary: `${target.email} hesabı ${isActive ? "açıldı" : "kapatıldı"}`,
  });

  revalidatePath("/admin/kullanicilar");
  return { ok: true, message: isActive ? "Hesap açıldı." : "Hesap kapatıldı." };
}

/** Yöneticinin bir kullanıcıya yeni şifre belirlemesi. */
export async function setUserPasswordAction(
  _prev: AdminAccountState,
  formData: FormData,
): Promise<AdminAccountState> {
  const admin = await requirePermission("users.manage");
  const userId = String(formData.get("userId") ?? "");
  const next = String(formData.get("newPassword") ?? "");

  if (next.length < 8) return { ok: false, message: "Yeni şifre en az 8 karakter olmalı." };

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { ok: false, message: "Kullanıcı bulunamadı." };

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next), updatedAt: sql`now()` })
    .where(eq(users.id, userId));

  // Şifre değiştiyse eski oturumlar kapanmalı (hesabın sahibi hariç kimse
  // eski çerezle devam edememeli).
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));

  await logAudit({
    action: "auth.password_changed",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "user",
    entityId: userId,
    summary: `${target.email} için yönetici tarafından şifre belirlendi`,
  });

  return { ok: true, message: "Şifre güncellendi ve o hesabın açık oturumları kapatıldı." };
}

/** Yöneticinin kendi ad/soyad/telefon bilgisini düzenlemesi. */
export async function updateOwnProfileAction(
  _prev: AdminAccountState,
  formData: FormData,
): Promise<AdminAccountState> {
  const admin = await requireAdmin();

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
      updatedAt: sql`now()`,
    })
    .where(eq(users.id, admin.id));

  revalidatePath("/admin/hesabim");
  return { ok: true, message: "Bilgilerin güncellendi." };
}
