"use client";

import { useActionState, useState } from "react";
import {
  verifyTwoFactorAction,
  resendTwoFactorAction,
  type AuthState,
} from "@/actions/auth";

export default function TwoFactorForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    verifyTwoFactorAction,
    null,
  );
  const [resendState, resendAction, resending] = useActionState<AuthState, FormData>(
    resendTwoFactorAction,
    null,
  );
  const [useBackup, setUseBackup] = useState(false);

  return (
    <div className="space-y-4">
      <form action={action} className="card space-y-4 p-6">
        <input type="hidden" name="mode" value={useBackup ? "backup" : "code"} />

        <div>
          <label className="label" htmlFor="tf-code">
            {useBackup ? "Yedek kod" : "Doğrulama kodu"}
          </label>
          <input
            id="tf-code"
            name="code"
            autoComplete="one-time-code"
            inputMode={useBackup ? "text" : "numeric"}
            maxLength={useBackup ? 24 : 6}
            required
            autoFocus
            placeholder={useBackup ? "XXXXX-XXXXX" : "000000"}
            className="field text-center text-[22px] tracking-[.4em]"
          />
        </div>

        <label className="flex items-center gap-2.5 text-[13px]">
          <input type="checkbox" name="trustDevice" className="h-4 w-4 accent-[color:var(--color-brand)]" />
          Bu cihazı 30 gün hatırla
        </label>

        {state && !state.ok && <p role="alert" className="error-text">{state.message}</p>}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Doğrulanıyor..." : "Doğrula ve Panele Gir"}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
        <form action={resendAction}>
          <button
            type="submit"
            disabled={resending}
            className="underline underline-offset-2 text-[color:var(--color-ink-soft)]"
          >
            {resending ? "Gönderiliyor..." : "Kodu tekrar gönder"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setUseBackup((v) => !v)}
          className="underline underline-offset-2 text-[color:var(--color-ink-soft)]"
        >
          {useBackup ? "Doğrulama kodunu kullan" : "Yedek kod kullan"}
        </button>
      </div>

      {resendState && (
        <p
          role="status"
          className={resendState.ok ? "text-[12.5px] text-[color:var(--color-ok)]" : "error-text"}
        >
          {resendState.message}
        </p>
      )}

      <p className="text-center text-[12px] text-[color:var(--color-muted)]">
        E-posta gelmediyse spam klasörünü kontrol et. SMTP ayarlanmadıysa kod
        sunucu konsoluna yazılır.
      </p>
    </div>
  );
}
