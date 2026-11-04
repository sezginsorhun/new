import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { orderItems, orders, type AddressSnapshot } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatDateTime,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sipariş Detayı",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage(
  props: PageProps<"/hesabim/siparis/[orderNumber]">,
) {
  const { orderNumber } = await props.params;
  const user = await requireUser();

  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, user.id)))
    .limit(1);

  const order = rows[0];
  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  const shipping = order.shippingAddress as AddressSnapshot;
  const billing = order.billingAddress as AddressSnapshot;

  return (
    <div>
      <Link
        href="/hesabim/siparisler"
        className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-brand)]"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Siparişlerime dön
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px]">{order.orderNumber}</h2>
            <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          <span className={`badge ring-1 ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {order.trackingNumber && (
          <div className="mt-4 border border-[color:var(--color-line)] bg-[color:var(--color-cream)] p-3.5 text-[13px]">
            <strong>Kargo:</strong> {order.shippingCompany} — Takip numarası{" "}
            <strong>{order.trackingNumber}</strong>
          </div>
        )}
      </div>

      {/* Ürünler */}
      <div className="card mt-4 p-5">
        <h3 className="mb-4 text-[15px] font-semibold">Ürünler</h3>
        <ul className="divide-y divide-[color:var(--color-line)]">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="relative h-[84px] w-[64px] shrink-0 overflow-hidden bg-[#f3ece8]">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.productName} fill sizes="64px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {item.productSlug ? (
                  <Link href={`/urun/${item.productSlug}`} className="text-[13.5px] font-medium hover:underline">
                    {item.productName}
                  </Link>
                ) : (
                  <p className="text-[13.5px] font-medium">{item.productName}</p>
                )}
                <p className="mt-0.5 text-[12.5px] text-[color:var(--color-muted)]">
                  {item.variantInfo} · {item.quantity} adet
                </p>
              </div>
              <p className="shrink-0 text-[14px] font-semibold">{formatPrice(item.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-[color:var(--color-line)] pt-4 text-[13.5px]">
          <div className="flex justify-between">
            <dt className="text-[color:var(--color-ink-soft)]">Ara toplam</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-[color:var(--color-success)]">
              <dt>İndirim {order.couponCode ? `(${order.couponCode})` : ""}</dt>
              <dd>-{formatPrice(order.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-[color:var(--color-ink-soft)]">Kargo</dt>
            <dd>{order.shippingTotal === 0 ? "Ücretsiz" : formatPrice(order.shippingTotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-[color:var(--color-line)] pt-2.5 text-[15px] font-semibold">
            <dt>Toplam</dt>
            <dd>{formatPrice(order.grandTotal)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-[12.5px] text-[color:var(--color-muted)]">
            <dt>Ödeme yöntemi</dt>
            <dd>
              {PAYMENT_METHOD_LABELS[order.paymentMethod]}
              {order.installment > 1 ? ` — ${order.installment} taksit` : ""}
            </dd>
          </div>
        </dl>
      </div>

      {/* Adresler */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em]">
            Teslimat Adresi
          </h3>
          <address className="not-italic text-[13px] leading-relaxed text-[color:var(--color-ink-soft)]">
            {shipping.firstName} {shipping.lastName}
            <br />
            {shipping.line1}
            <br />
            {shipping.district} / {shipping.city}
            <br />
            {shipping.phone}
          </address>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em]">
            Fatura Adresi
          </h3>
          <address className="not-italic text-[13px] leading-relaxed text-[color:var(--color-ink-soft)]">
            {billing.isCorporate ? (
              <>
                {billing.companyName}
                <br />
                {billing.taxOffice} — {billing.taxNumber}
                <br />
              </>
            ) : (
              <>
                {billing.firstName} {billing.lastName}
                <br />
              </>
            )}
            {billing.line1}
            <br />
            {billing.district} / {billing.city}
          </address>
        </div>
      </div>
    </div>
  );
}
