/**
 * KULLANICILAR
 *
 * Müşteriler ekranından farkı: burada YÖNETİCİLER de görünür ve roller
 * buradan yönetilir. Sadece yöneticiler açabilir — proxy ve layout zaten
 * engeller, requireAdmin() ayrıca veritabanından doğrular.
 */

import Link from "next/link";
import { adminUrl } from "@/lib/admin-path";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { Search, ShieldCheck, User } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Kullanıcılar" };

const PER_PAGE = 30;

export default async function AdminUsersPage(props: PageProps<"/admin/kullanicilar">) {
  await requireAdmin();
  const query = await props.searchParams;
  const term = typeof query.q === "string" ? query.q.trim() : "";
  const roleFilter = query.rol === "ADMIN" || query.rol === "CUSTOMER" ? query.rol : null;
  const page = Math.max(Number(query.sayfa ?? 1) || 1, 1);

  const filters = [];
  if (roleFilter) filters.push(eq(users.role, roleFilter));
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
  const where = filters.length ? and(...filters) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.role), desc(users.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ count: sql<number>`count(*)` }).from(users).where(where),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const pageCount = Math.max(Math.ceil(total / PER_PAGE), 1);

  function linkWith(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (roleFilter) params.set("rol", roleFilter);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    return adminUrl("kullanicilar") + (qs ? `?${qs}` : "");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px]">Kullanıcılar</h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Toplam {total} hesap. Yöneticiler ve müşteriler birlikte listelenir.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form action={adminUrl("kullanicilar")} className="relative flex-1 min-w-[220px]">
          {roleFilter && <input type="hidden" name="rol" value={roleFilter} />}
          <Search
            size={15}
            strokeWidth={1.7}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
          />
          <input
            name="q"
            defaultValue={term}
            placeholder="Ad, e-posta veya telefon ara..."
            className="field pl-9"
          />
        </form>

        <div className="flex gap-1.5">
          <Link href={linkWith({ rol: undefined, sayfa: undefined })} className={roleFilter ? "btn-ghost text-[12.5px]" : "btn-primary text-[12.5px]"}>
            Tümü
          </Link>
          <Link href={linkWith({ rol: "ADMIN", sayfa: undefined })} className={roleFilter === "ADMIN" ? "btn-primary text-[12.5px]" : "btn-ghost text-[12.5px]"}>
            Yöneticiler
          </Link>
          <Link href={linkWith({ rol: "CUSTOMER", sayfa: undefined })} className={roleFilter === "CUSTOMER" ? "btn-primary text-[12.5px]" : "btn-ghost text-[12.5px]"}>
            Müşteriler
          </Link>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-basic">
          <thead>
            <tr>
              <th>Kişi</th>
              <th>E-posta</th>
              <th>Telefon</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Kayıt</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {row.role === "ADMIN" ? (
                      <ShieldCheck size={14} strokeWidth={1.7} className="text-[color:var(--color-accent)]" />
                    ) : (
                      <User size={14} strokeWidth={1.7} className="text-[color:var(--color-muted)]" />
                    )}
                    {row.firstName} {row.lastName}
                  </span>
                </td>
                <td className="break-all">{row.email}</td>
                <td>{row.phone ?? "—"}</td>
                <td>
                  <span className={row.role === "ADMIN" ? "badge badge-ok" : "badge"}>
                    {row.role === "ADMIN" ? "Yönetici" : "Müşteri"}
                  </span>
                </td>
                <td>
                  <span className={row.isActive ? "badge badge-ok" : "badge"}>
                    {row.isActive ? "Aktif" : "Kapalı"}
                  </span>
                </td>
                <td>{formatDate(row.createdAt)}</td>
                <td className="text-right">
                  <Link href={adminUrl(`kullanicilar/${row.id}`)} className="btn-ghost text-[12px]">
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[color:var(--color-muted)]">
                  Aramana uyan kullanıcı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-[color:var(--color-muted)]">
            Sayfa {page} / {pageCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={linkWith({ sayfa: String(page - 1) })} className="btn-ghost text-[12.5px]">
                Önceki
              </Link>
            )}
            {page < pageCount && (
              <Link href={linkWith({ sayfa: String(page + 1) })} className="btn-ghost text-[12.5px]">
                Sonraki
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
