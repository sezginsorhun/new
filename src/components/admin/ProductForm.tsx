"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Product } from "@/db/schema";
import { saveProductAction, type AdminState } from "@/actions/admin-products";
import { formatAmount } from "@/lib/money";

export default function ProductForm({
  product,
  categories,
  selectedCategoryIds,
}: {
  product: Product | null;
  categories: Category[];
  selectedCategoryIds: string[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<AdminState, FormData>(
    saveProductAction,
    null,
  );

  const [tab, setTab] = useState<"genel" | "fiyat" | "seo">("genel");

  // Yeni ürün kaydedilince düzenleme sayfasına geç
  useEffect(() => {
    if (state?.ok && state.id && !product) {
      router.push(`/admin/urunler/${state.id}`);
    }
  }, [state, product, router]);

  const roots = categories.filter((category) => !category.parentId);

  return (
    <form action={action} className="space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}

      {/* Sekmeler */}
      <div className="flex gap-1 border-b border-[color:var(--color-line)]">
        {(
          [
            ["genel", "Genel Bilgiler"],
            ["fiyat", "Fiyat ve Stok"],
            ["seo", "SEO"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`border-b-2 px-4 py-2.5 text-[12.5px] font-medium transition-colors ${
              tab === id
                ? "border-[color:var(--color-ink)]"
                : "border-transparent text-[color:var(--color-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* --------------------------- GENEL --------------------------- */}
      <div className={tab === "genel" ? "space-y-5" : "hidden"}>
        <div className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="pf-name">Ürün adı *</label>
            <input
              id="pf-name"
              name="name"
              required
              defaultValue={product?.name ?? ""}
              className="field"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pf-sku">Ürün kodu (SKU) *</label>
              <input
                id="pf-sku"
                name="sku"
                required
                defaultValue={product?.sku ?? ""}
                placeholder="ALN-1001"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="pf-slug">URL (slug)</label>
              <input
                id="pf-slug"
                name="slug"
                defaultValue={product?.slug ?? ""}
                placeholder="boş bırakırsan üründen üretilir"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="pf-short">Kısa açıklama</label>
            <input
              id="pf-short"
              name="shortDescription"
              defaultValue={product?.shortDescription ?? ""}
              maxLength={250}
              className="field"
            />
            <p className="help">Ürün kartlarında ve listelerde görünür.</p>
          </div>

          <div>
            <label className="label" htmlFor="pf-desc">Ürün açıklaması</label>
            <textarea
              id="pf-desc"
              name="description"
              rows={7}
              defaultValue={product?.description ?? ""}
              className="field"
            />
            <p className="help">Satır atlayarak paragraf oluşturabilirsin.</p>
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <h3 className="text-[14px] font-semibold">Kumaş ve Model Bilgisi</h3>
          <div>
            <label className="label" htmlFor="pf-material">Kumaş içeriği</label>
            <input
              id="pf-material"
              name="material"
              defaultValue={product?.material ?? ""}
              placeholder="%95 Pamuk %5 Elastan"
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="pf-care">Yıkama ve bakım</label>
            <textarea
              id="pf-care"
              name="careInfo"
              rows={3}
              defaultValue={product?.careInfo ?? ""}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="pf-model">Model ölçüleri</label>
            <input
              id="pf-model"
              name="modelInfo"
              defaultValue={product?.modelInfo ?? ""}
              placeholder="Modelin ölçüleri: 1.74 m, 60 kg. Üzerindeki beden: M"
              className="field"
            />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-[14px] font-semibold">Kategoriler</h3>
          <div className="space-y-3">
            {roots.map((root) => {
              const children = categories.filter((c) => c.parentId === root.id);
              return (
                <div key={root.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium">
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={root.id}
                      defaultChecked={selectedCategoryIds.includes(root.id)}
                      className="h-4 w-4 accent-[color:var(--color-brand)]"
                    />
                    {root.name}
                  </label>
                  {children.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5 pl-6">
                      {children.map((child) => (
                        <label
                          key={child.id}
                          className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[color:var(--color-ink-soft)]"
                        >
                          <input
                            type="checkbox"
                            name="categoryIds"
                            value={child.id}
                            defaultChecked={selectedCategoryIds.includes(child.id)}
                            className="h-3.5 w-3.5 accent-[color:var(--color-brand)]"
                          />
                          {child.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --------------------------- FİYAT --------------------------- */}
      <div className={tab === "fiyat" ? "space-y-5" : "hidden"}>
        <div className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="pf-price">Satış fiyatı (TL) *</label>
              <input
                id="pf-price"
                name="price"
                required
                inputMode="decimal"
                defaultValue={product ? formatAmount(product.price) : ""}
                placeholder="299,90"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="pf-compare">Eski fiyat (TL)</label>
              <input
                id="pf-compare"
                name="compareAtPrice"
                inputMode="decimal"
                defaultValue={product?.compareAtPrice ? formatAmount(product.compareAtPrice) : ""}
                placeholder="399,90"
                className="field"
              />
              <p className="help">Doldurursan üstü çizili görünür ve indirim yüzdesi hesaplanır.</p>
            </div>
            <div>
              <label className="label" htmlFor="pf-cost">Alış maliyeti (TL)</label>
              <input
                id="pf-cost"
                name="costPrice"
                inputMode="decimal"
                defaultValue={product?.costPrice ? formatAmount(product.costPrice) : ""}
                className="field"
              />
              <p className="help">Sadece panelde görünür, müşteriye gösterilmez.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pf-tax">KDV oranı (%)</label>
              <input
                id="pf-tax"
                name="taxRate"
                type="number"
                min={0}
                max={50}
                defaultValue={product?.taxRate ?? 10}
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="pf-weight">Ağırlık (gram)</label>
              <input
                id="pf-weight"
                name="weightGr"
                type="number"
                min={0}
                defaultValue={product?.weightGr ?? ""}
                className="field"
              />
            </div>
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <h3 className="text-[14px] font-semibold">Yayın Durumu</h3>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Sitede yayında
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product?.isFeatured ?? false}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Anasayfada &quot;öne çıkan&quot; bölümünde göster
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="isNew"
              defaultChecked={product?.isNew ?? false}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            &quot;Yeni&quot; etiketi göster
          </label>
        </div>
      </div>

      {/* ---------------------------- SEO ---------------------------- */}
      <div className={tab === "seo" ? "space-y-5" : "hidden"}>
        <div className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="pf-metatitle">Sayfa başlığı (title)</label>
            <input
              id="pf-metatitle"
              name="metaTitle"
              maxLength={200}
              defaultValue={product?.metaTitle ?? ""}
              className="field"
            />
            <p className="help">Boş bırakırsan ürün adı kullanılır. 50-60 karakter ideal.</p>
          </div>
          <div>
            <label className="label" htmlFor="pf-metadesc">Açıklama (description)</label>
            <textarea
              id="pf-metadesc"
              name="metaDescription"
              rows={3}
              maxLength={300}
              defaultValue={product?.metaDescription ?? ""}
              className="field"
            />
            <p className="help">Google&apos;da başlığın altında görünen metin. 150-160 karakter ideal.</p>
          </div>
        </div>
      </div>

      {/* Kaydet */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-[color:var(--color-line)] bg-white px-4 py-3 sm:mx-0 sm:rounded">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Kaydediliyor..." : product ? "Değişiklikleri Kaydet" : "Ürünü Oluştur"}
        </button>
        {state && (
          <p
            role="status"
            className={`text-[13px] ${
              state.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
