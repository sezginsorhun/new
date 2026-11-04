"use client";

/**
 * YÖNETİCİ KENDİ PROFİLİ
 *
 * Ad/soyad/telefon serbestçe düzenlenir. E-posta ve şifre ayrı
 * formlardadır ve mevcut şifreyle onaylanır — bunlar hesabın
 * anahtarlarıdır, yanlışlıkla değişmemeleri gerekir.
 */

import { useActionState } from "react";
import { updateOwnProfileAction, type AdminAccountState } from "@/actions/admin-account";

export default function AdminProfileForm({
  firstName,
  lastName,
  phone,
}: {
  firstName: string;
  lastName: string;
  phone: string | null;
}) {
  const [state, action, pending] = useActionState<AdminAccountState, FormData>(
    updateOwnProfileAction,
    null,
  );

  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="text-[14px] font-medium">Kişi bilgilerin</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="ap-first">Ad</label>
          <input id="ap-first" name="firstName" defaultValue={firstName} required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="ap-last">Soyad</label>
          <input id="ap-last" name="lastName" defaultValue={lastName} required className="field" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="ap-phone">Telefon</label>
        <input
          id="ap-phone"
          name="phone"
          defaultValue={phone ?? ""}
          className="field"
          placeholder="05XX XXX XX XX"
        />
      </div>

      {state && (
        <p className={`text-[12.5px] ${state.ok ? "text-[color:var(--color-ok)]" : "text-[color:var(--color-accent)]"}`}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
