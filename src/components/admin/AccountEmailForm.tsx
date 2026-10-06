"use client";

/**
 * GİRİŞ E-POSTASINI DEĞİŞTİR
 *
 * Adres hem kullanıcı adı hem de doğrulama kodunun gittiği yer olduğu
 * için değişiklik mevcut şifreyle onaylanır.
 */

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { changeAdminEmailAction, type AdminAccountState } from "@/actions/admin-account";

export default function AccountEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, pending] = useActionState<AdminAccountState, FormData>(
    changeAdminEmailAction,
    null,
  );

  return (
    <form action={action} className="card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Mail size={17} strokeWidth={1.5} className="text-[color:var(--color-muted)]" />
        <h2 className="text-[14px] font-medium">Giriş e-postası</h2>
      </div>

      <p className="text-[12.5px] text-[color:var(--color-muted)]">
        Şu anki adres: <strong>{currentEmail}</strong>. Bu adresle giriş yapıyorsun ve
        iki adımlı doğrulama kodu buraya gönderiliyor.
      </p>

      <div>
        <label className="label" htmlFor="ae-email">
          Yeni e-posta adresi
        </label>
        <input
          id="ae-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ornek@alanadin.com"
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="ae-pass">
          Mevcut şifren
        </label>
        <input
          id="ae-pass"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="field"
        />
        <p className="help">Güvenlik için adres değişikliği şifreyle onaylanır.</p>
      </div>

      {state && (
        <p className={`text-[12.5px] ${state.ok ? "text-[color:var(--color-ok)]" : "text-[color:var(--color-accent)]"}`}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Kaydediliyor..." : "E-postayı değiştir"}
      </button>
    </form>
  );
}
