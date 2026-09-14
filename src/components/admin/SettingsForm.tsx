"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { saveSettingsAction, type ContentState } from "@/actions/admin-content";
import { formatAmount } from "@/lib/money";

export default function SettingsForm({
  settings,
  iyzicoConfigured,
}: {
  settings: Record<string, string>;
  iyzicoConfigured: boolean;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(
    saveSettingsAction,
    null,
  );

  const money = (key: string) => formatAmount(Number(settings[key]) || 0);

  return (
    <form action={action} className="space-y-6">
      {/* Site */}
      <section className="card space-y-4 p-5">
        <h2 className="text-[15px] font-semibold">Site Bilgileri</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-name">Site adı</label>
            <input id="s-name" name="site_name" defaultValue={settings.site_name} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="s-tagline">Slogan</label>
            <input
              id="s-tagline"
              name="site_tagline"
              defaultValue={settings.site_tagline}
              className="field"
            />
          </div>
        </div>
      </section>

      {/* Kargo */}
      <section className="card space-y-4 p-5">
        <h2 className="text-[15px] font-semibold">Kargo ve Ödeme Bedelleri</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="s-ship">Kargo ücreti (TL)</label>
            <input
              id="s-ship"
              name="shipping_fee"
              inputMode="decimal"
              defaultValue={money("shipping_fee")}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="s-free">Ücretsiz kargo limiti (TL)</label>
            <input
              id="s-free"
              name="free_shipping_threshold"
              inputMode="decimal"
              defaultValue={money("free_shipping_threshold")}
              className="field"
            />
            <p className="help">Bu tutarın üzerinde kargo ücreti alınmaz. 0 yazarsan hep ücretli.</p>
          </div>
          <div>
            <label className="label" htmlFor="s-cod">Kapıda ödeme bedeli (TL)</label>
            <input
              id="s-cod"
              name="cod_fee"
              inputMode="decimal"
              defaultValue={money("cod_fee")}
              className="field"
            />
          </div>
        </div>
      </section>

      {/* Ödeme yöntemleri */}
      <section className="card space-y-4 p-5">
        <h2 className="text-[15px] font-semibold">Ödeme Yöntemleri</h2>

        {!iyzicoConfigured && (
          <div className="flex items-start gap-2.5 border border-[color:var(--color-sale)] bg-red-50 p-3.5 text-[12.5px]">
            <AlertTriangle size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[color:var(--color-sale)]" />
            <span>
              iyzico API anahtarları <code>.env</code> dosyasında tanımlı değil. Kredi kartı
              ödemesi bu haliyle çalışmaz. IYZICO_API_KEY ve IYZICO_SECRET_KEY değerlerini
              girdikten sonra sunucuyu yeniden başlat.
            </span>
          </div>
        )}

        <div className="space-y-2.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="payment_credit_card"
              defaultChecked={settings.payment_credit_card === "1"}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Kredi / banka kartı (iyzico 3D Secure)
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="payment_bank_transfer"
              defaultChecked={settings.payment_bank_transfer === "1"}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Havale / EFT
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="payment_cod"
              defaultChecked={settings.payment_cod === "1"}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Kapıda ödeme
          </label>
        </div>

        <div>
          <label className="label" htmlFor="s-bank">Havale/EFT hesap bilgileri</label>
          <textarea
            id="s-bank"
            name="bank_accounts"
            rows={4}
            defaultValue={settings.bank_accounts}
            className="field"
          />
          <p className="help">Ödeme sayfasında ve sipariş sonucunda müşteriye gösterilir.</p>
        </div>

        <div>
          <label className="label" htmlFor="s-inst">Maksimum taksit sayısı</label>
          <input
            id="s-inst"
            name="max_installment"
            type="number"
            min={1}
            max={12}
            defaultValue={settings.max_installment}
            className="field !w-[120px]"
          />
        </div>
      </section>

      {/* İletişim */}
      <section className="card space-y-4 p-5">
        <h2 className="text-[15px] font-semibold">İletişim Bilgileri</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-phone">Telefon</label>
            <input
              id="s-phone"
              name="contact_phone"
              defaultValue={settings.contact_phone}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="s-email">E-posta</label>
            <input
              id="s-email"
              name="contact_email"
              type="email"
              defaultValue={settings.contact_email}
              className="field"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="s-address">Adres</label>
          <input
            id="s-address"
            name="contact_address"
            defaultValue={settings.contact_address}
            className="field"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-insta">Instagram adresi</label>
            <input
              id="s-insta"
              name="instagram_url"
              defaultValue={settings.instagram_url}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="s-wa">WhatsApp numarası</label>
            <input
              id="s-wa"
              name="whatsapp_number"
              defaultValue={settings.whatsapp_number ?? ""}
              placeholder="905551112233"
              className="field"
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-[color:var(--color-line)] bg-white px-4 py-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </button>
        {state && (
          <p
            role="status"
            className={`text-[13px] ${
              state.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
