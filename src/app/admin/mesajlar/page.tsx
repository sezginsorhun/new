import { desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import MessageActions from "@/components/admin/MessageActions";

export default async function AdminMessagesPage() {
  await requirePermission("messages.manage");
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(200);

  return (
    <div className="max-w-[900px]">
      <h1 className="mb-1 text-[26px]">Mesajlar</h1>
      <p className="mb-6 text-[13px] text-[color:var(--color-muted)]">
        İletişim formundan gelen mesajlar.
      </p>

      {rows.length === 0 ? (
        <p className="card p-10 text-center text-[13px] text-[color:var(--color-muted)]">
          Mesaj yok.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((message) => (
            <div
              key={message.id}
              className={`card p-5 ${!message.isRead ? "border-[color:var(--color-brand)]" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium">{message.subject}</p>
                  <p className="mt-0.5 text-[12.5px] text-[color:var(--color-muted)]">
                    {message.name} ·{" "}
                    <a href={`mailto:${message.email}`} className="underline">
                      {message.email}
                    </a>
                    {message.phone && ` · ${message.phone}`}
                  </p>
                  <p className="text-[11.5px] text-[color:var(--color-muted)]">
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
                {!message.isRead && (
                  <span className="badge bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-dark)]">
                    Yeni
                  </span>
                )}
              </div>

              <p className="mt-3 whitespace-pre-line text-[13px] text-[color:var(--color-ink-soft)]">
                {message.message}
              </p>

              <div className="mt-4 border-t border-[color:var(--color-line)] pt-3">
                <MessageActions
                  id={message.id}
                  isRead={message.isRead}
                  email={message.email}
                  subject={message.subject}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
