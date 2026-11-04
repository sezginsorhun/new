import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Package } from "lucide-react";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Siparişlerim",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const user = await requireUser();

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  if (rows.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Package size={40} strokeWidth={1} className="mx-auto text-[color:var(--color-line-strong)]" />
        <p className="mt-4 text-[16px]">Henüz siparişin yok</p>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          İlk siparişini verdiğinde burada görünecek.
        </p>
        <Link href="/" className="btn-primary mt-6">Alışverişe Başla</Link>
      </div>
    );
  }

  // Her siparişin ürün sayısı
  const items = await db
    .select({ orderId: orderItems.orderId, quantity: orderItems.quantity })
    .from(orderItems);

  return (
    <div className="space-y-4">
      {rows.map((order) => {
        const count = items
          .filter((item) => item.orderId === order.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        return (
          <Link
            key={order.id}
            href={`/hesabim/siparis/${order.orderNumber}`}
            className="card block p-5 transition-colors hover:border-[color:var(--color-line-strong)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold">{order.orderNumber}</p>
                <p className="mt-0.5 text-[12.5px] text-[color:var(--color-muted)]">
                  {formatDateTime(order.createdAt)} · {count} ürün
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`badge ring-1 ${ORDER_STATUS_COLORS[order.status]}`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <p className="mt-1.5 text-[15px] font-semibold">
                  {formatPrice(order.grandTotal)}
                </p>
              </div>
            </div>

            {order.trackingNumber && (
              <p className="mt-3 border-t border-[color:var(--color-line)] pt-3 text-[12.5px] text-[color:var(--color-ink-soft)]">
                Kargo: {order.shippingCompany} — Takip no {order.trackingNumber}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
