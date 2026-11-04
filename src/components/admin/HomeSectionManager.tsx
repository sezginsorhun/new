"use client";

/**
 * ANA SAYFA BÖLÜM YÖNETİCİSİ
 *
 * Ana sayfadaki her blok burada listelenir. Her bölüm:
 *   • yukarı/aşağı taşınabilir
 *   • yayından kaldırılabilir
 *   • ayarları açılıp düzenlenebilir
 *   • silinebilir
 * Yeni bölüm eklemek için üstteki seçicide tip seçilir.
 */

import { useActionState, useState, useTransition } from "react";
import {
  ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Plus, Trash2,
} from "lucide-react";
import {
  addSectionAction,
  deleteSectionAction,
  moveSectionAction,
  saveSectionAction,
  toggleSectionAction,
  type ContentState,
} from "@/actions/admin-home";
import { SECTION_TYPES, PRODUCT_SOURCES, USP_ICONS, type HomeSection } from "@/lib/home-config";
import MediaPicker from "./MediaPicker";

const TYPE_LABEL = Object.fromEntries(SECTION_TYPES.map((t) => [t.value, t.label]));

export default function HomeSectionManager({
  sections,
  categories,
}: {
  sections: HomeSection[];
  categories: { id: string; name: string; slug: string; depth: number }[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [newType, setNewType] = useState(SECTION_TYPES[0].value);
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
      {/* Yeni bölüm */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[220px] flex-1">
          <label className="label" htmlFor="new-section-type">
            Yeni bölüm ekle
          </label>
          <select
            id="new-section-type"
            value={newType}
            onChange={(event) => setNewType(event.target.value as typeof newType)}
            className="field"
          >
            {SECTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} — {type.description}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn-primary btn-sm"
          disabled={pending}
          onClick={() => run(addSectionAction(newType))}
        >
          <Plus size={14} strokeWidth={2} />
          Ekle
        </button>
      </div>

      {notice && (
        <p role="status" className="card bg-[color:var(--color-surface-2)] px-4 py-2.5 text-[13px]">
          {notice}
        </p>
      )}

      {/* Bölümler */}
      {sections.length === 0 ? (
        <div className="card p-10 text-center text-[13.5px] text-[color:var(--color-muted)]">
          Henüz bölüm yok. Yukarıdan ekleyerek ana sayfanı kur.
        </div>
      ) : (
        <ol className="space-y-2.5">
          {sections.map((section, index) => (
            <li key={section.id} className="card">
              <div className="flex flex-wrap items-center gap-3 p-3.5">
                <GripVertical size={16} strokeWidth={1.5} className="text-[color:var(--color-muted)]" />

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[14px] font-semibold">
                    {section.title || TYPE_LABEL[section.type] || section.type}
                    {!section.isActive && <span className="badge badge-mute">Gizli</span>}
                  </p>
                  <p className="text-[12px] text-[color:var(--color-muted)]">
                    {TYPE_LABEL[section.type] ?? section.type}
                    {section.subtitle ? ` · ${section.subtitle.slice(0, 60)}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Yukarı taşı"
                    disabled={index === 0 || pending}
                    className="btn-ghost btn-sm"
                    onClick={() => run(moveSectionAction(section.id, "up"))}
                  >
                    <ChevronUp size={15} strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    aria-label="Aşağı taşı"
                    disabled={index === sections.length - 1 || pending}
                    className="btn-ghost btn-sm"
                    onClick={() => run(moveSectionAction(section.id, "down"))}
                  >
                    <ChevronDown size={15} strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    disabled={pending}
                    onClick={() => run(toggleSectionAction(section.id, !section.isActive))}
                  >
                    {section.isActive ? (
                      <><EyeOff size={14} strokeWidth={1.6} /> Gizle</>
                    ) : (
                      <><Eye size={14} strokeWidth={1.6} /> Yayına al</>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => setOpenId(openId === section.id ? null : section.id)}
                  >
                    {openId === section.id ? "Kapat" : "Düzenle"}
                  </button>
                  <DeleteButton
                    onConfirm={() => run(deleteSectionAction(section.id))}
                    disabled={pending}
                  />
                </div>
              </div>

              {openId === section.id && (
                <div className="border-t border-[color:var(--color-line)] p-4">
                  <SectionForm section={section} categories={categories} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ------------------------- İki aşamalı silme ---------------------------- */

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

/* ----------------------------- Bölüm formu ------------------------------ */

function SectionForm({
  section,
  categories,
}: {
  section: HomeSection;
  categories: { id: string; name: string; slug: string; depth: number }[];
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(saveSectionAction, null);
  const config = section.config;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={section.id} />

      {section.type !== "hero" && section.type !== "usp" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={`t-${section.id}`}>Başlık</label>
            <input id={`t-${section.id}`} name="title" defaultValue={section.title ?? ""} className="field" />
          </div>
          <div>
            <label className="label" htmlFor={`s-${section.id}`}>Alt başlık</label>
            <input id={`s-${section.id}`} name="subtitle" defaultValue={section.subtitle ?? ""} className="field" />
          </div>
        </div>
      )}

      {/* ---------------------------- CAROUSEL --------------------------- */}
      {section.type === "hero" && (
        <>
          <p className="card bg-[color:var(--color-surface-2)] p-3 text-[12.5px]">
            Slaytların kendisi <strong>Carousel</strong> ekranından yönetilir. Burada yalnızca
            davranışı ayarlarsın.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Otomatik geçiş (ms)</label>
              <input name="autoplayMs" type="number" min={0} max={30000} step={500}
                defaultValue={config.autoplayMs ?? 6000} className="field" />
              <p className="help">0 yazarsan otomatik geçiş kapanır.</p>
            </div>
            <div>
              <label className="label">Yükseklik</label>
              <select name="height" defaultValue={config.height ?? "tall"} className="field">
                <option value="short">Kısa</option>
                <option value="medium">Orta</option>
                <option value="tall">Yüksek</option>
              </select>
            </div>
            <div>
              <label className="label">Slayt grubu</label>
              <input name="position" defaultValue={config.position ?? "home_hero"} className="field" />
              <p className="help">Carousel ekranındaki grup adıyla aynı olmalı.</p>
            </div>
          </div>
          <div className="flex gap-5">
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="showArrows" defaultChecked={config.showArrows !== false}
                className="h-4 w-4 accent-[color:var(--color-ink)]" />
              Ok tuşlarını göster
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="showDots" defaultChecked={config.showDots !== false}
                className="h-4 w-4 accent-[color:var(--color-ink)]" />
              Noktaları göster
            </label>
          </div>
        </>
      )}

      {/* --------------------------- GÜVEN ŞERİDİ ------------------------- */}
      {section.type === "usp" && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => {
            const item = config.items?.[i];
            return (
              <div key={i} className="grid gap-2 sm:grid-cols-[120px_1fr_1fr]">
                <select name={`usp_icon_${i}`} defaultValue={item?.icon ?? "truck"} className="field">
                  {USP_ICONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
                <input name={`usp_title_${i}`} defaultValue={item?.title ?? ""}
                  placeholder={`${i + 1}. başlık (boş bırakırsan görünmez)`} className="field" />
                <input name={`usp_text_${i}`} defaultValue={item?.text ?? ""}
                  placeholder="Açıklama" className="field" />
              </div>
            );
          })}
        </div>
      )}

      {/* --------------------------- KATEGORİLER -------------------------- */}
      {section.type === "categories" && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Hangi kategoriler</label>
            <select name="source" defaultValue={config.source ?? "children"} className="field">
              <option value="children">Alt kategoriler</option>
              <option value="roots">Ana kategoriler</option>
            </select>
          </div>
          <div>
            <label className="label">Kaç tane</label>
            <input name="limit" type="number" min={1} max={24} defaultValue={config.limit ?? 6} className="field" />
          </div>
          <div>
            <label className="label">Sütun</label>
            <select name="columns" defaultValue={String(config.columns ?? 6)} className="field">
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="6">6</option>
            </select>
          </div>
          <div>
            <label className="label">Kutu oranı</label>
            <select name="shape" defaultValue={config.shape ?? "portrait"} className="field">
              <option value="portrait">Dikey (3:4)</option>
              <option value="square">Kare</option>
              <option value="wide">Yatay (4:3)</option>
            </select>
          </div>
          <div>
            <label className="label">Görünüm</label>
            <select name="tileStyle" defaultValue={config.tileStyle ?? "overlay"} className="field">
              <option value="overlay">Yazı görselin üstünde</option>
              <option value="card">Kart — başlık ve düğme altta</option>
            </select>
            <p className="help mt-1">
              Kart görünümü 2–4 kutuyla iyi durur; altı kutuyla sayfa uzar.
            </p>
          </div>
          <div>
            <label className="label">Düğme yazısı</label>
            <input
              name="tileButtonLabel"
              defaultValue={config.tileButtonLabel ?? ""}
              placeholder="Alışverişe başla"
              className="field"
            />
            <p className="help mt-1">Yalnızca kart görünümünde görünür.</p>
          </div>
        </div>
      )}

      {/* ----------------------------- ÜRÜNLER ---------------------------- */}
      {section.type === "products" && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Kaynak</label>
            <select name="source" defaultValue={config.source ?? "featured"} className="field">
              {PRODUCT_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>{source.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Kategori (kaynak kategori ise)</label>
            <select name="categorySlug" defaultValue={config.categorySlug ?? ""} className="field">
              <option value="">—</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {"— ".repeat(category.depth)}{category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Kaç ürün</label>
            <input name="limit" type="number" min={2} max={24} defaultValue={config.limit ?? 8} className="field" />
          </div>
          <div>
            <label className="label">Düzen</label>
            <select name="layout" defaultValue={config.layout ?? "grid"} className="field">
              <option value="grid">Izgara</option>
              <option value="rail">Yatay kaydırmalı</option>
            </select>
          </div>
        </div>
      )}

      {/* ---------------------------- TANITIM ----------------------------- */}
      {section.type === "promo" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <MediaPicker name="imageUrl" label="Masaüstü görseli" value={config.imageUrl}
              hint="Geniş görsel önerilir (ör. 1920×760)." />
            <MediaPicker name="mobileImageUrl" label="Mobil görseli (isteğe bağlı)" value={config.mobileImageUrl}
              hint="Boş bırakırsan masaüstü görseli kullanılır." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Üst yazı</label>
              <input name="eyebrow" defaultValue={config.eyebrow ?? ""} className="field" />
            </div>
            <div>
              <label className="label">Açıklama</label>
              <input name="text" defaultValue={config.text ?? ""} className="field" />
            </div>
            <div>
              <label className="label">Buton yazısı</label>
              <input name="buttonLabel" defaultValue={config.buttonLabel ?? ""} className="field" />
            </div>
            <div>
              <label className="label">Buton adresi</label>
              <input name="buttonUrl" defaultValue={config.buttonUrl ?? ""} placeholder="/kategori/kadin" className="field" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="label">Düzen</label>
              <select name="layout" defaultValue={config.layout ?? "full"} className="field">
                <option value="full">Tam genişlik görsel</option>
                <option value="split">Yarım görsel + metin</option>
              </select>
            </div>
            <div>
              <label className="label">Yazı rengi</label>
              <select name="theme" defaultValue={config.theme ?? "light"} className="field">
                <option value="light">Açık (koyu görselde)</option>
                <option value="dark">Koyu (açık görselde)</option>
              </select>
            </div>
            <div>
              <label className="label">Hizalama</label>
              <select name="align" defaultValue={config.align ?? "left"} className="field">
                <option value="left">Sola</option>
                <option value="center">Ortaya</option>
                <option value="right">Sağa</option>
              </select>
            </div>
            <div>
              <label className="label">Karartma (%)</label>
              <input name="overlay" type="number" min={0} max={80} defaultValue={config.overlay ?? 30} className="field" />
            </div>
          </div>
        </>
      )}

      {/* --------------------------- SERBEST METİN ------------------------ */}
      {section.type === "richtext" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Üst yazı</label>
            <input name="eyebrow" defaultValue={config.eyebrow ?? ""} className="field" />
          </div>
          <div>
            <label className="label">Genişlik (px)</label>
            <input name="maxWidth" type="number" min={360} max={1200} defaultValue={config.maxWidth ?? 720} className="field" />
          </div>
          <div>
            <label className="label">Buton yazısı</label>
            <input name="buttonLabel" defaultValue={config.buttonLabel ?? ""} className="field" />
          </div>
          <div>
            <label className="label">Buton adresi</label>
            <input name="buttonUrl" defaultValue={config.buttonUrl ?? ""} className="field" />
          </div>
        </div>
      )}

      {/* --------------------------- ORTAK ZEMİN -------------------------- */}
      {section.type !== "hero" && section.type !== "usp" && section.type !== "promo" && (
        <div className="sm:w-[220px]">
          <label className="label">Zemin rengi</label>
          <select name="background" defaultValue={config.background ?? "white"} className="field">
            <option value="white">Beyaz</option>
            <option value="soft">Açık gri</option>
          </select>
        </div>
      )}

      {(section.type === "products" || section.type === "categories") && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Sağ üst bağlantı yazısı</label>
            <input name="ctaLabel" defaultValue={config.ctaLabel ?? ""} placeholder="Tümünü gör" className="field" />
          </div>
          <div>
            <label className="label">Sağ üst bağlantı adresi</label>
            <input name="ctaHref" defaultValue={config.ctaHref ?? ""} placeholder="/kategori/kadin" className="field" />
          </div>
        </div>
      )}

      {state && (
        <p role="status" className={state.ok ? "text-[13px] text-[color:var(--color-ok)]" : "error-text"}>
          {state.message}
        </p>
      )}

      <button type="submit" className="btn-primary btn-sm" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Bölümü kaydet"}
      </button>
    </form>
  );
}
