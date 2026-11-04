"use client";

/**
 * SEO FORMU
 *
 * Sağda canlı bir "Google önizlemesi" var: yazdığın başlık ve açıklama
 * arama sonucunda nasıl görünecek, karakter sınırını aşıyor mu — kaydetmeden
 * görürsün. Google tam olarak bu uzunlukları kullanmaz ama kesilme riskini
 * göstermek için iyi bir ölçüdür.
 */

import { useActionState, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { saveSeoAction, type ContentState } from "@/actions/admin-content";
import MediaPicker from "./MediaPicker";

/** Google'ın genelde kestiği sınırlar */
const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

function Counter({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span
      className={`text-[11.5px] ${over ? "text-[color:var(--color-sale)]" : "text-[color:var(--color-muted)]"}`}
    >
      {value.length} / {limit}
      {over ? " — arama sonucunda kesilebilir" : ""}
    </span>
  );
}

export default function SeoForm({
  settings,
  siteUrl,
}: {
  settings: Record<string, string>;
  siteUrl: string;
}) {
  const [state, action, pending] = useActionState<ContentState, FormData>(
    saveSeoAction,
    null,
  );

  const [homeTitle, setHomeTitle] = useState(settings.seo_home_title ?? "");
  const [homeDesc, setHomeDesc] = useState(settings.seo_home_description ?? "");
  const [template, setTemplate] = useState(settings.seo_title_template ?? "%s | Alenora");
  const [indexed, setIndexed] = useState(settings.seo_index !== "0");

  const ornekSayfa = template.includes("%s")
    ? template.replace("%s", "Vibratör")
    : "Vibratör";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form action={action} className="space-y-6">
        {/* --- Ana sayfa --- */}
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-[15px] font-semibold">Ana sayfa</h2>
            <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
              Tarayıcı sekmesinde ve Google sonuçlarında ana sayfa için görünen
              yazılar.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="seo_home_title" className="label">
                Ana sayfa başlığı
              </label>
              <Counter value={homeTitle} limit={TITLE_LIMIT} />
            </div>
            <input
              id="seo_home_title"
              name="seo_home_title"
              value={homeTitle}
              onChange={(event) => setHomeTitle(event.target.value)}
              className="field"
            />
            <p className="help mt-1">
              Marka adını ve ne sattığını birlikte yaz. Başlık şablonuna
              girmez, olduğu gibi kullanılır.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="seo_home_description" className="label">
                Ana sayfa açıklaması
              </label>
              <Counter value={homeDesc} limit={DESC_LIMIT} />
            </div>
            <textarea
              id="seo_home_description"
              name="seo_home_description"
              value={homeDesc}
              onChange={(event) => setHomeDesc(event.target.value)}
              rows={3}
              className="field"
            />
            <p className="help mt-1">
              Arama sonucunda başlığın altında çıkan iki satır. Tıklamayı bu
              belirler — vaadini net yaz.
            </p>
          </div>
        </section>

        {/* --- Diğer sayfalar --- */}
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-[15px] font-semibold">Diğer sayfalar</h2>
            <p className="mt-1 text-[12.5px] text-[color:var(--color-muted)]">
              Ürün, kategori ve içerik sayfalarının başlıkları bu şablona göre
              oluşur. Her ürünün kendi SEO başlığını ürün ekranından
              yazabilirsin.
            </p>
          </div>

          <div>
            <label htmlFor="seo_title_template" className="label">
              Başlık şablonu
            </label>
            <input
              id="seo_title_template"
              name="seo_title_template"
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              spellCheck={false}
              className="field font-mono text-[13px]"
            />
            <p className="help mt-1">
              <code>%s</code> sayfanın kendi başlığıyla değişir. Örnek sonuç:{" "}
              <strong>{ornekSayfa}</strong>
            </p>
            {!template.includes("%s") && (
              <p className="mt-1 text-[12px] text-[color:var(--color-sale)]">
                Şablonda <code>%s</code> yok — bu haliyle her sayfanın başlığı
                aynı olurdu. Kaydederken düzeltilecek.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="seo_default_description" className="label">
              Varsayılan açıklama
            </label>
            <textarea
              id="seo_default_description"
              name="seo_default_description"
              defaultValue={settings.seo_default_description ?? ""}
              rows={2}
              className="field"
            />
            <p className="help mt-1">
              Kendi açıklaması girilmemiş sayfalarda kullanılır.
            </p>
          </div>
        </section>

        {/* --- Paylaşım görseli --- */}
        <section className="card space-y-3 p-5">
          <h2 className="text-[15px] font-semibold">Paylaşım görseli</h2>
          <MediaPicker
            name="seo_og_image"
            label="Kapak görseli"
            value={settings.seo_og_image ?? ""}
            hint="Site bağlantısı WhatsApp, Instagram veya X'te paylaşılınca görünen kapak. Önerilen ölçü 1200 × 630 piksel."
          />
        </section>

        {/* --- Arama motorları --- */}
        <section className="card space-y-4 p-5">
          <h2 className="text-[15px] font-semibold">Arama motorları</h2>

          <label className="flex cursor-pointer items-start gap-2.5 text-[13px]">
            <input
              type="checkbox"
              name="seo_index"
              checked={indexed}
              onChange={(event) => setIndexed(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[color:var(--color-brand)]"
            />
            <span>
              Arama motorları siteyi dizine ekleyebilsin
              <span className="block text-[12px] text-[color:var(--color-muted)]">
                Kapatırsan site Google sonuçlarından düşer. Yalnızca site
                hazır olmadan yayına aldıysan kapat.
              </span>
            </span>
          </label>

          {!indexed && (
            <div className="flex items-start gap-2.5 border border-[color:var(--color-sale)] bg-red-50 p-3 text-[12.5px]">
              <AlertTriangle
                size={15}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0 text-[color:var(--color-sale)]"
              />
              <span>
                Bu haliyle kaydedersen siteye <strong>noindex</strong> etiketi
                basılır. Google mevcut kayıtları birkaç gün içinde siler;
                geri gelmesi haftalar sürebilir.
              </span>
            </div>
          )}

          <div>
            <label htmlFor="seo_google_verification" className="label">
              Google Search Console doğrulama kodu
            </label>
            <input
              id="seo_google_verification"
              name="seo_google_verification"
              defaultValue={settings.seo_google_verification ?? ""}
              placeholder="Yalnızca content değeri, etiketin tamamı değil"
              spellCheck={false}
              className="field font-mono text-[12.5px]"
            />
            <p className="help mt-1">
              Search Console &quot;HTML etiketi&quot; yöntemini seçtiğinde verdiği{" "}
              <code>content=&quot;...&quot;</code> içindeki değer.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button id="seo-kaydet" type="submit" disabled={pending} className="btn-primary">
            {pending ? "Kaydediliyor..." : "Kaydet"}
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

      {/* --- Google önizlemesi --- */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="card p-4">
          <p className="mb-3 text-[12px] font-semibold">Google&apos;da böyle görünür</p>

          <div className="border border-[color:var(--color-line)] p-3">
            <p className="truncate text-[12px] text-[color:var(--color-ink-soft)]">
              {siteUrl.replace(/^https?:\/\//, "")}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[16px] leading-snug text-[#1a0dab]">
              {homeTitle || "Başlık girilmedi"}
            </p>
            <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-[color:var(--color-ink-soft)]">
              {homeDesc || "Açıklama girilmedi."}
            </p>
          </div>

          <p className="mt-3 text-[12px] font-semibold">Örnek ürün sayfası</p>
          <div className="mt-1.5 border border-[color:var(--color-line)] p-3">
            <p className="line-clamp-2 text-[15px] leading-snug text-[#1a0dab]">
              {ornekSayfa}
            </p>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--color-muted)]">
            Google başlığı kendi de değiştirebilir; bu önizleme kesin değil,
            uzunluk için ölçüdür.
          </p>
        </div>
      </aside>
    </div>
  );
}
