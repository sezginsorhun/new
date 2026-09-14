"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginAction, type AuthState } from "@/actions/auth";

export default function LoginForm({ next = "" }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="next" value={next} />

      <div>
        <label className="label" htmlFor="login-email">E-posta</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="login-password">Şifre</label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="field pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-[color:var(--color-muted)]"
          >
            {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {state && !state.ok && (
        <p role="alert" className="error-text">{state.message}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>

      <p className="pt-1 text-center text-[12px] text-[color:var(--color-muted)]">
        Örnek hesap: musteri@ornek.com / Test123!
      </p>
    </form>
  );
}
