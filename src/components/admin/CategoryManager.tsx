"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Category } from "@/db/schema";
import {
  deleteCategoryAction,
  saveCategoryAction,
  type ContentState,
} from "@/actions/admin-content";
import ImageUploader from "./ImageUploader";

export default function CategoryManager({
  categories,
  productCounts,
}: {
  categories: Category[];
  productCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const roots = categories.filter((category) => !category.parentId);

  function remove(id: string, name: string, count: number) {
    if (count > 0) {
      if (
        !window.confirm(
          `"${name}" kategorisinde ${count} ürün var. Kategoriyi silmek ürünleri silmez, sadece bağlantıyı kaldırır. Devam?`,
        )
      ) {
        return;
      }
    }
    startTransition(async () => {
      await deleteCategoryAction(id);
      router.refresh();
    });
  }

  function Row({ category, depth }: { category: Category; depth: number }) {
    const count = productCounts[category.id] ?? 0;
    return (
      <>
        <tr>
          <td>
            <div className="flex items-center gap-2.5" style={{ paddingLeft: depth * 20 }}>
              {depth > 0 && (
                <ChevronRight size={13} strokeWidth={1.5} className="text-[color:var(--color-muted)]" />
              )}
              {category.imageUrl && (
                <div className="relative h-8 w-8 shrink-0 overflow-hidden bg-[#f3ece8]">
                  <Image src={category.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                </div>
              )}
              <span className={depth === 0 ? "font-medium" : ""}>{category.name}</span>
            </div>
          </td>
          <td className="text-[12px] text-[color:var(--color-muted)]">/{category.slug}</td>
          <td className="text-right">{count}</td>
          <td className="text-center text-[12px]">{category.sortOrder}</td>
          <td>
            <span
              className={`badge ${
                category.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {category.isActive ? "Aktif" : "Pasif"}
            </span>
          </td>
          <td>
            <div className="flex items-center justify-end gap-0.5">
              <Link
                href={`/kategori/${category.slug}`}
                target="_blank"
                className="px-1.5 text-[12px] text-[color:var(--color-brand)]"
              >
                Gör
              </Link>
              <button
                type="button"
                onClick={() => setEditing(category)}
                aria-label="Düzenle"
                className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
              >
                <Pencil size={14} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => remove(category.id, category.name, count)}
                aria-label="Sil"
                className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-sale)]"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          </td>
        </tr>
        {categories
          .filter((child) => child.parentId === category.id)
          .map((child) => (
            <Row key={child.id} category={child} depth={depth + 1} />
          ))}
      </>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setEditing("new")} className="btn-primary btn-sm">
          <Plus size={14} strokeWidth={1.5} />
          Yeni Kategori
        </button>
      </div>

      <div className={`card overflow-hidden ${pending ? "opacity-60" : ""}`}>
        <div className="overflow-x-auto">
          <table className="table-basic min-w-[720px]">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>URL</th>
                <th className="text-right">Ürün</th>
                <th className="text-center">Sıra</th>
                <th>Durum</th>
                <th className="text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {roots.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[color:var(--color-muted)]">
                    Kategori yok.
                  </td>
                </tr>
              )}
              {roots.map((root) => (
                <Row key={root.id} category={root} depth={0} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <CategoryDialog
          category={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CategoryDialog({
  category,
  categories,
  onClose,
}: {
  category: Category | null;
  categories: Category[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(
    saveCategoryAction,
    null,
  );
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");

  if (state?.ok) setTimeout(onClose, 350);

  const possibleParents = categories.filter(
    (item) => item.id !== category?.id && !item.parentId,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Kapat" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto bg-white p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[19px]">{category ? "Kategoriyi Düzenle" : "Yeni Kategori"}</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form action={action} className="space-y-4">
          {category && <input type="hidden" name="id" value={category.id} />}
          <input type="hidden" name="imageUrl" value={imageUrl} />

          <div>
            <label className="label" htmlFor="c-name">Kategori adı *</label>
            <input id="c-name" name="name" required defaultValue={category?.name ?? ""} className="field" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-slug">URL (slug)</label>
              <input
                id="c-slug"
                name="slug"
                defaultValue={category?.slug ?? ""}
                placeholder="otomatik"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="c-parent">Üst kategori</label>
              <select
                id="c-parent"
                name="parentId"
                defaultValue={category?.parentId ?? ""}
                className="field"
              >
                <option value="">— Ana kategori —</option>
                {possibleParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>{parent.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="c-desc">Açıklama</label>
            <textarea
              id="c-desc"
              name="description"
              rows={3}
              defaultValue={category?.description ?? ""}
              className="field"
            />
          </div>

          <ImageUploader onPicked={setImageUrl} label="Kategori görseli" />
          {imageUrl && (
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-16 overflow-hidden border border-[color:var(--color-line)] bg-[#f3ece8]">
                <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="text-[12px] text-[color:var(--color-sale)] underline"
              >
                Görseli kaldır
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-sort">Sıra numarası</label>
              <input
                id="c-sort"
                name="sortOrder"
                type="number"
                defaultValue={category?.sortOrder ?? 0}
                className="field"
              />
              <p className="help">Küçük numara önce gösterilir.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={category?.isActive ?? true}
                className="h-4 w-4 accent-[color:var(--color-brand)]"
              />
              Aktif
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
              <input
                type="checkbox"
                name="showInMenu"
                defaultChecked={category?.showInMenu ?? true}
                className="h-4 w-4 accent-[color:var(--color-brand)]"
              />
              Menüde göster
            </label>
          </div>

          <details className="border-t border-[color:var(--color-line)] pt-4">
            <summary className="cursor-pointer text-[13px] font-medium">SEO ayarları</summary>
            <div className="mt-3 space-y-4">
              <div>
                <label className="label" htmlFor="c-metatitle">Sayfa başlığı</label>
                <input
                  id="c-metatitle"
                  name="metaTitle"
                  defaultValue={category?.metaTitle ?? ""}
                  className="field"
                />
              </div>
              <div>
                <label className="label" htmlFor="c-metadesc">Açıklama</label>
                <textarea
                  id="c-metadesc"
                  name="metaDescription"
                  rows={2}
                  defaultValue={category?.metaDescription ?? ""}
                  className="field"
                />
              </div>
            </div>
          </details>

          {state && (
            <p
              className={`text-[13px] ${
                state.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={pending} className="btn-primary flex-1">
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">Vazgeç</button>
          </div>
        </form>
      </div>
    </div>
  );
}
