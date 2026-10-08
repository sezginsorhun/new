"use client";

/**
 * TEMA FORMU
 *
 * Üç bölüm:
 *   1. Renkler       — renk seçici + hex kutusu yan yana
 *   2. Ölçüler       — köşe yuvarlaklığı, yazı boyutu
 *   3. Özel CSS      — serbest yazı alanı
 *
 * Sağda CANLI ÖNİZLEME var. Önizleme, formdaki değerleri doğrudan kendi
 * CSS değişkenlerine yazar; yani kaydetmeden önce nasıl görüneceğini
 * görürsün. Önizleme kendi kapsayıcısıyla sınırlıdır, paneli boyamaz.
 */

import { useActionState, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import {
  resetThemeAction,
  saveThemeAction,
  type ContentState,
} from "@/actions/admin-content";
import { THEME_COLORS, THEME_NUMBERS } from "@/lib/theme";

export default function ThemeForm({
  settings,
  defaults,
}: {
  settings: Record<string, string>;
  defaults: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(
    saveThemeAction,
    null,
  );

  /* Canlı önizleme için formdaki anlık değerler */
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const { key } of THEME_COLORS) initial[key] = settings[key] ?? defaults[key] ?? "#000000";
    for (const { key } of THEME_NUMBERS) initial[key] = settings[key] ?? defaults[key] ?? "0";
    return initial;
  });

  const set = (key: string, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  /** Önizleme kutusuna uygulanacak değişkenler */
  const previewStyle = Object.fromEntries(
    THEME_COLORS.map(({ key, cssVar }) => [cssVar, values[key]]),
  ) as React.CSSProperties;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form action={action} className="space-y-6">
        {/* --- Renkler --- */}
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-[15px] font-semibold">Renkler</h2>
            <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
              Değişiklikler yalnızca müşteri tarafını etkiler. Yönetim paneli
              her zaman bu renklerden bağımsız kalır.
            </p>
          </div>

          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {THEME_COLORS.map(({ key, label, help }) => (
              <div key={key}>
                <label htmlFor={key} className="block text-[12.5px] font-medium">
                  {label}
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id={key}
                    type="color"
                    value={values[key]}
                    onChange={(event) => set(key, event.target.value)}
                    className="h-9 w-10 shrink-0 cursor-pointer border border-[color:var(--color-line)] bg-white p-0.5"
                    aria-label={`${label} renk seçici`}
                  />
                  <input
                    type="text"
                    name={key}
                    value={values[key]}
                    onChange={(event) => set(key, event.target.value)}
                    spellCheck={false}
                    className="field font-mono text-[12.5px]"
                  />
                </div>
                <p className="help mt-1">{help}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- Ölçüler --- */}
        <section className="card space-y-5 p-5">
          <h2 className="text-[15px] font-semibold">Ölçüler</h2>
          {THEME_NUMBERS.map(({ key, label, unit, min, max, step, help }) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <label htmlFor={key} className="text-[12.5px] font-medium">
                  {label}
                </label>
                <span className="font-mono text-[12.5px] text-[color:var(--color-muted)]">
                  {values[key]}
                  {unit}
                </span>
              </div>
              <input
                id={key}
                name={key}
                type="range"
                min={min}
                max={max}
                step={step}
                value={values[key]}
                onChange={(event) => set(key, event.target.value)}
                className="mt-2 w-full accent-[color:var(--color-brand)]"
              />
              <p className="help mt-1">{help}</p>
            </div>
          ))}
        </section>

        {/* --- Özel CSS --- */}
        <section className="card space-y-3 p-5">
          <div>
            <h2 className="text-[15px] font-semibold">Özel CSS</h2>
            <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
              Yukarıdaki ayarlarla çözülemeyen her şey için. Buraya yazdığın
              CSS, vitrindeki sayfaların sonuna eklenir.
            </p>
          </div>

          <div className="flex items-start gap-2.5 border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] p-3 text-[12px] leading-relaxed">
            <AlertTriangle size={14} strokeWidth={1.6} className="mt-0.5 shrink-0" />
            <div>
              Hatalı CSS siteyi bozabilir. Panel etkilenmez, bu yüzden bu
              sayfaya her zaman girip <strong>Varsayılana dön</strong> diyebilirsin.
              <br />
              Güvenlik gereği <code>@import</code>, <code>&lt;script&gt;</code> ve{" "}
              <code>javascript:</code> kalıpları kaydedilirken temizlenir.
            </div>
          </div>

          <textarea
            name="custom_css"
            defaultValue={settings.custom_css ?? ""}
            rows={14}
            spellCheck={false}
            placeholder={`/* Örnek: ürün kartı başlıklarını büyüt */\n.card h3 {\n  font-size: 15px;\n}`}
            className="field min-h-[260px] font-mono text-[12.5px] leading-relaxed"
          />
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button id="tema-kaydet" type="submit" disabled={pending} className="btn-primary">
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>

          <button
            id="tema-sifirla"
            type="button"
            disabled={pending}
            onClick={async () => {
              if (!confirm("Tema varsayılana dönsün mü? Özel CSS de silinir.")) return;
              await resetThemeAction();
              window.location.reload();
            }}
            className="btn-ghost"
          >
            <RotateCcw size={14} strokeWidth={1.6} />
            Varsayılana dön
          </button>

          {state && (
            <span
              className={
                state.ok
                  ? "text-[13px] text-[color:var(--color-success)]"
                  : "text-[13px] text-[color:var(--color-sale)]"
              }
            >
              {state.message}
            </span>
          )}
        </div>
      </form>

      {/* --- Canlı önizleme --- */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="card overflow-hidden p-0">
          <p className="border-b border-[color:var(--color-line)] px-4 py-2.5 text-[12px] font-semibold">
            Önizleme
          </p>

          <div
            style={{ ...previewStyle, backgroundColor: values.theme_cream }}
            className="space-y-4 p-4"
          >
            <p
              className="text-[11px] uppercase tracking-[0.25em]"
              style={{ color: values.theme_muted }}
            >
              Yeni sezon
            </p>
            <h3 className="text-[20px] font-bold" style={{ color: values.theme_ink }}>
              Örnek başlık
            </h3>
            <p className="text-[13px]" style={{ color: values.theme_ink_soft }}>
              Gövde metni böyle görünür. Ürün açıklamaları ve bilgilendirme
              yazıları bu renkte.
            </p>

            <div
              className="border p-3"
              style={{ borderColor: values.theme_line, borderRadius: `${values.theme_radius}px` }}
            >
              <div
                className="mb-2.5 h-20"
                style={{
                  backgroundColor: values.theme_surface_2,
                  borderRadius: `${values.theme_radius}px`,
                }}
              />
              <p className="text-[13px] font-medium" style={{ color: values.theme_ink }}>
                Örnek Ürün
              </p>
              <p className="mt-0.5 text-[13px] font-semibold" style={{ color: values.theme_brand }}>
                799,90 TL
              </p>
            </div>

            <button
              type="button"
              className="w-full px-4 py-2.5 text-[13px] font-semibold text-white"
              style={{
                backgroundColor: values.theme_brand,
                borderRadius: `${values.theme_radius}px`,
              }}
            >
              Sepete Ekle
            </button>

            <div
              className="p-3 text-[12px]"
              style={{
                backgroundColor: values.theme_brand_soft,
                color: values.theme_ink,
                borderRadius: `${values.theme_radius}px`,
              }}
            >
              Vurgulu bilgi kutusu
            </div>
          </div>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--color-muted)]">
          Önizleme renkleri ve köşeleri gösterir; yazı boyutu ve özel CSS
          yalnızca kaydettikten sonra sitede görünür.
        </p>
      </aside>
    </div>
  );
}
