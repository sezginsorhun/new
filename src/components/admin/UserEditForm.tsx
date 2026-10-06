"use client";

/**
 * KULLANICI DÜZENLEME
 *
 * Üç ayrı işlem, üç ayrı form: bilgiler, rol/durum, şifre. Hepsini tek
 * forma koymak "sadece telefonu düzeltecektim, şifreyi de sıfırlamışım"
 * gibi kazalara yol açar.
 */

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setUserActiveAction,
  setUserPasswordAction,
  setUserRoleAction,
  updateUserAction,
  type AdminAccountState,
} from "@/actions/admin-account";

export type EditableUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "ADMIN" | "CUSTOMER";
  isActive: boolean;
};

function Notice({ state }: { state: AdminAccountState }) {
  if (!state) return null;
  return (
    <p
      className={`text-[12.5px] ${
        state.ok ? "text-[color:var(--color-ok)]" : "text-[color:var(--color-accent)]"
      }`}
    >
      {state.message}
    </p>
  );
}

export default function UserEditForm({
  user,
  isSelf,
}: {
  user: EditableUser;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [profileState, profileAction, profilePending] = useActionState<AdminAccountState, FormData>(
    updateUserAction,
    null,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState<AdminAccountState, FormData>(
    setUserPasswordAction,
    null,
  );
  const [rolePending, startRole] = useTransition();
  const [roleMessage, setRoleMessage] = useState<AdminAccountState>(null);

  function runRole(fn: () => Promise<{ ok: boolean; message: string }>) {
    startRole(async () => {
      const result = await fn();
      setRoleMessage(result);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Bilgiler */}
      <form action={profileAction} className="card space-y-3 p-4">
        <h2 className="text-[14px] font-medium">Kişi bilgileri</h2>
        <input type="hidden" name="userId" value={user.id} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="u-first">Ad</label>
            <input id="u-first" name="firstName" defaultValue={user.firstName} required className="field" />
          </div>
          <div>
            <label className="label" htmlFor="u-last">Soyad</label>
            <input id="u-last" name="lastName" defaultValue={user.lastName} required className="field" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="u-email">E-posta</label>
          <input id="u-email" name="email" type="email" defaultValue={user.email} required className="field" />
          <p className="help">Bu adres hem kullanıcı adıdır hem de bildirimlerin gittiği yerdir.</p>
        </div>

        <div>
          <label className="label" htmlFor="u-phone">Telefon</label>
          <input id="u-phone" name="phone" defaultValue={user.phone ?? ""} className="field" placeholder="05XX XXX XX XX" />
        </div>

        <Notice state={profileState} />
        <button type="submit" disabled={profilePending} className="btn-primary">
          {profilePending ? "Kaydediliyor..." : "Bilgileri kaydet"}
        </button>
      </form>

      <div className="space-y-5">
        {/* Rol ve durum */}
        <div className="card space-y-3 p-4">
          <h2 className="text-[14px] font-medium">Yetki ve durum</h2>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-[color:var(--color-muted)]">Rol:</span>
            <span className={user.role === "ADMIN" ? "badge badge-ok" : "badge"}>
              {user.role === "ADMIN" ? "Yönetici" : "Müşteri"}
            </span>
            <button
              type="button"
              disabled={rolePending || (isSelf && user.role === "ADMIN")}
              onClick={() =>
                runRole(() => setUserRoleAction(user.id, user.role === "ADMIN" ? "CUSTOMER" : "ADMIN"))
              }
              className="btn-ghost text-[12.5px]"
            >
              {user.role === "ADMIN" ? "Müşteriye çevir" : "Yönetici yap"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-[color:var(--color-muted)]">Durum:</span>
            <span className={user.isActive ? "badge badge-ok" : "badge"}>
              {user.isActive ? "Aktif" : "Kapalı"}
            </span>
            <button
              type="button"
              disabled={rolePending || (isSelf && user.isActive)}
              onClick={() => runRole(() => setUserActiveAction(user.id, !user.isActive))}
              className="btn-ghost text-[12.5px]"
            >
              {user.isActive ? "Hesabı kapat" : "Hesabı aç"}
            </button>
          </div>

          {isSelf && (
            <p className="help">
              Bu senin hesabın. Kendi yetkini kaldıramaz ve kendi hesabını kapatamazsın —
              paneli kendine kapatmanı önleyen bir koruma.
            </p>
          )}

          <Notice state={roleMessage} />
        </div>

        {/* Şifre */}
        <form action={passwordAction} className="card space-y-3 p-4">
          <h2 className="text-[14px] font-medium">Şifre belirle</h2>
          <input type="hidden" name="userId" value={user.id} />
          <div>
            <label className="label" htmlFor="u-pass">Yeni şifre</label>
            <input
              id="u-pass"
              name="newPassword"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="field"
            />
            <p className="help">
              En az 8 karakter. Kaydedilince bu hesabın tüm açık oturumları kapanır.
            </p>
          </div>
          <Notice state={passwordState} />
          <button type="submit" disabled={passwordPending} className="btn-ghost">
            {passwordPending ? "Kaydediliyor..." : "Şifreyi değiştir"}
          </button>
        </form>
      </div>
    </div>
  );
}
