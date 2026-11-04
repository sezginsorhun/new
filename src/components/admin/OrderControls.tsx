"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Truck } from "lucide-react";
import {
  refundOrderAction,
  setAdminNoteAction,
  setShippingAction,
  updateOrderStatusAction,
  type OrderActionState,
} from "@/actions/admin-orders";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

const STATUSES = [
  "PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "FAILED",
];

const SHIPPING_COMPANIES = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "PTT Kargo",
  "Sürat Kargo",
  "UPS",
  "Trendyol Express",
  "Hepsijet",
];

export default function OrderControls({
  orderId,
  status,
  paymentMethod,
  shippingCompany,
  trackingNumber,
  adminNote,
}: {
  orderId: string;
  status: string;
  paymentMethod: string;
  shippingCompany: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusValue, setStatusValue] = useState(status);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmRefund, setConfirmRefund] = useState(false);

  const [shipState, shipAction, shipPending] = useActionState<OrderActionState, FormData>(
    setShippingAction,
    null,
  );
  const [noteState, noteAction, notePending] = useActionState<OrderActionState, FormData>(
    setAdminNoteAction,
    null,
  );

  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      {/* Durum */}
      <section className="card p-5">
        <h2 className="mb-3 text-[15px] font-semibold">Sipariş Durumu</h2>
        <select
          value={statusValue}
          onChange={(event) => setStatusValue(event.target.value)}
          className="field"
          aria-label="Sipariş durumu"
        >
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={pending || statusValue === status}
          onClick={() =>
            startTransition(async () => {
              const result = await updateOrderStatusAction(orderId, statusValue);
              setMessage({ ok: result.ok, text: result.message });
              router.refresh();
            })
          }
          className="btn-primary mt-3 w-full"
        >
          {pending ? "Güncelleniyor..." : "Durumu Güncelle"}
        </button>

        {message && (
          <p
            role="status"
            className={`mt-2 text-[12.5px] ${
              message.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
            }`}
          >
            {message.text}
          </p>
        )}

        {paymentMethod === "BANK_TRANSFER" && status === "PENDING" && (
          <p className="mt-3 border border-[color:var(--color-line)] bg-[color:var(--color-cream)] p-3 text-[12px] text-[color:var(--color-ink-soft)]">
            Havale geldiyse durumu <strong>Ödendi</strong> yap; müşteri siparişini takip
            edebilir hale gelir.
          </p>
        )}
      </section>

      {/* Kargo */}
      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
          <Truck size={15} strokeWidth={1.5} className="text-[color:var(--color-brand)]" />
          Kargo Bilgisi
        </h2>
        <form action={shipAction} className="space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <div>
            <label className="label" htmlFor="oc-company">Kargo firması</label>
            <select
              id="oc-company"
              name="shippingCompany"
              defaultValue={shippingCompany ?? ""}
              className="field"
            >
              <option value="">Seç...</option>
              {SHIPPING_COMPANIES.map((company) => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="oc-tracking">Takip numarası</label>
            <input
              id="oc-tracking"
              name="trackingNumber"
              defaultValue={trackingNumber ?? ""}
              className="field"
            />
          </div>
          <button type="submit" disabled={shipPending} className="btn-outline w-full">
            {shipPending ? "Kaydediliyor..." : "Kaydet ve Müşteriye Bildir"}
          </button>
          {shipState && (
            <p
              className={`text-[12.5px] ${
                shipState.ok
                  ? "text-[color:var(--color-success)]"
                  : "text-[color:var(--color-sale)]"
              }`}
            >
              {shipState.message}
            </p>
          )}
        </form>
      </section>

      {/* Yönetici notu */}
      <section className="card p-5">
        <h2 className="mb-3 text-[15px] font-semibold">Yönetici Notu</h2>
        <form action={noteAction} className="space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <textarea
            name="adminNote"
            rows={4}
            defaultValue={adminNote ?? ""}
            placeholder="Sadece panelde görünür"
            className="field"
          />
          <button type="submit" disabled={notePending} className="btn-outline w-full">
            {notePending ? "Kaydediliyor..." : "Notu Kaydet"}
          </button>
          {noteState && (
            <p className="text-[12.5px] text-[color:var(--color-success)]">{noteState.message}</p>
          )}
        </form>
      </section>

      {/* İade */}
      {paymentMethod === "CREDIT_CARD" && ["PAID", "PREPARING", "SHIPPED", "DELIVERED"].includes(status) && (
        <section className="card border-[color:var(--color-sale)] p-5">
          <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
            <AlertTriangle size={15} strokeWidth={1.5} className="text-[color:var(--color-sale)]" />
            Ödemeyi İade Et
          </h2>
          <p className="mb-3 text-[12px] text-[color:var(--color-ink-soft)]">
            Ödeme sağlayıcısı üzerinden tam iade yapılır ve stok geri eklenir. Bu işlem geri alınamaz.
          </p>
          {confirmRefund ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await refundOrderAction(orderId);
                    setMessage({ ok: result.ok, text: result.message });
                    setConfirmRefund(false);
                    router.refresh();
                  })
                }
                className="btn flex-1 bg-[color:var(--color-sale)] text-white"
              >
                {pending ? "İade ediliyor..." : "Evet, iade et"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmRefund(false)}
                className="btn-outline"
              >
                Vazgeç
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRefund(true)}
              className="btn-outline w-full"
            >
              İade İşlemi Başlat
            </button>
          )}
        </section>
      )}
    </aside>
  );
}
