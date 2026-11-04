"use client";

/**
 * CAROUSEL SLAYT YÖNETİCİSİ
 *
 * Slayt ekle / çıkar / sırala / gizle. Her slaytta masaüstü ve mobil için
 * ayrı görsel, başlık, açıklama, iki buton, hizalama, karartma ve yayın
 * tarihi vardır. Görseller medya kütüphanesinden seçilir veya yüklenir.
 */

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import {
  ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2,
} from "lucide-react";
import {
  deleteSlideAction,
  moveSlideAction,
  saveSlideAction,
  toggleSlideAction,
  type ContentState,
} from "@/actions/admin-home";
import MediaPicker from "./MediaPicker";

export type Slide = {
  id: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  imageAlt: string | null;
  linkUrl: string | null;
  buttonLabel: string | null;
  secondaryLabel: string | null;
  secondaryUrl: string | null;
  align: string;
  theme: string;
  overlay: number;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

function toInputDate(value: Date | null): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(
    value.getHours(),
  )}:${pad(value.getMinutes())}`;
}

export default function SlideManager({ slides }: { slides: Slide[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  function run(promise: Promise<ContentState>) {
    startTransition(async () => {
      const result = await promise;
      if (result?.message) setNotice(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[color:var(--color-muted)]">
          {slides.length} slayt · {slides.filter((s) => s.isActive).length} tanesi yayında
        </p>
        <button type="button" className="btn-primary btn-sm" onClick={() => setAdding((v) => !v)}>
          <Plus size={14} strokeWidth={2} />
          {adding ? "Vazgeç" : "Yeni slayt"}
        </button>
      </div>

      {notice && (
        <p role="status" className="card bg-[color:var(--color-surface-2)] px-4 py-2.5 text-[13px]">
          {notice}
        </p>
      )}

      {adding && (
        <div className="card p-4">
          <h2 className="mb-4 text-[17px]">Yeni slayt</h2>
          <SlideForm onSaved={() => setAdding(false)} />
        </div>
      )}

      {slides.length === 0 && !adding ? (
        <div className="card p-10 text-center text-[13.5px] text-[color:var(--color-muted)]">
          Henüz slayt yok. “Yeni slayt” ile ilk görselini ekle.
        </div>
      ) : (
        <ol className="space-y-2.5">
          {slides.map((slide, index) => (
            <li key={slide.id} className="card">
              <div className="flex flex-wrap items-center gap-3 p-3">
                <div className="relative h-[54px] w-[96px] shrink-0 overflow-hidden bg-[color:var(--color-surface-2)]">
                  <Image src={slide.imageUrl} alt="" fill sizes="96px" className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
                    {slide.title || "(başlıksız slayt)"}
                    {!slide.isActive && <span className="badge badge-mute">Gizli</span>}
                    {slide.startsAt && new Date(slide.startsAt) > new Date() && (
                      <span className="badge badge-warn">Planlı</span>
                    )}
                    {slide.endsAt && new Date(slide.endsAt) < new Date() && (
                      <span className="badge badge-bad">Süresi doldu</span>
                    )}
                  </p>
                  <p className="truncate text-[12px] text-[color:var(--color-muted)]">
                    {slide.subtitle || slide.eyebrow || slide.linkUrl || "—"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Yukarı taşı" disabled={index === 0 || pending}
                    className="btn-ghost btn-sm" onClick={() => run(moveSlideAction(slide.id, "up"))}>
                    <ChevronUp size={15} strokeWidth={1.8} />
                  </button>
                  <button type="button" aria-label="Aşağı taşı" disabled={index === slides.length - 1 || pending}
                    className="btn-ghost btn-sm" onClick={() => run(moveSlideAction(slide.id, "down"))}>
                    <ChevronDown size={15} strokeWidth={1.8} />
                  </button>
                  <button type="button" className="btn-ghost btn-sm" disabled={pending}
                    onClick={() => run(toggleSlideAction(slide.id, !slide.isActive))}>
                    {slide.isActive ? (
                      <><EyeOff size={14} strokeWidth={1.6} /> Gizle</>
                    ) : (
                      <><Eye size={14} strokeWidth={1.6} /> Yayına al</>
                    )}
                  </button>
                  <button type="button" className="btn-outline btn-sm"
                    onClick={() => setOpenId(openId === slide.id ? null : slide.id)}>
                    {openId === slide.id ? "Kapat" : "Düzenle"}
                  </button>
                  <DeleteButton disabled={pending} onConfirm={() => run(deleteSlideAction(slide.id))} />
                </div>
              </div>

              {openId === slide.id && (
                <div className="border-t border-[color:var(--color-line)] p-4">
                  <SlideForm slide={slide} onSaved={() => setOpenId(null)} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function DeleteButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      className={armed ? "btn-sm btn-brand" : "btn-ghost btn-sm"}
      onClick={() => {
        if (armed) onConfirm();
        else {
          setArmed(true);
          setTimeout(() => setArmed(false), 4000);
        }
      }}
    >
      <Trash2 size={14} strokeWidth={1.6} />
      {armed ? "Emin misin?" : "Sil"}
    </button>
  );
}

function SlideForm({ slide, onSaved }: { slide?: Slide; onSaved?: () => void }) {
  const [state, action, pending] = useActionState<ContentState, FormData>(
    async (prev, formData) => {
      const result = await saveSlideAction(prev, formData);
      if (result?.ok) onSaved?.();
      return result;
    },
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {slide && <input type="hidden" name="id" value={slide.id} />}
      <input type="hidden" name="position" value={slide?.position ?? "home_hero"} />

      <div className="grid gap-4 sm:grid-cols-2">
        <MediaPicker
          name="imageUrl"
          label="Masaüstü görseli"
          required
          value={slide?.imageUrl}
          hint="Geniş ve yüksek çözünürlüklü olsun (ör. 2000×900). JPG/WEBP önerilir."
        />
        <MediaPicker
          name="mobileImageUrl"
          label="Mobil görseli"
          value={slide?.mobileImageUrl}
          hint="Boş bırakırsan mobilde de masaüstü görseli kullanılır."
        />
      </div>

      <div>
        <label className="label">Görsel açıklaması (erişilebilirlik ve SEO)</label>
        <input name="imageAlt" defaultValue={slide?.imageAlt ?? ""} className="field"
          placeholder="Dantelli siyah takım giyen model" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Üst yazı</label>
          <input name="eyebrow" defaultValue={slide?.eyebrow ?? ""} className="field" placeholder="Yeni sezon" />
        </div>
        <div>
          <label className="label">Başlık</label>
          <input name="title" defaultValue={slide?.title ?? ""} className="field" placeholder="Dantel koleksiyonu" />
        </div>
      </div>

      <div>
        <label className="label">Açıklama</label>
        <input name="subtitle" defaultValue={slide?.subtitle ?? ""} className="field" />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="label">Ana buton yazısı</label>
          <input name="buttonLabel" defaultValue={slide?.buttonLabel ?? ""} className="field" placeholder="Keşfet" />
        </div>
        <div>
          <label className="label">Ana buton adresi</label>
          <input name="linkUrl" defaultValue={slide?.linkUrl ?? ""} className="field" placeholder="/kategori/kadin" />
        </div>
        <div>
          <label className="label">İkinci buton yazısı</label>
          <input name="secondaryLabel" defaultValue={slide?.secondaryLabel ?? ""} className="field" />
        </div>
        <div>
          <label className="label">İkinci buton adresi</label>
          <input name="secondaryUrl" defaultValue={slide?.secondaryUrl ?? ""} className="field" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="label">Hizalama</label>
          <select name="align" defaultValue={slide?.align ?? "left"} className="field">
            <option value="left">Sola</option>
            <option value="center">Ortaya</option>
            <option value="right">Sağa</option>
          </select>
        </div>
        <div>
          <label className="label">Yazı rengi</label>
          <select name="theme" defaultValue={slide?.theme ?? "light"} className="field">
            <option value="light">Açık (koyu görsel)</option>
            <option value="dark">Koyu (açık görsel)</option>
          </select>
        </div>
        <div>
          <label className="label">Karartma (%)</label>
          <input name="overlay" type="number" min={0} max={80} defaultValue={slide?.overlay ?? 25} className="field" />
          <p className="help">Yazı okunmuyorsa artır.</p>
        </div>
        <div>
          <label className="label">Sıra</label>
          <input name="sortOrder" type="number" defaultValue={slide?.sortOrder ?? 0} className="field" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Yayın başlangıcı</label>
          <input name="startsAt" type="datetime-local" defaultValue={toInputDate(slide?.startsAt ?? null)} className="field" />
        </div>
        <div>
          <label className="label">Yayın bitişi</label>
          <input name="endsAt" type="datetime-local" defaultValue={toInputDate(slide?.endsAt ?? null)} className="field" />
          <p className="help">Boş bırakırsan süresiz yayında kalır.</p>
        </div>
        <label className="flex items-end gap-2 pb-3 text-[13px]">
          <input type="checkbox" name="isActive" defaultChecked={slide?.isActive ?? true}
            className="h-4 w-4 accent-[color:var(--color-ink)]" />
          Yayında
        </label>
      </div>

      {state && (
        <p role="status" className={state.ok ? "text-[13px] text-[color:var(--color-ok)]" : "error-text"}>
          {state.message}
        </p>
      )}

      <button type="submit" className="btn-primary btn-sm" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Slaytı kaydet"}
      </button>
    </form>
  );
}
