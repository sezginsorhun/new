"use client";

/**
 * AÇIK OTURUMLAR
 * Her satır bir cihazdır. "Kapat" dendiğinde ilgili oturum anında geçersiz
 * olur — o cihazdaki çerez artık işe yaramaz.
 */

import { useState, useTransition } from "react";
import { Monitor, LogOut } from "lucide-react";
import { revokeSessionAction, revokeAllSessionsAction } from "@/actions/auth";

export type SessionRow = {
  id: string;
  device: string;
  ip: string;
  lastSeen: string;
  created: string;
  isCurrent: boolean;
};

export default function SessionList({ sessions }: { sessions: SessionRow[] }) {
  const [rows, setRows] = useState(sessions);
  const [pending, startTransition] = useTransition();
  const [armed, setArmed] = useState(false);

  return (
    <div className="space-y-3">
      <div className="card divide-y divide-[color:var(--color-line)]">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <Monitor size={17} strokeWidth={1.5} className="text-[color:var(--color-muted)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium">
                {row.device}
                {row.isCurrent && <span className="badge badge-ok ml-2">Bu cihaz</span>}
              </p>
              <p className="text-[12px] text-[color:var(--color-muted)]">
                IP {row.ip} · Son görülme {row.lastSeen} · Açılış {row.created}
              </p>
            </div>
            {!row.isCurrent && (
              <form
                action={(formData) =>
                  startTransition(async () => {
                    await revokeSessionAction(formData);
                    setRows((list) => list.filter((item) => item.id !== row.id));
                  })
                }
              >
                <input type="hidden" name="sessionId" value={row.id} />
                <button type="submit" className="btn-ghost btn-sm" disabled={pending}>
                  Kapat
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {rows.length > 1 && (
        <button
          type="button"
          disabled={pending}
          className={armed ? "btn-brand btn-sm" : "btn-outline btn-sm"}
          onClick={() => {
            if (!armed) {
              setArmed(true);
              setTimeout(() => setArmed(false), 4000);
              return;
            }
            startTransition(async () => {
              await revokeAllSessionsAction();
              setRows((list) => list.filter((item) => item.isCurrent));
              setArmed(false);
            });
          }}
        >
          <LogOut size={14} strokeWidth={1.7} />
          {armed ? "Emin misin? Tekrar bas" : "Diğer tüm cihazlardan çıkış yap"}
        </button>
      )}
    </div>
  );
}
