"use client";

import { useActionState } from "react";
import { saveMailSettingsAction, sendTestMailAction, type MailState } from "@/actions/admin-mail";

export default function MailSettingsForm({
  host,
  port,
  user,
  from,
  hasPassword,
  envOverride,
  suggestedUser,
}: {
  host: string;
  port: string;
  user: string;
  from: string;
  hasPassword: boolean;
  envOverride: boolean;
  suggestedUser: string;
}) {
  const [saveState, save, saving] = useActionState<MailState, FormData>(saveMailSettingsAction, null);
  const [testState, test, testing] = useActionState<MailState, FormData>(sendTestMailAction, null);
  const state = testState ?? saveState;

  return (
    <form action={save} className="card space-y-4 p-5">
      <div>
        <h2 className="text-[15px] font-semibold">E-posta Gönderimi (SMTP)</h2>
        <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
          Yönetici giriş kodları, sipariş onayları, kargo bildirimleri ve şifre sıfırlama bağlantıları
          bu hesaptan gönderilir. Hostinger e-postası için sunucu <code>smtp.hostinger.com</code>, port{" "}
          <code>465</code>; kullanıcı adı e-posta adresin, şifre o e-posta hesabının şifresidir
          (hPanel → E-postalar). Şifre veritabanında şifrelenmiş saklanır ve burada bir daha gösterilmez.
        </p>
        {envOverride && (
          <p className="mt-2 rounded-md bg-[color:var(--color-surface-2)] p-2.5 text-[12.5px]">
            Sunucuda SMTP ortam değişkenleri tanımlı; şu an onlar kullanılıyor. Buradaki ayar,
            ortam değişkenleri kaldırılırsa devreye girer.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <div>
          <label className="label" htmlFor="m-host">SMTP sunucusu</label>
          <input id="m-host" name="smtp_host" defaultValue={host} required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="m-port">Port</label>
          <select id="m-port" name="smtp_port" defaultValue={port} className="field">
            <option value="465">465 (SSL)</option>
            <option value="587">587 (TLS)</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="m-user">Kullanıcı (e-posta adresi)</label>
          <input
            id="m-user"
            name="smtp_user"
            type="email"
            defaultValue={user || suggestedUser}
            required
            autoComplete="off"
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="m-pass">E-posta şifresi</label>
          <input
            id="m-pass"
            name="smtp_pass"
            type="password"
            autoComplete="new-password"
            placeholder={hasPassword ? "Kayıtlı — değiştirmek için yaz" : "E-posta hesabının şifresi"}
            className="field"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="m-from">Gönderen adı (isteğe bağlı)</label>
        <input
          id="m-from"
          name="mail_from"
          defaultValue={from}
          placeholder="Ten ve Ötesi <admin@tenotesi.com>"
          className="field"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button type="submit" formAction={test} disabled={testing} className="btn-outline">
          {testing ? "Gönderiliyor..." : "Deneme e-postası gönder"}
        </button>
        {state && (
          <p
            role="status"
            className={`text-[13px] ${state.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
