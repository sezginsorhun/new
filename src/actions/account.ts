"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses, favorites, reviews, users } from "@/db/schema";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";

/* ------------------------------ FAVORİLER ------------------------------- */

export async function toggleFavoriteAction(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { requiresLogin: true as const, isFavorite: false };

  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.productId, productId)))
    .limit(1);

  if (existing[0]) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, user.id), eq(favorites.productId, productId)));
    revalidatePath("/hesabim/favoriler");
    return { requiresLogin: false as const, isFavorite: false };
  }

  await db.insert(favorites).values({ userId: user.id, productId });
  revalidatePath("/hesabim/favoriler");
  return { requiresLogin: false as const, isFavorite: true };
}

/* -------------------------------- ADRES --------------------------------- */

const addressSchema = z
  .object({
    title: z.string().trim().min(2, "Adres başlığı gir (örn. Ev)."),
    firstName: z.string().trim().min(2, "Ad gir."),
    lastName: z.string().trim().min(2, "Soyad gir."),
    phone: z
      .string()
      .trim()
      .regex(/^0?5\d{9}$/, "Telefonu 05XXXXXXXXX biçiminde gir."),
    city: z.string().trim().min(2, "İl seç."),
    district: z.string().trim().min(2, "İlçe gir."),
    line1: z.string().trim().min(10, "Açık adresi daha ayrıntılı yaz."),
    zipCode: z.string().trim().optional(),
    isCorporate: z.boolean().default(false),
    companyName: z.string().trim().optional(),
    taxOffice: z.string().trim().optional(),
    taxNumber: z.string().trim().optional(),
    isDefault: z.boolean().default(false),
  })
  .refine(
    (data) =>
      !data.isCorporate || (data.companyName && data.taxOffice && data.taxNumber),
    { message: "Kurumsal fatura için firma adı, vergi dairesi ve vergi no zorunlu." },
  );

export type FormState = { ok: boolean; message: string } | null;

function readAddressForm(formData: FormData) {
  return {
    title: formData.get("title"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    district: formData.get("district"),
    line1: formData.get("line1"),
    zipCode: formData.get("zipCode") || undefined,
    isCorporate: formData.get("isCorporate") === "on",
    companyName: formData.get("companyName") || undefined,
    taxOffice: formData.get("taxOffice") || undefined,
    taxNumber: formData.get("taxNumber") || undefined,
    isDefault: formData.get("isDefault") === "on",
  };
}

export async function saveAddressAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Önce giriş yapmalısın." };

  const parsed = addressSchema.safeParse(readAddressForm(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const id = formData.get("id") as string | null;
  const values = {
    ...parsed.data,
    zipCode: parsed.data.zipCode ?? null,
    companyName: parsed.data.companyName ?? null,
    taxOffice: parsed.data.taxOffice ?? null,
    taxNumber: parsed.data.taxNumber ?? null,
    userId: user.id,
  };

  if (parsed.data.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  }

  if (id) {
    await db
      .update(addresses)
      .set(values)
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  } else {
    await db.insert(addresses).values(values);
  }

  revalidatePath("/hesabim/adresler");
  revalidatePath("/odeme");
  return { ok: true, message: "Adres kaydedildi." };
}

export async function deleteAddressAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Yetkisiz." };
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  revalidatePath("/hesabim/adresler");
  return { ok: true };
}

/* ------------------------------ PROFİL ---------------------------------- */

const profileSchema = z.object({
  firstName: z.string().trim().min(2, "Ad gir."),
  lastName: z.string().trim().min(2, "Soyad gir."),
  phone: z
    .string()
    .trim()
    .regex(/^0?5\d{9}$/, "Telefonu 05XXXXXXXXX biçiminde gir.")
    .optional()
    .or(z.literal("")),
  acceptsMarketing: z.boolean().default(false),
});

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Önce giriş yapmalısın." };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") ?? "",
    acceptsMarketing: formData.get("acceptsMarketing") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
      acceptsMarketing: parsed.data.acceptsMarketing,
    })
    .where(eq(users.id, user.id));

  revalidatePath("/hesabim");
  return { ok: true, message: "Bilgilerin güncellendi." };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || !user.passwordHash) return { ok: false, message: "Önce giriş yapmalısın." };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const repeat = String(formData.get("repeatPassword") ?? "");

  if (!(await verifyPassword(current, user.passwordHash))) {
    return { ok: false, message: "Mevcut şifren hatalı." };
  }
  if (next.length < 8) return { ok: false, message: "Yeni şifre en az 8 karakter olmalı." };
  if (next !== repeat) return { ok: false, message: "Yeni şifreler eşleşmiyor." };

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next) })
    .where(eq(users.id, user.id));

  return { ok: true, message: "Şifren güncellendi." };
}

/* ------------------------------ YORUM ----------------------------------- */

export async function submitReviewAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Yorum yazmak için giriş yapmalısın." };

  const productId = String(formData.get("productId") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!productId) return { ok: false, message: "Ürün bulunamadı." };
  if (rating < 1 || rating > 5) return { ok: false, message: "Puan ver (1-5)." };
  if (comment.length < 10) return { ok: false, message: "Yorumun en az 10 karakter olmalı." };

  try {
    await db
      .insert(reviews)
      .values({
        productId,
        userId: user.id,
        rating,
        title: (formData.get("title") as string) || null,
        comment,
      })
      .onConflictDoUpdate({
        target: [reviews.productId, reviews.userId],
        set: { rating, comment, isApproved: false },
      });
  } catch {
    return { ok: false, message: "Yorum kaydedilemedi." };
  }

  return {
    ok: true,
    message: "Yorumun alındı. Onaylandıktan sonra yayınlanacak.",
  };
}
