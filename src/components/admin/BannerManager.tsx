"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Banner } from "@/db/schema";
import {
  deleteBannerAction,
  saveBannerAction,
  type ContentState,
} from "@/actions/admin-content";
import ImageUploader from "./ImageUploader";

export default function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Banner | "new" | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setEditing("new")} className="btn-primary btn-sm">
          <Plus size={14} strokeWidth={1.5} />
          Yeni Banner
        </button>
      </div>

      <div className={`space-y-4 ${pending ? "opacity-60" : ""}`}>
        {banners.length === 0 && (
          <p className="card p-10 text-center text-[13px] text-[color:var(--color-muted)]">
            Banner yok. Anasayfada büyük görsel alanı görünmeyecek.
          </p>
        )}

        {banners.map((banner) => (
          <div key={banner.id} className="card flex flex-wrap gap-4 p-4">
            <div className="relative h-[90px] w-[200px] shrink-0 overflow-hidden bg-[#f3ece8]">
              <Image src={banner.imageUrl} alt="" fill sizes="200px" className="object-cover" />
            </div>
            <div className="min-w-[200px] flex-1">
              <p className="text-[14px] font-medium">{banner.title ?? "(başlıksız)"}</p>
              <p className="text-[12.5px] text-[color:var(--color-muted)]">{banner.subtitle}</p>
              <p className="mt-1.5 text-[12px]">
                Bağlantı: {banner.linkUrl ?? "—"} · Sıra: {banner.sortOrder}
              </p>
              <span
                className={`badge mt-1.5 ${
                  banner.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {banner.isActive ? "Aktif" : "Pasif"}
              </span>
            </div>
            <div className="flex items-start gap-1">
              <button
                type="button"
                onClick={() => setEditing(banner)}
                aria-label="Düzenle"
                className="p-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
              >
                <Pencil size={15} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    await deleteBannerAction(banner.id);
                    router.refresh();
                  })
                }
                aria-label="Sil"
                className="p-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-sale)]"
              >
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <BannerDialog
          banner={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function BannerDialog({ banner, onClose }: { banner: Banner | null; onClose: () => void }) {
  const [state, action, pending] = useActionState<ContentState, FormData>(
    saveBannerAction,
    null,
  );
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? "");

  if (state?.ok) setTimeout(onClose, 350);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Kapat" />
      <div role="dialog" aria-modal="true" className="relative max-h-[90vh] w-full max-w-[540px] overflow-y-auto bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[19px]">{banner ? "Bannerı Düzenle" : "Yeni Banner"}</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="p-1">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <form action={action} className="space-y-4">
          {banner && <input type="hidden" name="id" value={banner.id} />}
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <input type="hidden" name="position" value="home_hero" />

          <ImageUploader onPicked={setImageUrl} label="Banner görseli *" />
          {imageUrl && (
            <div className="relative h-[110px] w-full overflow-hidden border border-[color:var(--color-line)] bg-[#f3ece8]">
              <Image src={imageUrl} alt="" fill sizes="500px" className="object-cover" />
            </div>
          )}

          <div>
            <label className="label" htmlFor="b-title">Başlık</label>
            <input id="b-title" name="title" defaultValue={banner?.title ?? ""} className="field" />
          </div>

          <div>
            <label className="label" htmlFor="b-sub">Üst yazı</label>
            <input
              id="b-sub"
              name="subtitle"
              defaultValue={banner?.subtitle ?? ""}
              placeholder="Yeni sezon"
              className="field"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="b-link">Bağlantı adresi</label>
              <input
                id="b-link"
                name="linkUrl"
                defaultValue={banner?.linkUrl ?? ""}
                placeholder="/kategori/kadin"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="b-button">Buton yazısı</label>
              <input
                id="b-button"
                name="buttonLabel"
                defaultValue={banner?.buttonLabel ?? ""}
                placeholder="Keşfet"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="b-sort">Sıra</label>
            <input
              id="b-sort"
              name="sortOrder"
              type="number"
              defaultValue={banner?.sortOrder ?? 0}
              className="field !w-[120px]"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={banner?.isActive ?? true}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Aktif
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
