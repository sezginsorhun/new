"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleCustomerActiveAction } from "@/actions/admin-content";

export default function CustomerActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-end">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await toggleCustomerActiveAction(id, !isActive);
            router.refresh();
          })
        }
        className="btn-ghost text-[12px]"
      >
        {isActive ? "Hesabı kapat" : "Hesabı aç"}
      </button>
    </div>
  );
}
