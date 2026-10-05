"use server";

import { adminUrl } from "@/lib/admin-path";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { createId } from "@/lib/id";
import { users } from "@/db/schema";
import {
  createSession,
  createPendingToken,
  clearPendingToken,
  destroySession,
  hashPassword,
  verifyPassword,
  passwordProblem,
  readPendingUserId,
  isDeviceTrusted,
  markDeviceTrusted,
  revokeAllSessions,
  revokeSession,
  getActiveSession,
} from "@/lib/auth";
import {
  checkLoginAllowed,
  recordAttempt,
  registerFailure,
  registerSuccess,
  DUMMY_HASH,
} from "@/lib/rate-limit";
import { issueTwoFactorCode, verifyTwoFactorCode, consumeBackupCode } from "@/lib/two-factor";
import { getRequestInfo, describeDevice } from "@/lib/request-info";
import { logAudit } from "@/lib/audit";
import { safeRedirectPath, assertSameOrigin } from "@/lib/security";
import { getOrCreateCart } from "@/lib/cart";
import { sendNewLoginNotice } from "@/lib/mail";

export type AuthState = { ok: boolean; message: string; needsTwoFactor?: boolean } | null;

/** Kullanıcıya hiçbir zaman "bu e-posta kayıtlı değil" denmez. */
const GENERIC_LOGIN_ERROR = "E-posta veya şifre hatalı.";

/* ================================= KAYIT ================================= */

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Adını gir.").max(100),
    lastName: z.string().trim().min(2, "Soyadını gir.").max(100),
    email: z.string().trim().toLowerCase().email("Geçerli bir e-posta gir.").max(255),
    phone: z
      .string()
      .trim()
      .regex(/^0?5\d{9}$/, "Telefonu 05XXXXXXXXX biçiminde gir.")
      .optional()
      .or(z.literal("")),
    password: z.string().min(1, "Şifre belirle.").max(200),
    repeatPassword: z.string(),
    acceptsTerms: z.literal(true, { message: "Üyelik koşullarını onaylamalısın." }),
    acceptsMarketing: z.boolean().default(false),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["repeatPassword"],
  });

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await assertSameOrigin();

  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    repeatPassword: formData.get("repeatPassword"),
    acceptsTerms: formData.get("acceptsTerms") === "on",
    acceptsMarketing: formData.get("acceptsMarketing") === "on",
  });

  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const weak = passwordProblem(parsed.data.password, parsed.data.email);
  if (weak) return { ok: false, message: weak };

  const { ip } = await getRequestInfo();
  const limit = await checkLoginAllowed({ email: parsed.data.email, ip });
  if (!limit.allowed) return { ok: false, message: limit.message ?? "Çok fazla deneme." };

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing[0]) {
    await recordAttempt({ email: parsed.data.email, ip, success: false });
    return {
      ok: false,
      message: "Bu e-posta ile kayıtlı bir hesap var. Giriş yapmayı dene.",
    };
  }

  // MySQL'de RETURNING yok: kimliği önce üretip sonra geri okuyoruz.
  const newUserId = createId();
  await db
    .insert(users)
    .values({
      id: newUserId,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
      acceptsMarketing: parsed.data.acceptsMarketing,
      // Rol asla formdan alınmaz — yeni kayıtlar her zaman müşteridir.
      role: "CUSTOMER",
    });

  const [created] = await db.select().from(users).where(eq(users.id, newUserId)).limit(1);

  await recordAttempt({ email: parsed.data.email, ip, success: true });
  await registerSuccess(created.id, ip);
  await createSession(created, { twoFactorVerified: true });
  await getOrCreateCart();
  await logAudit({
    action: "auth.login",
    userId: created.id,
    actorEmail: created.email,
    summary: "Yeni hesap oluşturuldu",
  });

  redirect(safeRedirectPath(formData.get("next"), "/hesabim"));
}

/* ================================= GİRİŞ ================================= */

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta gir.").max(255),
  password: z.string().min(1, "Şifreni gir.").max(200),
});

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await assertSameOrigin();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const { ip, userAgent } = await getRequestInfo();
  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Hız sınırı: hesap kilidi ve IP/e-posta sayaçları
  const limit = await checkLoginAllowed({ email, ip, userId: user?.id });
  if (!limit.allowed) {
    await logAudit({
      action: "auth.locked",
      userId: user?.id,
      actorEmail: email,
      summary: limit.reason === "locked" ? "Hesap kilitli" : "Hız sınırı aşıldı",
    });
    return { ok: false, message: limit.message ?? "Çok fazla deneme yapıldı." };
  }

  // Kullanıcı yoksa bile şifre doğrulama maliyeti kadar beklenir:
  // böylece "bu e-posta kayıtlı mı" bilgisi yanıt süresinden anlaşılmaz.
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const passwordOk = await bcrypt.compare(password, hash);

  if (!user || !user.passwordHash || !passwordOk) {
    await recordAttempt({ email, ip, userAgent, success: false });
    if (user) await registerFailure(user.id);
    await logAudit({
      action: "auth.login_failed",
      userId: user?.id,
      actorEmail: email,
      summary: "Hatalı şifre",
    });
    return { ok: false, message: GENERIC_LOGIN_ERROR };
  }

  if (!user.isActive) {
    await recordAttempt({ email, ip, userAgent, success: false });
    return { ok: false, message: "Bu hesap devre dışı. Bizimle iletişime geç." };
  }

  await recordAttempt({ email, ip, userAgent, success: true });
  await registerSuccess(user.id, ip);

  /* --- ADMIN: ikinci adım zorunlu ------------------------------------- */
  if (user.role === "ADMIN") {
    const trusted = await isDeviceTrusted(user.id);
    if (!trusted) {
      await createPendingToken(user.id);
      const issued = await issueTwoFactorCode(user);
      await logAudit({
        action: "auth.2fa_sent",
        userId: user.id,
        actorEmail: user.email,
        summary: "Giriş için doğrulama kodu gönderildi",
      });
      if (!issued.ok) {
        // Kod gönderilemese bile ekrana geçilir; kullanıcı "tekrar gönder" der.
        redirect("/dogrulama");
      }
      redirect("/dogrulama");
    }
    await createSession(user, { twoFactorVerified: true });
    await logAudit({
      action: "auth.login",
      userId: user.id,
      actorEmail: user.email,
      summary: "Güvenilir cihazdan yönetici girişi",
    });
    redirect(adminUrl());
  }

  /* --- MÜŞTERİ --------------------------------------------------------- */
  await createSession(user, { twoFactorVerified: true });
  await getOrCreateCart();
  await logAudit({
    action: "auth.login",
    userId: user.id,
    actorEmail: user.email,
    summary: "Müşteri girişi",
  });

  void sendNewLoginNotice({
    to: user.email,
    name: user.firstName,
    device: describeDevice(userAgent),
    ip,
    at: new Date(),
  }).catch(() => {});

  redirect(safeRedirectPath(formData.get("next"), "/hesabim"));
}

/* ============================ 2FA DOĞRULAMA ============================== */

export async function verifyTwoFactorAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await assertSameOrigin();

  const userId = await readPendingUserId();
  if (!userId) {
    return { ok: false, message: "Doğrulama süresi doldu. Baştan giriş yap." };
  }

  const { ip, userAgent } = await getRequestInfo();
  const limit = await checkLoginAllowed({ ip, userId });
  if (!limit.allowed) return { ok: false, message: limit.message ?? "Çok fazla deneme." };

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isActive || user.role !== "ADMIN") {
    await clearPendingToken();
    return { ok: false, message: "Doğrulama yapılamadı. Baştan giriş yap." };
  }

  const code = String(formData.get("code") ?? "").trim();
  const useBackup = String(formData.get("mode") ?? "") === "backup";

  const result = useBackup
    ? (await consumeBackupCode(userId, code))
      ? ({ ok: true } as const)
      : ({ ok: false, message: "Yedek kod geçersiz ya da daha önce kullanılmış." } as const)
    : await verifyTwoFactorCode(userId, code);

  if (!result.ok) {
    await recordAttempt({ email: user.email, ip, userAgent, success: false });
    await registerFailure(userId);
    await logAudit({
      action: "auth.2fa_failed",
      userId,
      actorEmail: user.email,
      summary: result.message,
    });
    return { ok: false, message: result.message };
  }

  await registerSuccess(userId, ip);
  await clearPendingToken();

  if (formData.get("trustDevice") === "on") {
    await markDeviceTrusted(userId, describeDevice(userAgent));
  }

  await createSession(user, { twoFactorVerified: true });
  await logAudit({
    action: "auth.2fa_ok",
    userId,
    actorEmail: user.email,
    summary: `Yönetici girişi — ${describeDevice(userAgent)}`,
  });

  void sendNewLoginNotice({
    to: user.email,
    name: user.firstName,
    device: describeDevice(userAgent),
    ip,
    at: new Date(),
  }).catch(() => {});

  redirect(adminUrl());
}

/** Doğrulama ekranındaki "kodu tekrar gönder" düğmesi */
export async function resendTwoFactorAction(
  _prev: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  await assertSameOrigin();
  const userId = await readPendingUserId();
  if (!userId) return { ok: false, message: "Doğrulama süresi doldu. Baştan giriş yap." };

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { ok: false, message: "Doğrulama yapılamadı." };

  const issued = await issueTwoFactorCode(user);
  if (!issued.ok) return { ok: false, message: issued.message };
  return { ok: true, message: "Yeni kod e-posta adresine gönderildi." };
}

/* ================================= ÇIKIŞ ================================= */

export async function logoutAction() {
  const active = await getActiveSession();
  if (active) {
    await logAudit({
      action: "auth.logout",
      userId: active.user.id,
      actorEmail: active.user.email,
    });
  }
  await destroySession();
  redirect("/");
}

/** Hesap ayarlarından tek bir oturumu kapat */
export async function revokeSessionAction(formData: FormData) {
  await assertSameOrigin();
  const active = await getActiveSession();
  if (!active) return;
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;
  await revokeSession(sessionId, active.user.id);
  await logAudit({
    action: "auth.session_revoked",
    userId: active.user.id,
    actorEmail: active.user.email,
    entityId: sessionId,
  });
}

/** Tüm cihazlardan çıkış (bu cihaz hariç) */
export async function revokeAllSessionsAction() {
  await assertSameOrigin();
  const active = await getActiveSession();
  if (!active) return;
  await revokeAllSessions(active.user.id, active.session.id);
  await logAudit({
    action: "auth.session_revoked",
    userId: active.user.id,
    actorEmail: active.user.email,
    summary: "Diğer tüm oturumlar kapatıldı",
  });
}

/* ============================ ŞİFRE DEĞİŞTİR ============================= */

export async function changePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await assertSameOrigin();
  const active = await getActiveSession();
  if (!active) return { ok: false, message: "Önce giriş yap." };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const repeat = String(formData.get("repeatPassword") ?? "");

  if (next !== repeat) return { ok: false, message: "Yeni şifreler eşleşmiyor." };
  const weak = passwordProblem(next, active.user.email);
  if (weak) return { ok: false, message: weak };

  if (!active.user.passwordHash || !(await verifyPassword(current, active.user.passwordHash))) {
    const { ip, userAgent } = await getRequestInfo();
    await recordAttempt({ email: active.user.email, ip, userAgent, success: false });
    return { ok: false, message: "Mevcut şifren hatalı." };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next), updatedAt: new Date() })
    .where(eq(users.id, active.user.id));

  // Şifre değişti: diğer tüm oturumlar kapatılır.
  await revokeAllSessions(active.user.id, active.session.id);
  await logAudit({
    action: "auth.password_changed",
    userId: active.user.id,
    actorEmail: active.user.email,
    summary: "Şifre değiştirildi, diğer oturumlar kapatıldı",
  });

  return { ok: true, message: "Şifren güncellendi. Diğer cihazlardaki oturumlar kapatıldı." };
}
