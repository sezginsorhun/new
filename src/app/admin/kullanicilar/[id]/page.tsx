import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { adminUrl } from "@/lib/admin-path";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import UserEditForm from "@/components/admin/UserEditForm";

export const metadata = { title: "Kullanıcı" };

export default async function AdminUserDetailPage(props: PageProps<"/admin/kullanicilar/[id]">) {
  const admin = await requirePermission("users.manage");
  const { id } = await props.params;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) notFound();

  const [stats] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${orders.grandTotal}),0)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.userId, user.id),
        inArray(orders.status, ["PAID", "PREPARING", "SHIPPED", "DELIVERED"]),
      ),
    );

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      grandTotal: orders.grandTotal,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={adminUrl("kullanicilar")}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-muted)]"
        >
          <ArrowLeft size={14} strokeWidth={1.7} />
          Kullanıcılar
        </Link>
        <h1 className="mt-2 text-[24px]">
          {user.firstName} {user.lastName}
        </h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          {user.email} · {formatDate(user.createdAt)} tarihinde kayıt oldu ·{" "}
          {Number(stats?.count ?? 0)} sipariş, toplam {formatPrice(Number(stats?.total ?? 0))}
        </p>
      </div>

      <UserEditForm
        user={{
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        }}
        isSelf={user.id === admin.id}
      />

      {recentOrders.length > 0 && (
        <section>
          <h2 className="mb-3 text-[17px]">Son siparişleri</h2>
          <div className="card overflow-x-auto">
            <table className="table-basic">
              <thead>
                <tr>
                  <th>Sipariş</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={adminUrl(`siparisler/${row.id}`)} className="link-underline">
                        {row.orderNumber}
                      </Link>
                    </td>
                    <td>{formatPrice(row.grandTotal)}</td>
                    <td>{row.status}</td>
                    <td>{formatDate(row.createdAt)}</td>
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
