"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthState } from "@/actions/auth";

export default function RegisterForm({ next = "" }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, null);

  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="next" value={next} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reg-first">Ad *</label>
          <input id="reg-first" name="firstName" required autoComplete="given-name" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="reg-last">Soyad *</label>
          <input id="reg-last" name="lastName" required autoComplete="family-name" className="field" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="reg-email">E-posta *</label>
        <input id="reg-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="reg-phone">Telefon</label>
        <input
          id="reg-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="05XXXXXXXXX"
          className="field"
        />
        <p className="help">Kargo bilgilendirmesi için kullanılır.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reg-pass">Şifre *</label>
          <input
            id="reg-pass"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field"
          />
          <p className="help">En az 8 karakter.</p>
        </div>
        <div>
          <label className="label" htmlFor="reg-pass2">Şifre (tekrar) *</label>
          <input
            id="reg-pass2"
            name="repeatPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] text-[color:var(--color-ink-soft)]">
        <input type="checkbox" name="acceptsTerms" required className="mt-0.5 h-4 w-4 accent-[color:var(--color-brand)]" />
        <span>
          <Link href="/sayfa/gizlilik-politikasi" className="underline" target="_blank">
            Gizlilik politikası
          </Link>{" "}
          ve{" "}
          <Link href="/sayfa/mesafeli-satis-sozlesmesi" className="underline" target="_blank">
            üyelik koşullarını
          </Link>{" "}
          okudum, onaylıyorum. *
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] text-[color:var(--color-ink-soft)]">
        <input type="checkbox" name="acceptsMarketing" className="mt-0.5 h-4 w-4 accent-[color:var(--color-brand)]" />
        <span>Kampanya ve indirimlerden e-posta ile haberdar olmak istiyorum.</span>
      </label>

      {state && !state.ok && (
        <p role="alert" className="error-text">{state.message}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
      </button>
    </form>
  );
}
