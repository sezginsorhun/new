import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, CircleAlert, Copy } from "lucide-react";
import { findOrderByNumber, getOrderItems } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sipariş Sonucu",
  robots: { index: false, follow: false },
};

export default async function CheckoutResultPage(props: PageProps<"/odeme/sonuc">) {
  const query = await props.searchParams;
  const state = typeof query.durum === "string" ? query.durum : "hata";
  const orderNumber = typeof query.siparis === "string" ? query.siparis : "";
  const message = typeof query.mesaj === "string" ? query.mesaj : "";

  const order = orderNumber ? await findOrderByNumber(orderNumber) : null;
  const items = order ? await getOrderItems(order.id) : [];
  const settings = await getSettings();

  /* ------------------------- BAŞARISIZ ------------------------- */
  if (state !== "basarili") {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-[520px] text-center">
          <CircleAlert size={46} strokeWidth={1.2} className="mx-auto text-[color:var(--color-sale)]" />
          <h1 className="mt-5 text-[28px]">Ödeme tamamlanamadı</h1>
          <p className="mt-3 text-[14px] text-[color:var(--color-ink-soft)]">
            {message || "Ödeme sırasında bir sorun oluştu. Kartından herhangi bir tutar çekilmedi."}
          </p>
          {orderNumber && (
            <p className="mt-2 text-[12.5px] text-[color:var(--color-muted)]">
              Sipariş no: {orderNumber}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/sepet" className="btn-primary">Sepete Dön</Link>
            <Link href="/iletisim" className="btn-outline">Destek Al</Link>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------- BAŞARILI ------------------------ */
  const isTransfer = order?.paymentMethod === "BANK_TRANSFER";

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-[620px]">
        <div className="text-center">
          <CheckCircle2 size={50} strokeWidth={1.2} className="mx-auto text-[color:var(--color-success)]" />
          <h1 className="mt-5 text-[30px]">Siparişin alındı!</h1>
          <p className="mt-3 text-[14.5px] text-[color:var(--color-ink-soft)]">
            Teşekkürler. Sipariş özetini e-posta adresine gönderdik.
          </p>
          {orderNumber && (
            <p className="mt-4 inline-flex items-center gap-2 border border-[color:var(--color-line-strong)] bg-white px-4 py-2 text-[14px] font-semibold">
              <Copy size={14} strokeWidth={1.5} className="text-[color:var(--color-muted)]" />
              {orderNumber}
            </p>
          )}
        </div>

        {isTransfer && (
          <div className="card mt-8 border-[color:var(--color-brand)] p-5">
            <h2 className="text-[15px] font-semibold">Havale/EFT bilgileri</h2>
            <p className="mt-2 whitespace-pre-line text-[13px] text-[color:var(--color-ink-soft)]">
              {settings.bank_accounts}
            </p>
            <p className="mt-3 text-[13px]">
              Toplam tutar: <strong>{order ? formatPrice(order.grandTotal) : ""}</strong>
              <br />
              Açıklamaya <strong>{orderNumber}</strong> yazmayı unutma.
            </p>
          </div>
        )}

        {order && items.length > 0 && (
          <div className="card mt-6 p-5">
            <h2 className="mb-4 text-[15px] font-semibold">Sipariş Özeti</h2>
            <ul className="divide-y divide-[color:var(--color-line)]">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2.5 text-[13px]">
                  <span>
                    {item.productName}
                    <span className="block text-[11.5px] text-[color:var(--color-muted)]">
                      {item.variantInfo} · {item.quantity} adet
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-[color:var(--color-line)] pt-3.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-[color:var(--color-ink-soft)]">Kargo</dt>
                <dd>{order.shippingTotal === 0 ? "Ücretsiz" : formatPrice(order.shippingTotal)}</dd>
              </div>
              <div className="flex justify-between text-[15px] font-semibold">
                <dt>Toplam</dt>
                <dd>{formatPrice(order.grandTotal)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-[12px] text-[color:var(--color-muted)]">
                <dt>Ödeme</dt>
                <dd>
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                  {order.installment > 1 ? ` — ${order.installment} taksit` : ""}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/hesabim/siparisler" className="btn-primary">Siparişlerim</Link>
          <Link href="/" className="btn-outline">Alışverişe Devam Et</Link>
        </div>
      </div>
    </div>
  );
}
