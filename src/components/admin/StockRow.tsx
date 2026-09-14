"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateStockAction } from "@/actions/admin-products";

export default function StockRow({
  row,
}: {
  row: {
    id: string;
    sku: string;
    size: string;
    colorName: string;
    colorHex: string;
    stock: number;
    lowStockAlert: number;
    productId: string;
    productName: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(row.stock);
  const [saved, setSaved] = useState(false);

  const dirty = value !== row.stock;

  return (
    <tr className={pending ? "opacity-60" : ""}>
      <td>
        <Link
          href={`/admin/urunler/${row.productId}`}
          className="hover:text-[color:var(--color-brand)]"
        >
          {row.productName}
        </Link>
      </td>
      <td className="text-[12.5px]">
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full ring-1 ring-[color:var(--color-line-strong)]"
            style={{ backgroundColor: row.colorHex }}
          />
          {row.colorName} / {row.size}
        </span>
      </td>
      <td className="text-[11.5px] text-[color:var(--color-muted)]">{row.sku}</td>
      <td>
        <div className="flex items-center justify-end gap-2">
          {row.stock === 0 && !dirty && (
            <span className="badge bg-red-50 text-[color:var(--color-sale)]">Tükendi</span>
          )}
          {row.stock > 0 && row.stock <= row.lowStockAlert && !dirty && (
            <span className="badge bg-amber-50 text-amber-700">Kritik</span>
          )}
          <input
            type="number"
            min={0}
            value={value}
            onChange={(event) => {
              setValue(Number(event.target.value));
              setSaved(false);
            }}
            className="field !w-[80px] !py-1.5 text-right text-[13px]"
            aria-label={`${row.productName} ${row.colorName} ${row.size} stoğu`}
          />
          <button
            type="button"
            disabled={pending || !dirty}
            onClick={() =>
              startTransition(async () => {
                await updateStockAction(row.id, value);
                setSaved(true);
                router.refresh();
              })
            }
            className="btn-outline btn-sm"
          >
            {saved && !dirty ? <Check size={13} strokeWidth={2} /> : "Kaydet"}
          </button>
        </div>
      </td>
    </tr>
  );
}
