"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteMessageAction, markMessageReadAction } from "@/actions/admin-content";

export default function MessageActions({
  id,
  isRead,
  email,
  subject,
}: {
  id: number;
  isRead: boolean;
  email: string;
  subject: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`mailto:${email}?subject=${encodeURIComponent(`Yanıt: ${subject}`)}`}
        className="btn-outline btn-sm"
      >
        E-posta ile yanıtla
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await markMessageReadAction(id, !isRead);
            router.refresh();
          })
        }
        className="btn-ghost"
      >
        {isRead ? "Okunmadı işaretle" : "Okundu işaretle"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteMessageAction(id);
            router.refresh();
          })
        }
        className="btn-ghost text-[color:var(--color-sale)]"
      >
        Sil
      </button>
    </div>
  );
}
