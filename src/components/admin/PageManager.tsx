"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import { pages as pagesTable } from "@/db/schema";
import { deletePageAction, savePageAction, type ContentState } from "@/actions/admin-content";
import { formatDateTime } from "@/lib/utils";

type PageRow = InferSelectModel<typeof pagesTable>;

export default function PageManager({ pages }: { pages: PageRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<PageRow | "new" | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setEditing("new")} className="btn-primary btn-sm">
          <Plus size={14} strokeWidth={1.5} />
          Yeni Sayfa
        </button>
      </div>

      <div className={`card overflow-hidden ${pending ? "opacity-60" : ""}`}>
        <div className="overflow-x-auto">
          <table className="table-basic min-w-[640px]">
            <thead>
              <tr>
                <th>Başlık</th>
                <th>URL</th>
                <th>Güncelleme</th>
                <th>Durum</th>
                <th className="text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[color:var(--color-muted)]">
                    Sayfa yok.
                  </td>
                </tr>
              )}
              {pages.map((page) => (
                <tr key={page.id}>
                  <td className="font-medium">{page.title}</td>
                  <td className="text-[12px] text-[color:var(--color-muted)]">
                    /sayfa/{page.slug}
                  </td>
                  <td className="text-[12px] text-[color:var(--color-muted)]">
                    {formatDateTime(page.updatedAt)}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        page.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {page.isActive ? "Yayında" : "Kapalı"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-0.5">
                      <Link
                        href={`/sayfa/${page.slug}`}
                        target="_blank"
                        className="px-1.5 text-[12px] text-[color:var(--color-brand)]"
                      >
                        Gör
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditing(page)}
                        aria-label="Düzenle"
                        className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
                      >
                        <Pencil size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            await deletePageAction(page.id);
                            router.refresh();
                          })
                        }
                        aria-label="Sil"
                        className="p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-sale)]"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <PageDialog
          page={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function PageDialog({ page, onClose }: { page: PageRow | null; onClose: () => void }) {
  const [state, action, pending] = useActionState<ContentState, FormData>(savePageAction, null);

  if (state?.ok) setTimeout(onClose, 350);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Kapat" />
      <div role="dialog" aria-modal="true" className="relative max-h-[92vh] w-full max-w-[720px] overflow-y-auto bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[19px]">{page ? "Sayfayı Düzenle" : "Yeni Sayfa"}</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form action={action} className="space-y-4">
          {page && <input type="hidden" name="id" value={page.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pg-title">Başlık *</label>
              <input id="pg-title" name="title" required defaultValue={page?.title ?? ""} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="pg-slug">URL (slug)</label>
              <input
                id="pg-slug"
                name="slug"
                defaultValue={page?.slug ?? ""}
                placeholder="otomatik"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="pg-content">İçerik *</label>
            <textarea
              id="pg-content"
              name="content"
              rows={16}
              required
              defaultValue={page?.content ?? ""}
              className="field font-[family-name:var(--font-sans)] text-[13.5px] leading-relaxed"
            />
            <p className="help">Boş satır bırakarak paragraf oluşturabilirsin.</p>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={page?.isActive ?? true}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Yayında
          </label>

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
