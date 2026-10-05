import { adminUrl } from "@/lib/admin-path";
import Link from "next/link";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowRight,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { db } from "@/db";
import {
  contactMessages,
  orders,
  productVariants,
  products,
  reviews,
  users,
} from "@/db/schema";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, formatDateTime } from "@/lib/utils";

const PAID_STATUSES = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;

export default async function AdminDashboard() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    todayRows,
    monthRows,
    pendingRows,
    customerRows,
    productRows,
    lowStock,
    recentOrders,
    pendingReviews,
    unreadMessages,
    dailySeries,
    topProducts,
  ] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${orders.grandTotal}),0)`,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startOfToday), inArray(orders.status, [...PAID_STATUSES]))),
    db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(${orders.grandTotal}),0)`,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startOfMonth), inArray(orders.status, [...PAID_STATUSES]))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(inArray(orders.status, ["PENDING", "PAID"])),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "CUSTOMER")),
    db.select({ count: sql<number>`count(*)` }).from(products),
    db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        size: productVariants.size,
        colorName: productVariants.colorName,
        stock: productVariants.stock,
        productName: products.name,
        productId: products.id,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(
        and(
          eq(productVariants.isActive, true),
          eq(products.isActive, true),
          sql`${productVariants.stock} <= ${productVariants.lowStockAlert}`,
        ),
      )
      .orderBy(productVariants.stock)
      .limit(8),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.isApproved, false)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(contactMessages)
      .where(eq(contactMessages.isRead, false)),
    db
      .select({
        day: sql<string>`date_format(${orders.createdAt}, '%Y-%m-%d')`.as("day"),
        total: sql<number>`coalesce(sum(${orders.grandTotal}),0)`.as("total"),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, last30), inArray(orders.status, [...PAID_STATUSES])))
      .groupBy(sql`date_format(${orders.createdAt}, '%Y-%m-%d')`)
      .orderBy(sql`date_format(${orders.createdAt}, '%Y-%m-%d')`),
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        soldCount: products.soldCount,
        price: products.price,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.soldCount))
      .limit(5),
  ]);

  const maxDaily = Math.max(...dailySeries.map((d) => d.total), 1);

  const stats = [
    {
      label: "Bugünkü ciro",
      value: formatPrice(todayRows[0]?.total ?? 0),
      sub: `${todayRows[0]?.count ?? 0} sipariş`,
      icon: TrendingUp,
    },
    {
      label: "Bu ay ciro",
      value: formatPrice(monthRows[0]?.total ?? 0),
      sub: `${monthRows[0]?.count ?? 0} sipariş`,
      icon: ShoppingCart,
    },
    {
      label: "Bekleyen sipariş",
      value: String(pendingRows[0]?.count ?? 0),
      sub: "hazırlanması gerekiyor",
      icon: Package,
    },
    {
      label: "Müşteri",
      value: String(customerRows[0]?.count ?? 0),
      sub: `${productRows[0]?.count ?? 0} ürün`,
      icon: Users,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-[26px]">Panel</h1>

      {/* Bildirimler */}
      {((pendingReviews[0]?.count ?? 0) > 0 || (unreadMessages[0]?.count ?? 0) > 0) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(pendingReviews[0]?.count ?? 0) > 0 && (
            <Link
              href={adminUrl("yorumlar")}
              className="flex items-center gap-2 border border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] px-3.5 py-2 text-[12.5px]"
            >
              {pendingReviews[0].count} yorum onay bekliyor
              <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          )}
          {(unreadMessages[0]?.count ?? 0) > 0 && (
            <Link
              href={adminUrl("mesajlar")}
              className="flex items-center gap-2 border border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] px-3.5 py-2 text-[12.5px]"
            >
              {unreadMessages[0].count} okunmamış mesaj
              <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          )}
        </div>
      )}

      {/* İstatistikler */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                {label}
              </p>
              <Icon size={17} strokeWidth={1.5} className="text-[color:var(--color-brand)]" />
            </div>
            <p className="mt-2.5 text-[24px] font-semibold tracking-tight">{value}</p>
            <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Son 30 gün grafiği */}
      <section className="card mt-6 p-5">
        <h2 className="text-[15px] font-semibold">Son 30 gün cirosu</h2>
        {dailySeries.length === 0 ? (
          <p className="mt-4 text-[13px] text-[color:var(--color-muted)]">
            Henüz tamamlanmış sipariş yok.
          </p>
        ) : (
          <div className="mt-5 flex h-[160px] items-end gap-1.5">
            {dailySeries.map((point) => (
              <div key={point.day} className="group relative flex-1">
                <div
                  className="w-full bg-[color:var(--color-brand)] transition-colors group-hover:bg-[color:var(--color-brand-dark)]"
                  style={{ height: `${Math.max((point.total / maxDaily) * 150, 3)}px` }}
                />
                <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap bg-[color:var(--color-ink)] px-2 py-1 text-[11px] text-white group-hover:block">
                  {point.day} — {formatPrice(point.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Son siparişler */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-3.5">
            <h2 className="text-[15px] font-semibold">Son Siparişler</h2>
            <Link href={adminUrl("siparisler")} className="text-[12px] text-[color:var(--color-brand)]">
              Tümü →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[color:var(--color-muted)]">
              Henüz sipariş yok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-basic">
                <thead>
                  <tr>
                    <th>Sipariş</th>
                    <th>Tarih</th>
                    <th>Durum</th>
                    <th className="text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link
                          href={adminUrl(`siparisler/${order.id}`)}
                          className="font-medium hover:text-[color:var(--color-brand)]"
                        >
                          {order.orderNumber}
                        </Link>
                        <span className="block text-[11.5px] text-[color:var(--color-muted)]">
                          {order.email}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-[12px] text-[color:var(--color-muted)]">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td>
                        <span className={`badge ring-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-right font-medium">
                        {formatPrice(order.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Kritik stok */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <AlertTriangle size={15} strokeWidth={1.5} className="text-[color:var(--color-sale)]" />
              Kritik Stok
            </h2>
            <Link href={adminUrl("stok")} className="text-[12px] text-[color:var(--color-brand)]">
              Tümü →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[color:var(--color-muted)]">
              Kritik stokta ürün yok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-basic">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Varyant</th>
                    <th className="text-right">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((variant) => (
                    <tr key={variant.id}>
                      <td>
                        <Link
                          href={adminUrl(`urunler/${variant.productId}`)}
                          className="hover:text-[color:var(--color-brand)]"
                        >
                          {variant.productName}
                        </Link>
                      </td>
                      <td className="text-[12px] text-[color:var(--color-muted)]">
                        {variant.colorName} / {variant.size}
                      </td>
                      <td className="text-right">
                        <span
                          className={`badge ${
                            variant.stock === 0
                              ? "bg-red-50 text-[color:var(--color-sale)]"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {variant.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* En çok satanlar */}
      {topProducts.length > 0 && (
        <section className="card mt-6 overflow-hidden">
          <div className="border-b border-[color:var(--color-line)] px-5 py-3.5">
            <h2 className="text-[15px] font-semibold">En Çok Satanlar</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table-basic">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th className="text-right">Satış adedi</th>
                  <th className="text-right">Fiyat</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link
                        href={adminUrl(`urunler/${product.id}`)}
                        className="hover:text-[color:var(--color-brand)]"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="text-right">{product.soldCount}</td>
                    <td className="text-right">{formatPrice(product.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
