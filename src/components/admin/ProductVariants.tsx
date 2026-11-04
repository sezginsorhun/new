"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Wand2, X } from "lucide-react";
import type { ProductVariant } from "@/db/schema";
import {
  deleteVariantAction,
  generateVariantsAction,
  saveVariantAction,
  type AdminState,
} from "@/actions/admin-products";
import { formatAmount } from "@/lib/money";

const SIZE_PRESETS: Record<string, string[]> = {
  "Harf (S-XL)": ["S", "M", "L", "XL"],
  "Sütyen": ["70B", "75B", "75C", "80B", "80C", "85C"],
  "Numara": ["36", "38", "40", "42"],
  "Çorap": ["1", "2", "3", "4"],
};

const COLOR_PRESETS = [
  { name: "Siyah", hex: "#1f1b1d" },
  { name: "Beyaz", hex: "#f7f4f1" },
  { name: "Pudra", hex: "#e6c3ba" },
  { name: "Bordo", hex: "#6b2733" },
  { name: "Vizon", hex: "#c9ae99" },
  { name: "Lacivert", hex: "#26304a" },
  { name: "Gri", hex: "#9d9793" },
  { name: "Krem", hex: "#eee3d2" },
  { name: "Yeşil", hex: "#3a5145" },
  { name: "Mavi", hex: "#9cb9cd" },
];

export default function ProductVariants({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ProductVariant | "new" | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Renklere göre grupla
  const byColor = new Map<string, ProductVariant[]>();
  for (const variant of variants) {
    const list = byColor.get(variant.colorName) ?? [];
    list.push(variant);
    byColor.set(variant.colorName, list);
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Beden ve Renk Varyantları</h3>
          <p className="text-[12px] text-[color:var(--color-muted)]">
            Stok bilgisi varyant seviyesinde tutulur. {variants.length} varyant.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setBulkOpen(true)} className="btn-outline btn-sm">
            <Wand2 size={13} strokeWidth={1.5} />
            Toplu Oluştur
          </button>
          <button type="button" onClick={() => setEditing("new")} className="btn-primary btn-sm">
            <Plus size={13} strokeWidth={1.5} />
            Varyant Ekle
          </button>
        </div>
      </div>

      {variants.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-[color:var(--color-muted)]">
          Henüz varyant yok. Ürünün satılabilmesi için en az bir beden/renk eklemelisin.
        </p>
      ) : (
        <div className={`space-y-5 ${pending ? "opacity-60" : ""}`}>
          {[...byColor].map(([colorName, list]) => (
            <div key={colorName}>
              <p className="mb-2 flex items-center gap-2 text-[12.5px] font-medium">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-[color:var(--color-line-strong)]"
                  style={{ backgroundColor: list[0].colorHex }}
                />
                {colorName}
              </p>
              <div className="overflow-x-auto">
                <table className="table-basic min-w-[560px]">
                  <thead>
                    <tr>
                      <th>Beden</th>
                      <th>SKU</th>
                      <th className="text-right">Stok</th>
                      <th className="text-right">Fiyat farkı</th>
                      <th>Durum</th>
                      <th className="text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((variant) => (
                      <tr key={variant.id}>
                        <td className="font-medium">{variant.size}</td>
                        <td className="text-[11.5px] text-[color:var(--color-muted)]">
                          {variant.sku}
                        </td>
                        <td className="text-right">
                          <span
                            className={`badge ${
                              variant.stock === 0
                                ? "bg-red-50 text-[color:var(--color-sale)]"
                                : variant.stock <= variant.lowStockAlert
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {variant.stock}
                          </span>
                        </td>
                        <td className="text-right text-[12px]">
                          {variant.priceOverride
                            ? `${formatAmount(variant.priceOverride)} TL`
                            : "—"}
                        </td>
                        <td className="text-[12px]">
                          {variant.isActive ? "Aktif" : "Pasif"}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setEditing(variant)}
                            className="px-1.5 text-[12px] text-[color:var(--color-brand)]"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              startTransition(async () => {
                                await deleteVariantAction(variant.id, productId);
                                router.refresh();
                              })
                            }
                            aria-label="Varyantı sil"
                            className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-sale)]"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <VariantDialog
          productId={productId}
          variant={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {bulkOpen && (
        <BulkDialog
          productId={productId}
          onClose={() => {
            setBulkOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------ TEK VARYANT ----------------------------- */

function VariantDialog({
  productId,
  variant,
  onClose,
}: {
  productId: string;
  variant: ProductVariant | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    saveVariantAction,
    null,
  );
  const [hex, setHex] = useState(variant?.colorHex ?? "#1f1b1d");

  if (state?.ok) setTimeout(onClose, 350);

  return (
    <Dialog title={variant ? "Varyantı Düzenle" : "Yeni Varyant"} onClose={onClose}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="productId" value={productId} />
        {variant && <input type="hidden" name="variantId" value={variant.id} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="v-size">Beden *</label>
            <input
              id="v-size"
              name="size"
              required
              defaultValue={variant?.size ?? ""}
              placeholder="M / 75B / 38"
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="v-color">Renk adı *</label>
            <input
              id="v-color"
              name="colorName"
              required
              defaultValue={variant?.colorName ?? ""}
              placeholder="Siyah"
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="v-hex">Renk kodu</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={hex}
              onChange={(event) => setHex(event.target.value)}
              className="h-10 w-14 cursor-pointer border border-[color:var(--color-line-strong)]"
              aria-label="Renk seç"
            />
            <input
              id="v-hex"
              name="colorHex"
              value={hex}
              onChange={(event) => setHex(event.target.value)}
              className="field !w-[140px]"
            />
            <div className="flex flex-wrap gap-1">
              {COLOR_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  title={preset.name}
                  onClick={() => setHex(preset.hex)}
                  className="h-6 w-6 rounded-full ring-1 ring-[color:var(--color-line-strong)]"
                  style={{ backgroundColor: preset.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="v-stock">Stok adedi *</label>
            <input
              id="v-stock"
              name="stock"
              type="number"
              min={0}
              required
              defaultValue={variant?.stock ?? 0}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="v-low">Kritik stok uyarısı</label>
            <input
              id="v-low"
              name="lowStockAlert"
              type="number"
              min={0}
              defaultValue={variant?.lowStockAlert ?? 3}
              className="field"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="v-price">Özel fiyat (TL)</label>
            <input
              id="v-price"
              name="priceOverride"
              inputMode="decimal"
              defaultValue={variant?.priceOverride ? formatAmount(variant.priceOverride) : ""}
              className="field"
            />
            <p className="help">Boş bırakırsan ürün fiyatı geçerli olur.</p>
          </div>
          <div>
            <label className="label" htmlFor="v-barcode">Barkod</label>
            <input
              id="v-barcode"
              name="barcode"
              defaultValue={variant?.barcode ?? ""}
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="v-sku">Varyant kodu (SKU)</label>
          <input
            id="v-sku"
            name="sku"
            defaultValue={variant?.sku ?? ""}
            placeholder="boş bırakırsan otomatik üretilir"
            className="field"
          />
        </div>

        {state && (
          <p
            className={`text-[13px] ${
              state.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
            }`}
          >
            {state.message}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={pending} className="btn-primary flex-1">
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button type="button" onClick={onClose} className="btn-outline">Vazgeç</button>
        </div>
      </form>
    </Dialog>
  );
}

/* ------------------------------ TOPLU ----------------------------------- */

function BulkDialog({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [sizes, setSizes] = useState<string[]>(SIZE_PRESETS["Harf (S-XL)"]);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [stock, setStock] = useState(10);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Dialog title="Toplu Varyant Oluştur" onClose={onClose}>
      <p className="mb-4 text-[12.5px] text-[color:var(--color-ink-soft)]">
        Seçtiğin her renk için seçtiğin tüm bedenler oluşturulur. Zaten var olan
        kombinasyonlar atlanır.
      </p>

      <div className="space-y-5">
        <div>
          <span className="label">Beden seti</span>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {Object.entries(SIZE_PRESETS).map(([label, preset]) => (
              <button
                key={label}
                type="button"
                onClick={() => setSizes(preset)}
                className={`border px-2.5 py-1.5 text-[12px] ${
                  sizes.join() === preset.join()
                    ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
                    : "border-[color:var(--color-line-strong)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={sizes.join(", ")}
            onChange={(event) =>
              setSizes(
                event.target.value
                  .split(",")
                  .map((size) => size.trim())
                  .filter(Boolean),
              )
            }
            className="field text-[13px]"
            aria-label="Bedenler"
          />
          <p className="help">Virgülle ayırarak düzenleyebilirsin.</p>
        </div>

        <div>
          <span className="label">Renkler</span>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => {
              const active = colors.some((color) => color.name === preset.name);
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() =>
                    setColors((current) =>
                      active
                        ? current.filter((color) => color.name !== preset.name)
                        : [...current, preset],
                    )
                  }
                  className={`flex items-center gap-2 border px-2.5 py-1.5 text-[12px] ${
                    active
                      ? "border-[color:var(--color-ink)] bg-[color:var(--color-cream)]"
                      : "border-[color:var(--color-line-strong)]"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full ring-1 ring-[color:var(--color-line-strong)]"
                    style={{ backgroundColor: preset.hex }}
                  />
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="bulk-stock">Her varyant için başlangıç stoğu</label>
          <input
            id="bulk-stock"
            type="number"
            min={0}
            value={stock}
            onChange={(event) => setStock(Number(event.target.value))}
            className="field !w-[140px]"
          />
        </div>

        <p className="text-[12.5px] text-[color:var(--color-ink-soft)]">
          Oluşturulacak varyant sayısı: <strong>{sizes.length * colors.length}</strong>
        </p>

        {message && <p className="text-[13px] text-[color:var(--color-success)]">{message}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            disabled={pending || colors.length === 0 || sizes.length === 0}
            onClick={() =>
              startTransition(async () => {
                const result = await generateVariantsAction(productId, colors, sizes, stock);
                setMessage(result.message);
                if (result.ok) setTimeout(onClose, 700);
              })
            }
            className="btn-primary flex-1"
          >
            {pending ? "Oluşturuluyor..." : "Oluştur"}
          </button>
          <button type="button" onClick={onClose} className="btn-outline">Vazgeç</button>
        </div>
      </div>
    </Dialog>
  );
}

/* ------------------------------- DIALOG --------------------------------- */

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Kapat" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto bg-white p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[19px]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
