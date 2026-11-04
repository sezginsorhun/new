"use client";

import { adminUrl } from "@/lib/admin-path";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { deleteProductAction, toggleProductActiveAction } from "@/actions/admin-products";

export default function ProductRowActions({
  id,
  slug,
  isActive,
  name,
}: {
  id: string;
  slug: string;
  isActive: boolean;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        href={`/urun/${slug}`}
        target="_blank"
        title="Sitede gör"
        className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
      >
        <ExternalLink size={15} strokeWidth={1.5} />
      </Link>

      <button
        type="button"
        disabled={pending}
        title={isActive ? "Yayından kaldır" : "Yayına al"}
        onClick={() =>
          startTransition(async () => {
            await toggleProductActiveAction(id, !isActive);
            router.refresh();
          })
        }
        className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
      >
        {isActive ? <Eye size={15} strokeWidth={1.5} /> : <EyeOff size={15} strokeWidth={1.5} />}
      </button>

      <Link
        href={adminUrl(`urunler/${id}`)}
        title="Düzenle"
        className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
      >
        <Pencil size={15} strokeWidth={1.5} />
      </Link>

      {confirming ? (
        <span className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteProductAction(id);
                setConfirming(false);
                router.refresh();
              })
            }
            className="bg-[color:var(--color-sale)] px-2 py-1 text-[11px] text-white"
          >
            Sil
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="px-1.5 py-1 text-[11px] text-[color:var(--color-muted)]"
          >
            Vazgeç
          </button>
        </span>
      ) : (
        <button
          type="button"
          title={`${name} ürününü sil`}
          onClick={() => setConfirming(true)}
          className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-sale)]"
        >
          <Trash2 size={15} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
