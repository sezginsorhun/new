"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Coupon } from "@/db/schema";
import {
  deleteCouponAction,
  saveCouponAction,
  type ContentState,
} from "@/actions/admin-content";
import { formatAmount, formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  PERCENT: "Yüzde indirim",
  FIXED: "Tutar indirimi",
  FREE_SHIPPING: "Ücretsiz kargo",
};

export default function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setEditing("new")} className="btn-primary btn-sm">
          <Plus size={14} strokeWidth={1.5} />
          Yeni Kupon
        </button>
      </div>

      <div className={`card overflow-hidden ${pending ? "opacity-60" : ""}`}>
        <div className="overflow-x-auto">
          <table className="table-basic min-w-[860px]">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Tür</th>
                <th>İndirim</th>
                <th>Min. sepet</th>
                <th className="text-right">Kullanım</th>
                <th>Geçerlilik</th>
                <th>Durum</th>
                <th className="text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[color:var(--color-muted)]">
                    Kupon yok.
                  </td>
                </tr>
              )}
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="font-mono text-[12.5px] font-semibold">{coupon.code}</td>
                  <td className="text-[12.5px]">{TYPE_LABELS[coupon.type]}</td>
                  <td className="text-[12.5px]">
                    {coupon.type === "PERCENT"
                      ? `%${coupon.value}`
                      : coupon.type === "FIXED"
                        ? formatPrice(coupon.value)
                        : "Kargo bedava"}
                    {coupon.maxDiscount && (
                      <span className="block text-[11px] text-[color:var(--color-muted)]">
                        en fazla {formatPrice(coupon.maxDiscount)}
                      </span>
                    )}
                  </td>
                  <td className="text-[12.5px]">
                    {coupon.minOrderTotal > 0 ? formatPrice(coupon.minOrderTotal) : "—"}
                  </td>
                  <td className="text-right text-[12.5px]">
                    {coupon.usedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                  </td>
                  <td className="text-[11.5px] text-[color:var(--color-muted)]">
                    {coupon.startsAt ? formatDate(coupon.startsAt) : "hemen"}
                    {" – "}
                    {coupon.endsAt ? formatDate(coupon.endsAt) : "süresiz"}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        coupon.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {coupon.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => setEditing(coupon)}
                        aria-label="Düzenle"
                        className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
                      >
                        <Pencil size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            await deleteCouponAction(coupon.id);
                            router.refresh();
                          })
                        }
                        aria-label="Sil"
                        className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-sale)]"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <CouponDialog
          coupon={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CouponDialog({
  coupon,
  onClose,
}: {
  coupon: Coupon | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(
    saveCouponAction,
    null,
  );
  const [type, setType] = useState(coupon?.type ?? "PERCENT");

  if (state?.ok) setTimeout(onClose, 350);

  const toDateInput = (date: Date | null) =>
    date ? new Date(date).toISOString().slice(0, 10) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Kapat" />
      <div role="dialog" aria-modal="true" className="relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[19px]">{coupon ? "Kuponu Düzenle" : "Yeni Kupon"}</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form action={action} className="space-y-4">
          {coupon && <input type="hidden" name="id" value={coupon.id} />}

          <div>
            <label className="label" htmlFor="cp-code">Kupon kodu *</label>
            <input
              id="cp-code"
              name="code"
              required
              defaultValue={coupon?.code ?? ""}
              placeholder="HOSGELDIN10"
              className="field font-mono uppercase"
            />
          </div>

          <div>
            <label className="label" htmlFor="cp-type">İndirim türü *</label>
            <select
              id="cp-type"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
              className="field"
            >
              <option value="PERCENT">Yüzde indirim (%)</option>
              <option value="FIXED">Sabit tutar indirimi (TL)</option>
              <option value="FREE_SHIPPING">Ücretsiz kargo</option>
            </select>
          </div>

          {type !== "FREE_SHIPPING" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="cp-value">
                  {type === "PERCENT" ? "İndirim yüzdesi *" : "İndirim tutarı (TL) *"}
                </label>
                <input
                  id="cp-value"
                  name="value"
                  required
                  inputMode="decimal"
                  defaultValue={
                    coupon
                      ? coupon.type === "PERCENT"
                        ? String(coupon.value)
                        : formatAmount(coupon.value)
                      : ""
                  }
                  placeholder={type === "PERCENT" ? "10" : "50,00"}
                  className="field"
                />
              </div>
              {type === "PERCENT" && (
                <div>
                  <label className="label" htmlFor="cp-max">Üst sınır (TL)</label>
                  <input
                    id="cp-max"
                    name="maxDiscount"
                    inputMode="decimal"
                    defaultValue={coupon?.maxDiscount ? formatAmount(coupon.maxDiscount) : ""}
                    placeholder="150,00"
                    className="field"
                  />
                  <p className="help">Yüzde indirimin en fazla ne kadar olacağı.</p>
                </div>
              )}
            </div>
          )}
          {type === "FREE_SHIPPING" && <input type="hidden" name="value" value="0" />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cp-min">Minimum sepet tutarı (TL)</label>
              <input
                id="cp-min"
                name="minOrderTotal"
                inputMode="decimal"
                defaultValue={coupon?.minOrderTotal ? formatAmount(coupon.minOrderTotal) : ""}
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="cp-limit">Toplam kullanım limiti</label>
              <input
                id="cp-limit"
                name="usageLimit"
                type="number"
                min={1}
                defaultValue={coupon?.usageLimit ?? ""}
                placeholder="sınırsız"
                className="field"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cp-start">Başlangıç tarihi</label>
              <input
                id="cp-start"
                name="startsAt"
                type="date"
                defaultValue={toDateInput(coupon?.startsAt ?? null)}
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="cp-end">Bitiş tarihi</label>
              <input
                id="cp-end"
                name="endsAt"
                type="date"
                defaultValue={toDateInput(coupon?.endsAt ?? null)}
                className="field"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={coupon?.isActive ?? true}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Aktif
          </label>

          {state && (
            <p
              className={`text-[13px] ${
                state.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={pending} className="btn-primary flex-1">
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">Vazgeç</button>
          </div>
        </form>
      </div>
    </div>
  );
}
