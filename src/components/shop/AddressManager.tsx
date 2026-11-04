"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Address } from "@/db/schema";
import { deleteAddressAction, saveAddressAction, type FormState } from "@/actions/account";
import { TR_CITIES } from "@/lib/utils";

export default function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      await deleteAddressAction(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[18px]">Kayıtlı Adreslerim</h2>
        <button type="button" onClick={() => setEditing("new")} className="btn-outline btn-sm">
          <Plus size={14} strokeWidth={1.5} />
          Yeni Adres
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin size={38} strokeWidth={1} className="mx-auto text-[color:var(--color-line-strong)]" />
          <p className="mt-4 text-[15px]">Kayıtlı adresin yok</p>
          <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
            Ödeme adımında hızlı ilerlemek için adres ekle.
          </p>
          <button type="button" onClick={() => setEditing("new")} className="btn-primary mt-5">
            Adres Ekle
          </button>
        </div>
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 ${pending ? "opacity-60" : ""}`}>
          {addresses.map((address) => (
            <div key={address.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-semibold">
                    {address.title}
                    {address.isDefault && (
                      <span className="ml-2 badge bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-dark)]">
                        Varsayılan
                      </span>
                    )}
                  </p>
                  {address.isCorporate && (
                    <p className="mt-0.5 text-[11.5px] text-[color:var(--color-muted)]">
                      Kurumsal fatura
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(address)}
                    aria-label="Adresi düzenle"
                    className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
                  >
                    <Pencil size={15} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(address.id)}
                    aria-label="Adresi sil"
                    className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-sale)]"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <address className="mt-3 not-italic text-[13px] leading-relaxed text-[color:var(--color-ink-soft)]">
                {address.firstName} {address.lastName}
                <br />
                {address.line1}
                <br />
                {address.district} / {address.city}
                <br />
                {address.phone}
              </address>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <AddressDialog
          address={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AddressDialog({
  address,
  onClose,
}: {
  address: Address | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveAddressAction,
    null,
  );
  const [isCorporate, setIsCorporate] = useState(address?.isCorporate ?? false);

  // Kayıt başarılıysa kapat
  if (state?.ok) {
    setTimeout(onClose, 400);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Kapat" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={address ? "Adresi düzenle" : "Yeni adres"}
        className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto bg-white p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[20px]">{address ? "Adresi Düzenle" : "Yeni Adres"}</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form action={action} className="space-y-4">
          {address && <input type="hidden" name="id" value={address.id} />}

          <div>
            <label className="label" htmlFor="a-title">Adres başlığı *</label>
            <input
              id="a-title"
              name="title"
              required
              defaultValue={address?.title ?? ""}
              placeholder="Ev, İş..."
              className="field"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="a-first">Ad *</label>
              <input id="a-first" name="firstName" required defaultValue={address?.firstName ?? ""} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="a-last">Soyad *</label>
              <input id="a-last" name="lastName" required defaultValue={address?.lastName ?? ""} className="field" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="a-phone">Telefon *</label>
            <input
              id="a-phone"
              name="phone"
              type="tel"
              required
              defaultValue={address?.phone ?? ""}
              placeholder="05XXXXXXXXX"
              className="field"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="a-city">İl *</label>
              <select id="a-city" name="city" required defaultValue={address?.city ?? ""} className="field">
                <option value="">Seç...</option>
                {TR_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="a-district">İlçe *</label>
              <input id="a-district" name="district" required defaultValue={address?.district ?? ""} className="field" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="a-line1">Açık adres *</label>
            <textarea
              id="a-line1"
              name="line1"
              rows={3}
              required
              defaultValue={address?.line1 ?? ""}
              placeholder="Mahalle, sokak, bina no, daire no"
              className="field"
            />
          </div>

          <div>
            <label className="label" htmlFor="a-zip">Posta kodu</label>
            <input id="a-zip" name="zipCode" defaultValue={address?.zipCode ?? ""} className="field sm:max-w-[160px]" />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="isCorporate"
              checked={isCorporate}
              onChange={(event) => setIsCorporate(event.target.checked)}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Kurumsal fatura istiyorum
          </label>

          {isCorporate && (
            <div className="space-y-4 border-l-2 border-[color:var(--color-brand)] pl-4">
              <div>
                <label className="label" htmlFor="a-company">Firma adı *</label>
                <input id="a-company" name="companyName" defaultValue={address?.companyName ?? ""} className="field" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="a-taxoffice">Vergi dairesi *</label>
                  <input id="a-taxoffice" name="taxOffice" defaultValue={address?.taxOffice ?? ""} className="field" />
                </div>
                <div>
                  <label className="label" htmlFor="a-taxno">Vergi no *</label>
                  <input id="a-taxno" name="taxNumber" defaultValue={address?.taxNumber ?? ""} className="field" />
                </div>
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="isDefault"
              defaultChecked={address?.isDefault ?? false}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Varsayılan adres yap
          </label>

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

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={pending} className="btn-primary flex-1">
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              Vazgeç
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
