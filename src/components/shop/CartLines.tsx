"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import { removeCartItemAction, updateCartItemAction } from "@/actions/cart";

export default function CartLines({ lines }: { lines: CartLine[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeQuantity(itemId: string, quantity: number) {
    startTransition(async () => {
      await updateCartItemAction(itemId, quantity);
      router.refresh();
    });
  }

  function remove(itemId: string) {
    startTransition(async () => {
      await removeCartItemAction(itemId);
      router.refresh();
    });
  }

  return (
    <ul className={`divide-y divide-[color:var(--color-line)] ${pending ? "opacity-60" : ""}`}>
      {lines.map((line) => (
        <li key={line.itemId} className="flex gap-4 py-5 first:pt-0">
          <Link
            href={`/urun/${line.productSlug}`}
            className="relative h-[120px] w-[90px] shrink-0 overflow-hidden bg-[#f3ece8]"
          >
            {line.imageUrl && (
              <Image
                src={line.imageUrl}
                alt={line.productName}
                fill
                sizes="90px"
                className="object-cover"
              />
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/urun/${line.productSlug}`}
                  className="text-[14px] font-medium leading-snug hover:text-[color:var(--color-brand)]"
                >
                  {line.productName}
                </Link>
                <p className="mt-1 flex items-center gap-2 text-[12.5px] text-[color:var(--color-muted)]">
                  <span
                    className="inline-block h-3 w-3 rounded-full ring-1 ring-[color:var(--color-line-strong)]"
                    style={{ backgroundColor: line.colorHex }}
                  />
                  {line.colorName} / {line.size}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[color:var(--color-muted)]">
                  Kod: {line.sku}
                </p>
              </div>

              <button
                type="button"
                onClick={() => remove(line.itemId)}
                disabled={pending}
                aria-label="Ürünü sepetten çıkar"
                className="h-8 shrink-0 p-1.5 text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-sale)]"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center border border-[color:var(--color-line-strong)] bg-white">
                <button
                  type="button"
                  onClick={() => changeQuantity(line.itemId, line.quantity - 1)}
                  disabled={pending || line.quantity <= 1}
                  className="px-2.5 py-2 disabled:opacity-35"
                  aria-label="Adeti azalt"
                >
                  <Minus size={13} strokeWidth={1.5} />
                </button>
                <span className="w-8 text-center text-[13px] font-medium">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => changeQuantity(line.itemId, line.quantity + 1)}
                  disabled={pending || line.quantity >= line.stock}
                  className="px-2.5 py-2 disabled:opacity-35"
                  aria-label="Adeti arttır"
                >
                  <Plus size={13} strokeWidth={1.5} />
                </button>
              </div>

              <div className="text-right">
                <p className="text-[15px] font-semibold">{formatPrice(line.lineTotal)}</p>
                {line.quantity > 1 && (
                  <p className="text-[11.5px] text-[color:var(--color-muted)]">
                    Birim {formatPrice(line.unitPrice)}
                  </p>
                )}
              </div>
            </div>

            {line.stock <= 3 && (
              <p className="mt-2 text-[11.5px] text-[color:var(--color-sale)]">
                Stokta son {line.stock} adet
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
