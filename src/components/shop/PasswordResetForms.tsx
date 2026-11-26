"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  resetPasswordAction,
  type AuthState,
} from "@/actions/auth";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordResetAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="card space-y-4 p-6 text-center">
        <p role="status" className="text-[14px] leading-relaxed">{state.message}</p>
        <Link href="/giris" className="btn-outline">Girişe dön</Link>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="reset-email">E-posta</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={255}
          className="field"
        />
      </div>
      {state && !state.ok && <p role="alert" className="error-text">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPasswordAction, null);

  if (state?.ok) {
    return (
      <div className="card space-y-4 p-6 text-center">
        <p role="status" className="text-[14px] leading-relaxed">{state.message}</p>
        <Link href="/giris" className="btn-primary inline-flex">Giriş yap</Link>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="new-password">Yeni şifre</label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={200}
          className="field"
        />
        <p className="mt-1.5 text-[12px] text-[color:var(--color-muted)]">
          En az 10 karakter; harf ve rakam içersin.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="repeat-password">Yeni şifre (tekrar)</label>
        <input
          id="repeat-password"
          name="repeatPassword"
          type="password"
          autoComplete="new-password"
          required
          maxLength={200}
          className="field"
        />
      </div>
      {state && !state.ok && <p role="alert" className="error-text">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Kaydediliyor..." : "Şifremi güncelle"}
      </button>
    </form>
  );
}
