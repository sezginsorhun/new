import { adminUrl } from "@/lib/admin-path";
import { and, desc, eq, like, inArray, or, sql } from "drizzle-orm";
import { Search } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import CustomerActions from "@/components/admin/CustomerActions";

const PER_PAGE = 30;

export default async function AdminCustomersPage(props: PageProps<"/admin/musteriler">) {
  const query = await props.searchParams;
  const term = typeof query.q === "string" ? query.q.trim() : "";
  const page = Math.max(Number(query.sayfa ?? 1) || 1, 1);

  const filters = [eq(users.role, "CUSTOMER")];
  if (term) {
    filters.push(
      or(
        like(users.email, `%${term}%`),
        like(users.firstName, `%${term}%`),
        like(users.lastName, `%${term}%`),
        like(users.phone, `%${term}%`),
      )!,
    );
  }
  const where = and(...filters);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ count: sql<number>`count(*)` }).from(users).where(where),
  ]);

  const ids = rows.map((row) => row.id);
  const orderStats = ids.length
    ? await db
        .select({
          userId: orders.userId,
          count: sql<number>`count(*)`,
          total: sql<number>`coalesce(sum(${orders.grandTotal}),0)`,
        })
        .from(orders)
        .where(
          and(
            inArray(orders.userId, ids),
            inArray(orders.status, ["PAID", "PREPARING", "SHIPPED", "DELIVERED"]),
          ),
        )
        .groupBy(orders.userId)
    : [];

  const total = countRows[0]?.count ?? 0;
  const pageCount = Math.max(Math.ceil(total / PER_PAGE), 1);

  return (
    <div>
      <h1 className="mb-1 text-[26px]">Müşteriler</h1>
      <p className="mb-5 text-[13px] text-[color:var(--color-muted)]">{total} kayıtlı müşteri</p>

      <form className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <label className="label" htmlFor="cu-q">Ara</label>
          <div className="relative">
            <Search
              size={15}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
            />
            <input
              id="cu-q"
              name="q"
              defaultValue={term}
              placeholder="Ad, e-posta veya telefon"
              className="field pl-9"
            />
          </div>
        </div>
        <button type="submit" className="btn-outline btn-sm">Ara</button>
        {term && <Link href={adminUrl("musteriler")} className="btn-ghost">Temizle</Link>}
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-basic min-w-[820px]">
            <thead>
              <tr>
                <th>Müşteri</th>
                <th>İletişim</th>
                <th>Kayıt</th>
                <th className="text-right">Sipariş</th>
                <th className="text-right">Toplam harcama</th>
                <th>Durum</th>
                <th className="text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[color:var(--color-muted)]">
                    Müşteri bulunamadı.
                  </td>
                </tr>
              )}
              {rows.map((customer) => {
                const stats = orderStats.find((row) => row.userId === customer.id);
                return (
                  <tr key={customer.id}>
                    <td className="font-medium">
                      {customer.firstName} {customer.lastName}
                    </td>
                    <td className="text-[12.5px]">
                      {customer.email}
                      <span className="block text-[11.5px] text-[color:var(--color-muted)]">
                        {customer.phone ?? "—"}
                      </span>
                    </td>
                    <td className="text-[12px] text-[color:var(--color-muted)]">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="text-right">{stats?.count ?? 0}</td>
                    <td className="whitespace-nowrap text-right font-medium">
                      {formatPrice(stats?.total ?? 0)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          customer.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-[color:var(--color-sale)]"
                        }`}
                      >
                        {customer.isActive ? "Aktif" : "Kapalı"}
                      </span>
                    </td>
                    <td>
                      <CustomerActions id={customer.id} isActive={customer.isActive} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
            const params = new URLSearchParams();
            if (term) params.set("q", term);
            if (n > 1) params.set("sayfa", String(n));
            return (
              <Link
                key={n}
                href={adminUrl(`musteriler?${params.toString()}`)}
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
