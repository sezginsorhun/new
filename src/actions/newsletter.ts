"use server";

import { z } from "zod";
import { db } from "@/db";
import { newsletterSubscribers, contactMessages } from "@/db/schema";

const emailSchema = z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi gir.");

export type ActionState = { ok: boolean; message: string } | null;

export async function subscribeNewsletter(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  try {
    await db
      .insert(newsletterSubscribers)
      .values({ email: parsed.data })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { isActive: true },
      });
    return { ok: true, message: "Kaydın alındı, teşekkürler!" };
  } catch {
    return { ok: false, message: "Bir sorun oluştu, lütfen tekrar dene." };
  }
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Adını yaz."),
  email: emailSchema,
  phone: z.string().trim().max(25).optional(),
  subject: z.string().trim().min(3, "Konu yaz."),
  message: z.string().trim().min(10, "Mesajın en az 10 karakter olmalı."),
});

export async function sendContactMessage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  await db.insert(contactMessages).values({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  return { ok: true, message: "Mesajın bize ulaştı. En kısa sürede döneceğiz." };
}
