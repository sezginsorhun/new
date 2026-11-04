import { adminUrl } from "@/lib/admin-path";
import { requirePermission } from "@/lib/auth";
import Link from "next/link";
import { and, desc, like, or, sql } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatDateTime,
} from "@/lib/utils";

const PER_PAGE = 25;

const STATUS_TABS = [
  { value: "", label: "Tümü" },
  { value: "PENDING", label: "Ödeme Bekliyor" },
  { value: "PAID", label: "Ödendi" },
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "SHIPPED", label: "Kargoda" },
  { value: "DELIVERED", label: "Teslim Edildi" },
  { value: "CANCELLED", label: "İptal" },
  { value: "REFUNDED", label: "İade" },
  { value: "FAILED", label: "Başarısız" },
];

export default async function AdminOrdersPage(props: PageProps<"/admin/siparisler">) {
  await requirePermission("orders.view");
  const query = await props.searchParams;
  const term = typeof query.q === "string" ? query.q.trim() : "";
  const status = typeof query.durum === "string" ? query.durum : "";
  const page = Math.max(Number(query.sayfa ?? 1) || 1, 1);

  const filters = [];
  if (term) {
    filters.push(
      or(
        like(orders.orderNumber, `%${term}%`),
        like(orders.email, `%${term}%`),
        like(orders.phone, `%${term}%`),
      )!,
    );
  }
  if (status) filters.push(sql`${orders.status} = ${status}`);

  const where = filters.length ? and(...filters) : undefined;

  const [rows, countRows, statusCounts, itemCounts] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(where),
    db
      .select({ status: orders.status, count: sql<number>`count(*)` })
      .from(orders)
      .groupBy(orders.status),
    db
      .select({
        orderId: orderItems.orderId,
        count: sql<number>`coalesce(sum(${orderItems.quantity}),0)`,
      })
      .from(orderItems)
      .groupBy(orderItems.orderId),
  ]);

  const total = countRows[0]?.count ?? 0;
  const pageCount = Math.max(Math.ceil(total / PER_PAGE), 1);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[26px]">Siparişler</h1>
        <p className="text-[12.5px] text-[color:var(--color-muted)]">{total} sipariş</p>
      </div>

      {/* Durum sekmeleri */}
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === ""
              ? statusCounts.reduce((sum, row) => sum + row.count, 0)
              : (statusCounts.find((row) => row.status === tab.value)?.count ?? 0);
          const query = new URLSearchParams();
          if (tab.value) query.set("durum", tab.value);
          if (term) query.set("q", term);
          const href = adminUrl(
            `siparisler${query.toString() ? `?${query.toString()}` : ""}`,
          );
          return (
            <Link
              key={tab.value}
              href={href}
              className={`shrink-0 border px-3 py-1.5 text-[12px] ${
                status === tab.value
                  ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
                  : "border-[color:var(--color-line-strong)] bg-white"
              }`}
            >
              {tab.label} <span className="opacity-60">({count})</span>
            </Link>
          );
        })}
      </div>

      {/* Arama */}
      <form className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        {status && <input type="hidden" name="durum" value={status} />}
        <div className="min-w-[220px] flex-1">
          <label className="label" htmlFor="ao-q">Ara</label>
          <div className="relative">
            <Search
              size={15}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
            />
            <input
              id="ao-q"
              name="q"
              defaultValue={term}
              placeholder="Sipariş no, e-posta veya telefon"
              className="field pl-9"
            />
          </div>
        </div>
        <button type="submit" className="btn-outline btn-sm">Ara</button>
        {(term || status) && <Link href={adminUrl("siparisler")} className="btn-ghost">Temizle</Link>}
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-basic min-w-[900px]">
            <thead>
              <tr>
                <th>Sipariş</th>
                <th>Müşteri</th>
                <th>Tarih</th>
                <th>Ödeme</th>
                <th>Durum</th>
                <th className="text-right">Ürün</th>
                <th className="text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[color:var(--color-muted)]">
                    Sipariş bulunamadı.
                  </td>
                </tr>
              )}
              {rows.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={adminUrl(`siparisler/${order.id}`)}
                      className="font-medium hover:text-[color:var(--color-brand)]"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="text-[12.5px]">
                    {order.email}
                    <span className="block text-[11.5px] text-[color:var(--color-muted)]">
                      {order.phone}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-[12px] text-[color:var(--color-muted)]">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="text-[12px]">
                    {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                    {order.installment > 1 && (
                      <span className="block text-[11px] text-[color:var(--color-muted)]">
                        {order.installment} taksit
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ring-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="text-right">
                    {itemCounts.find((row) => row.orderId === order.id)?.count ?? 0}
                  </td>
                  <td className="whitespace-nowrap text-right font-medium">
                    {formatPrice(order.grandTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
            const params = new URLSearchParams();
            if (term) params.set("q", term);
            if (status) params.set("durum", status);
            if (n > 1) params.set("sayfa", String(n));
            return (
              <Link
                key={n}
                href={adminUrl(`siparisler?${params.toString()}`)}
                className={`h-8 min-w-8 px-2 text-center text-[13px] leading-8 ${
                  n === page
                    ? "bg-[color:var(--color-ink)] text-white"
                    : "border border-[color:var(--color-line-strong)] bg-white"
                }`}
              >
                {n}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
