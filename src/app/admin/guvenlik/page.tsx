import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { ShieldCheck, ShieldAlert, KeyRound, Monitor } from "lucide-react";
import { db } from "@/db";
import { loginAttempts, sessions, users, userSecurity } from "@/db/schema";
import { getActiveSession, requirePermission } from "@/lib/auth";
import { listAuditLogs, AUDIT_LABELS } from "@/lib/audit";
import { describeDevice } from "@/lib/request-info";
import { ADMIN_PATH } from "@/lib/admin-path";
import SessionList from "@/components/admin/SessionList";
import AccountEmailForm from "@/components/admin/AccountEmailForm";

export const metadata = { title: "Güvenlik" };

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminSecurityPage() {
  const admin = await requirePermission("security.view");
  const active = await getActiveSession();

  const [logs, mySessions, failedCount, lockedUsers, security] = await Promise.all([
    listAuditLogs({ limit: 80 }),
    db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, admin.id), isNull(sessions.revokedAt)))
      .orderBy(desc(sessions.lastSeenAt))
      .limit(20),
    db
      .select({ n: sql<number>`count(*)` })
      .from(loginAttempts)
      // Son 24 saat — zaman hesabı veritabanında yapılır.
      .where(
        and(
          eq(loginAttempts.success, false),
          sql`${loginAttempts.createdAt} > now() - interval 24 hour`,
        ),
      ),
    db
      .select({ email: users.email, lockedUntil: userSecurity.lockedUntil, failed: userSecurity.failedCount })
      .from(userSecurity)
      .innerJoin(users, eq(users.id, userSecurity.userId))
      .where(sql`${userSecurity.lockedUntil} > now()`)
      .limit(20),
    db.select().from(userSecurity).where(eq(userSecurity.userId, admin.id)).limit(1),
  ]);

  const backupLeft = ((security[0]?.backupCodes as string[] | null) ?? []).length;

  const cards = [
    {
      icon: ShieldCheck,
      label: "Yönetim adresi",
      value: `/${ADMIN_PATH}`,
      note: "/admin adresi dışarıya 404 döner",
    },
    {
      icon: KeyRound,
      label: "İki adımlı doğrulama",
      value: "Açık",
      note: `${backupLeft} yedek kod kullanılabilir`,
    },
    {
      icon: Monitor,
      label: "Açık oturumların",
      value: String(mySessions.length),
      note: "Şüpheli olanı aşağıdan kapat",
    },
    {
      icon: ShieldAlert,
      label: "Son 24 saatte hatalı giriş",
      value: String(failedCount[0]?.n ?? 0),
      note: lockedUsers.length ? `${lockedUsers.length} hesap kilitli` : "Kilitli hesap yok",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[24px]">Güvenlik</h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Girişler, oturumlar ve panelde yapılan her işlemin kaydı.
        </p>
      </div>

      {/* Özet */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, note }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-muted)]">
              <Icon size={14} strokeWidth={1.7} />
              {label}
            </div>
            <p className="mt-2 break-all text-[19px] font-bold tracking-tight">{value}</p>
            <p className="text-[11.5px] text-[color:var(--color-muted)]">{note}</p>
          </div>
        ))}
      </div>

      {/* Kilitli hesaplar */}
      {lockedUsers.length > 0 && (
        <section>
          <h2 className="mb-3 text-[17px]">Geçici olarak kilitli hesaplar</h2>
          <div className="card overflow-x-auto">
            <table className="table-basic">
              <thead>
                <tr>
                  <th>E-posta</th>
                  <th>Hatalı deneme</th>
                  <th>Kilit bitişi</th>
                </tr>
              </thead>
              <tbody>
                {lockedUsers.map((row) => (
                  <tr key={row.email}>
                    <td>{row.email}</td>
                    <td>{row.failed}</td>
                    <td>{formatDate(row.lockedUntil)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Hesap e-postası */}
      <section>
        <h2 className="mb-3 text-[17px]">Hesap ayarların</h2>
        <p className="mb-3 text-[12.5px] text-[color:var(--color-muted)]">
          Şifreni değiştirmek için <strong>Hesabım → Şifre</strong> ekranını kullan.
        </p>
        <div className="max-w-md">
          <AccountEmailForm currentEmail={admin.email} />
        </div>
      </section>

      {/* Oturumlar */}
      <section>
        <h2 className="mb-3 text-[17px]">Açık oturumların</h2>
        <SessionList
          sessions={mySessions.map((row) => ({
            id: row.id,
            device: describeDevice(row.userAgent ?? ""),
            ip: row.ip ?? "—",
            lastSeen: formatDate(row.lastSeenAt),
            created: formatDate(row.createdAt),
            isCurrent: row.id === active?.session.id,
          }))}
        />
      </section>

      {/* Denetim kaydı */}
      <section>
        <h2 className="mb-3 text-[17px]">Denetim kaydı</h2>
        <p className="mb-3 text-[12.5px] text-[color:var(--color-muted)]">
          Panelde yapılan her değişiklik burada tutulur ve silinemez.
        </p>
        <div className="card overflow-x-auto">
          <table className="table-basic">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Kim</th>
                <th>İşlem</th>
                <th>Ayrıntı</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[color:var(--color-muted)]">
                    Henüz kayıt yok.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-[12px]">{formatDate(log.createdAt)}</td>
                    <td className="text-[12px]">{log.actorEmail ?? "—"}</td>
                    <td className="whitespace-nowrap text-[12px] font-medium">
                      {AUDIT_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="text-[12px] text-[color:var(--color-ink-soft)]">
                      {log.summary ?? "—"}
                    </td>
                    <td className="whitespace-nowrap text-[11.5px] text-[color:var(--color-muted)]">
                      {log.ip ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
