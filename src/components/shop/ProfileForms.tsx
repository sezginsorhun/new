"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  updateProfileAction,
  type FormState,
} from "@/actions/account";

function Feedback({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <p
      role="status"
      className={`text-[13px] ${
        state.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
      }`}
    >
      {state.message}
    </p>
  );
}

export default function ProfileForms({
  firstName,
  lastName,
  email,
  phone,
  acceptsMarketing,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  acceptsMarketing: boolean;
}) {
  const [profileState, profileAction, profilePending] = useActionState<FormState, FormData>(
    updateProfileAction,
    null,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState<FormState, FormData>(
    changePasswordAction,
    null,
  );

  return (
    <div className="space-y-6">
      {/* Kişisel bilgiler */}
      <section className="card p-6">
        <h2 className="text-[18px]">Kişisel Bilgiler</h2>
        <form action={profileAction} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="p-first">Ad</label>
              <input id="p-first" name="firstName" defaultValue={firstName} required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="p-last">Soyad</label>
              <input id="p-last" name="lastName" defaultValue={lastName} required className="field" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="p-email">E-posta</label>
              <input id="p-email" value={email} disabled className="field bg-[color:var(--color-cream)]" />
              <p className="help">E-posta adresi değiştirilemez.</p>
            </div>
            <div>
              <label className="label" htmlFor="p-phone">Telefon</label>
              <input
                id="p-phone"
                name="phone"
                type="tel"
                defaultValue={phone}
                placeholder="05XXXXXXXXX"
                className="field"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[color:var(--color-ink-soft)]">
            <input
              type="checkbox"
              name="acceptsMarketing"
              defaultChecked={acceptsMarketing}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Kampanya e-postaları almak istiyorum.
          </label>

          <Feedback state={profileState} />

          <button type="submit" disabled={profilePending} className="btn-primary">
            {profilePending ? "Kaydediliyor..." : "Bilgileri Kaydet"}
          </button>
        </form>
      </section>

      {/* Şifre */}
      <section className="card p-6">
        <h2 className="text-[18px]">Şifre Değiştir</h2>
        <form action={passwordAction} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="cp-current">Mevcut şifren</label>
            <input
              id="cp-current"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="field sm:max-w-[320px]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cp-new">Yeni şifre</label>
              <input
                id="cp-new"
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="cp-repeat">Yeni şifre (tekrar)</label>
              <input
                id="cp-repeat"
                name="repeatPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="field"
              />
            </div>
          </div>

          <Feedback state={passwordState} />

          <button type="submit" disabled={passwordPending} className="btn-outline">
            {passwordPending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </section>
    </div>
  );
}
