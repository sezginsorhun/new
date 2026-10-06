import { adminUrl } from "@/lib/admin-path";
import { requirePermission } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { orderItems, orders, payments, type AddressSnapshot } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatDateTime,
} from "@/lib/utils";
import OrderControls from "@/components/admin/OrderControls";

export default async function AdminOrderDetailPage(
  props: PageProps<"/admin/siparisler/[id]">,
) {
  await requirePermission("orders.view");
  const { id } = await props.params;

  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const order = rows[0];
  if (!order) notFound();

  const [items, paymentRows] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(payments).where(eq(payments.orderId, id)).orderBy(desc(payments.createdAt)),
  ]);

  const shipping = order.shippingAddress as AddressSnapshot;
  const billing = order.billingAddress as AddressSnapshot;
  const payment = paymentRows[0];

  return (
    <div className="max-w-[1080px]">
      <Link
        href={adminUrl("siparisler")}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-brand)]"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Siparişlere dön
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px]">{order.orderNumber}</h1>
          <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
            {formatDateTime(order.createdAt)} · {order.email} · {order.phone}
          </p>
        </div>
        <span className={`badge ring-1 ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* Ürünler */}
          <section className="card overflow-hidden">
            <div className="border-b border-[color:var(--color-line)] px-5 py-3.5">
              <h2 className="text-[15px] font-semibold">Ürünler</h2>
            </div>
            <ul className="divide-y divide-[color:var(--color-line)]">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 px-5 py-4">
                  <div className="relative h-[76px] w-[58px] shrink-0 overflow-hidden bg-[#f3ece8]">
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt="" fill sizes="58px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.productSlug ? (
                      <Link
                        href={`/urun/${item.productSlug}`}
                        target="_blank"
                        className="text-[13.5px] font-medium hover:text-[color:var(--color-brand)]"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="text-[13.5px] font-medium">{item.productName}</p>
                    )}
                    <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                      {item.variantInfo} · {item.sku}
                    </p>
                    <p className="mt-0.5 text-[12px]">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-[14px] font-semibold">
                    {formatPrice(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-[color:var(--color-line)] px-5 py-4 text-[13.5px]">
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
                <dd>
                  {order.shippingTotal === 0 ? "Ücretsiz" : formatPrice(order.shippingTotal)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-[color:var(--color-line)] pt-2.5 text-[16px] font-semibold">
                <dt>Toplam</dt>
                <dd>{formatPrice(order.grandTotal)}</dd>
              </div>
            </dl>
          </section>

          {/* Adresler */}
          <div className="grid gap-6 sm:grid-cols-2">
            <section className="card p-5">
              <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em]">
                Teslimat Adresi
              </h2>
              <address className="not-italic text-[13px] leading-relaxed text-[color:var(--color-ink-soft)]">
                {shipping.firstName} {shipping.lastName}
                <br />
                {shipping.line1}
                <br />
                {shipping.district} / {shipping.city}
                {shipping.zipCode ? ` ${shipping.zipCode}` : ""}
                <br />
                {shipping.phone}
              </address>
            </section>

            <section className="card p-5">
              <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em]">
                Fatura Adresi
              </h2>
              <address className="not-italic text-[13px] leading-relaxed text-[color:var(--color-ink-soft)]">
                {billing.isCorporate ? (
                  <>
                    <strong>{billing.companyName}</strong>
                    <br />
                    VD: {billing.taxOffice} — VN: {billing.taxNumber}
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
            </section>
          </div>

          {/* Ödeme kaydı */}
          <section className="card p-5">
            <h2 className="mb-3 text-[15px] font-semibold">Ödeme Bilgisi</h2>
            <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <dt className="text-[color:var(--color-muted)]">Yöntem</dt>
                <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[color:var(--color-muted)]">Taksit</dt>
                <dd>{order.installment > 1 ? `${order.installment} taksit` : "Tek çekim"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[color:var(--color-muted)]">Ödeme durumu</dt>
                <dd>{order.paymentStatus}</dd>
              </div>
              {payment?.cardAssociation && (
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--color-muted)]">Kart</dt>
                  <dd>
                    {payment.cardAssociation} {payment.cardFamily}
                    {payment.lastFourDigits ? ` ****${payment.lastFourDigits}` : ""}
                  </dd>
                </div>
              )}
              {payment?.iyzicoPaymentId && (
                <div className="flex justify-between gap-3 sm:col-span-2">
                  <dt className="text-[color:var(--color-muted)]">iyzico ödeme no</dt>
                  <dd className="font-mono text-[12px]">{payment.iyzicoPaymentId}</dd>
                </div>
              )}
              {payment?.errorMessage && (
                <div className="sm:col-span-2">
                  <dt className="text-[color:var(--color-muted)]">Hata</dt>
                  <dd className="text-[color:var(--color-sale)]">{payment.errorMessage}</dd>
                </div>
              )}
            </dl>
          </section>

          {order.customerNote && (
            <section className="card p-5">
              <h2 className="mb-2 text-[15px] font-semibold">Müşteri Notu</h2>
              <p className="text-[13px] text-[color:var(--color-ink-soft)]">
                {order.customerNote}
              </p>
            </section>
          )}
        </div>

        {/* Yönetim */}
        <OrderControls
          orderId={order.id}
          status={order.status}
          paymentMethod={order.paymentMethod}
          shippingCompany={order.shippingCompany}
          trackingNumber={order.trackingNumber}
          adminNote={order.adminNote}
        />
      </div>
    </div>
  );
}
