"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { approveReviewAction, deleteReviewAction } from "@/actions/admin-content";

export default function ReviewActions({
  id,
  isApproved,
}: {
  id: string;
  isApproved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="ml-auto flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await approveReviewAction(id, !isApproved);
            router.refresh();
          })
        }
        className="btn-outline btn-sm"
      >
        {isApproved ? "Yayından kaldır" : "Onayla ve yayınla"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteReviewAction(id);
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
