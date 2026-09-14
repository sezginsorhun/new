"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";

export type AuthState = { ok: boolean; message: string } | null;

/* ------------------------------- KAYIT ---------------------------------- */

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Adını gir."),
    lastName: z.string().trim().min(2, "Soyadını gir."),
    email: z.string().trim().toLowerCase().email("Geçerli bir e-posta gir."),
    phone: z
      .string()
      .trim()
      .regex(/^0?5\d{9}$/, "Telefonu 05XXXXXXXXX biçiminde gir.")
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
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

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing[0]) {
    return { ok: false, message: "Bu e-posta ile kayıtlı bir hesap var. Giriş yapmayı dene." };
  }

  const [created] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
      acceptsMarketing: parsed.data.acceptsMarketing,
    })
    .returning();

  await createSession({
    userId: created.id,
    email: created.email,
    role: created.role,
    name: `${created.firstName} ${created.lastName}`,
  });

  // Misafirken doldurulmuş sepeti hesaba bağla
  await getOrCreateCart();

  const next = String(formData.get("next") ?? "/hesabim");
  redirect(next.startsWith("/") ? next : "/hesabim");
}

/* ------------------------------- GİRİŞ ---------------------------------- */

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta gir."),
  password: z.string().min(1, "Şifreni gir."),
});

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  const user = rows[0];

  // Kullanıcı yok ya da şifre yanlış — aynı mesajı ver (bilgi sızdırmamak için)
  if (!user || !user.passwordHash) {
    return { ok: false, message: "E-posta veya şifre hatalı." };
  }
  if (!user.isActive) {
    return { ok: false, message: "Bu hesap devre dışı. Bizimle iletişime geç." };
  }
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, message: "E-posta veya şifre hatalı." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: `${user.firstName} ${user.lastName}`,
  });

  await getOrCreateCart();

  const requested = String(formData.get("next") ?? "");
  const fallback = user.role === "ADMIN" ? "/admin" : "/hesabim";
  redirect(requested.startsWith("/") ? requested : fallback);
}

/* ------------------------------- ÇIKIŞ ---------------------------------- */

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
