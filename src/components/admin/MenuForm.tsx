"use client";

/**
 * MENÜ FORMU
 *
 * Her ana kategori bir satır: görünür mü, sırası kaç, menüde hangi adla
 * çıkacak. Altında da kategori olmayan bağlantılar.
 *
 * Sıra, ok düğmeleriyle değiştirilir ve gizli bir sayı alanına yazılır —
 * sürükle-bırak yerine bu tercih edildi: dokunmatik ekranda çalışır,
 * klavyeyle erişilebilir ve bozulacak bir şeyi yoktur.
 */

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Info } from "lucide-react";
import {
  resetMenuAction,
  saveMenuAction,
  type ContentState,
} from "@/actions/admin-content";

export type MenuRow = {
  slug: string;
  /** Kategorinin gerçek adı */
  name: string;
  /** Menüde gösterilen ad (override varsa farklı) */
  label: string;
  visible: boolean;
  childCount: number;
};

export type CustomRow = {
  label: string;
  href: string;
  start: boolean;
  highlight: boolean;
};

const OZEL_SATIR = 6;

export default function MenuForm({
  rows: initialRows,
  custom: initialCustom,
}: {
  rows: MenuRow[];
  custom: CustomRow[];
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(
    saveMenuAction,
    null,
  );
  const [rows, setRows] = useState(initialRows);

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
  }

  function toggle(index: number) {
    const next = [...rows];
    next[index] = { ...next[index], visible: !next[index].visible };
    setRows(next);
  }

  function rename(index: number, label: string) {
    const next = [...rows];
    next[index] = { ...next[index], label };
    setRows(next);
  }

  return (
    <form action={action} className="space-y-6">
      <div className="flex items-start gap-2.5 border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] p-3.5 text-[12.5px] leading-relaxed">
        <Info size={15} strokeWidth={1.6} className="mt-0.5 shrink-0" />
        <div>
          Menü kategorilerden <strong>otomatik</strong> oluşur. Burada yalnızca
          düzenlersin: gizlersin, sırasını değiştirirsin, menüde farklı bir ad
          gösterirsin. <strong>Yeni bir kategori açtığında menüde kendiliğinden
          belirir</strong> — eklemeyi unutma diye bir şey olmaz.
          <br />
          Gizlemek kategoriyi silmez; sayfası ve ürünleri çalışmaya devam eder,
          sadece menüde görünmez.
        </div>
      </div>

      {/* --- Kategoriler --- */}
      <section className="card overflow-hidden p-0">
        <div className="border-b border-[color:var(--color-line)] px-5 py-3">
          <h2 className="text-[15px] font-semibold">Ana kategoriler</h2>
          <p className="mt-0.5 text-[12.5px] text-[color:var(--color-muted)]">
            Üstteki ilk 7 başlık menüde yan yana durur; gerisi &quot;Diğer&quot;
            açılır listesine düşer.
          </p>
        </div>

        <ul className="divide-y divide-[color:var(--color-line)]">
          {rows.map((row, index) => (
            <li
              key={row.slug}
              className={`flex flex-wrap items-center gap-3 px-5 py-3 ${
                row.visible ? "" : "bg-[color:var(--color-surface-2)]"
              }`}
            >
              <input type="hidden" name="slug" value={row.slug} />
              <input type="hidden" name={`asil_${row.slug}`} value={row.name} />
              <input type="hidden" name={`sira_${row.slug}`} value={index} />
              {row.visible && (
                <input type="hidden" name={`gorunur_${row.slug}`} value="on" />
              )}

              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="px-1 py-0.5 disabled:opacity-25"
                  aria-label={`${row.name} yukarı taşı`}
                >
                  <ArrowUp size={14} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  className="px-1 py-0.5 disabled:opacity-25"
                  aria-label={`${row.name} aşağı taşı`}
                >
                  <ArrowDown size={14} strokeWidth={1.8} />
                </button>
              </div>

              <span className="w-6 shrink-0 text-center font-mono text-[12px] text-[color:var(--color-muted)]">
                {index + 1}
              </span>

              <div className="min-w-[160px] flex-1">
                <input
                  name={`ad_${row.slug}`}
                  value={row.label}
                  onChange={(event) => rename(index, event.target.value)}
                  disabled={!row.visible}
                  className="field text-[13px] disabled:opacity-50"
                  aria-label={`${row.name} menü adı`}
                />
                {row.label !== row.name && (
                  <p className="help mt-1">
                    Kategori adı: {row.name} — menüde farklı gösteriliyor
                  </p>
                )}
              </div>

              <span className="shrink-0 text-[12px] text-[color:var(--color-muted)]">
                {row.childCount > 0 ? `${row.childCount} alt kategori` : "alt kategori yok"}
              </span>

              <button
                type="button"
                onClick={() => toggle(index)}
                className={row.visible ? "btn-ghost text-[12.5px]" : "btn-primary text-[12.5px]"}
              >
                {row.visible ? (
                  <>
                    <EyeOff size={13} strokeWidth={1.6} />
                    Gizle
                  </>
                ) : (
                  <>
                    <Eye size={13} strokeWidth={1.6} />
                    Göster
                  </>
                )}
              </button>
            </li>
          ))}

          {rows.length === 0 && (
            <li className="px-5 py-10 text-center text-[13px] text-[color:var(--color-muted)]">
              Henüz ana kategori yok. Kategoriler ekranından ekleyebilirsin.
            </li>
          )}
        </ul>
      </section>

      {/* --- Özel bağlantılar --- */}
      <section className="card space-y-4 p-5">
        <div>
          <h2 className="text-[15px] font-semibold">Özel bağlantılar</h2>
          <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
            Kategori olmayan menü girdileri: İndirim, Blog, Hakkımızda…
            Adres site içi bir yol (<code>/indirimli</code>) ya da tam bir
            adres olabilir. Boş bıraktığın satırlar yok sayılır.
          </p>
        </div>

        <div className="space-y-3">
          {Array.from({ length: OZEL_SATIR }, (_, index) => {
            const item = initialCustom[index];
            return (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1.3fr_auto_auto]">
                <input
                  name={`ozel_ad_${index}`}
                  defaultValue={item?.label ?? ""}
                  placeholder={`${index + 1}. bağlantı adı`}
                  className="field text-[13px]"
                />
                <input
                  name={`ozel_url_${index}`}
                  defaultValue={item?.href ?? ""}
                  placeholder="/indirimli"
                  spellCheck={false}
                  className="field font-mono text-[12.5px]"
                />
                <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px]">
                  <input
                    type="checkbox"
                    name={`ozel_bas_${index}`}
                    defaultChecked={item?.start ?? false}
                    className="h-4 w-4 accent-[color:var(--color-brand)]"
                  />
                  Başa koy
                </label>
                <label className="flex items-center gap-2 whitespace-nowrap text-[12.5px]">
                  <input
                    type="checkbox"
                    name={`ozel_vurgu_${index}`}
                    defaultChecked={item?.highlight ?? false}
                    className="h-4 w-4 accent-[color:var(--color-brand)]"
                  />
                  Vurgulu
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button id="menu-kaydet" type="submit" disabled={pending} className="btn-primary">
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            if (!confirm("Menü tamamen otomatik haline dönsün mü? Düzenlemelerin silinir.")) return;
            await resetMenuAction();
            window.location.reload();
          }}
          className="btn-ghost"
        >
          Otomatik hale döndür
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
  );
}
