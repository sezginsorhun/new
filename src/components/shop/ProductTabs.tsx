"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { submitReviewAction, type FormState } from "@/actions/account";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  date: string;
};

const TABS = [
  { id: "detay", label: "Ürün Detayı" },
  { id: "kumas", label: "Kumaş ve Bakım" },
  { id: "yorum", label: "Değerlendirmeler" },
  { id: "teslimat", label: "Teslimat ve İade" },
] as const;

export default function ProductTabs({
  description,
  material,
  careInfo,
  modelInfo,
  productId,
  isLoggedIn,
  reviews,
}: {
  description: string;
  material: string | null;
  careInfo: string | null;
  modelInfo: string | null;
  productId: string;
  isLoggedIn: boolean;
  reviews: Review[];
}) {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("detay");
  const [rating, setRating] = useState(5);
  const [state, action, pending] = useActionState<FormState, FormData>(
    submitReviewAction,
    null,
  );

  return (
    <section className="mt-16">
      {/* Sekme başlıkları */}
      <div
        role="tablist"
        aria-label="Ürün bilgileri"
        className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[color:var(--color-line)]"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-[12.5px] font-medium uppercase tracking-[0.1em] transition-colors ${
              active === tab.id
                ? "border-[color:var(--color-ink)] text-[color:var(--color-ink)]"
                : "border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
            }`}
          >
            {tab.label}
            {tab.id === "yorum" && reviews.length > 0 && ` (${reviews.length})`}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="max-w-[760px] py-8 text-[14.5px] leading-relaxed">
        {active === "detay" && (
          <div className="space-y-4 text-[color:var(--color-ink-soft)]">
            {description.split("\n").filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {modelInfo && (
              <p className="border-l-2 border-[color:var(--color-brand)] pl-4 text-[13px]">
                {modelInfo}
              </p>
            )}
          </div>
        )}

        {active === "kumas" && (
          <dl className="space-y-5 text-[color:var(--color-ink-soft)]">
            {material && (
              <div>
                <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink)]">
                  Kumaş içeriği
                </dt>
                <dd className="mt-1.5">{material}</dd>
              </div>
            )}
            {careInfo && (
              <div>
                <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink)]">
                  Yıkama ve bakım
                </dt>
                <dd className="mt-1.5">{careInfo}</dd>
              </div>
            )}
            {!material && !careInfo && <p>Bu ürün için kumaş bilgisi girilmemiş.</p>}
          </dl>
        )}

        {active === "yorum" && (
          <div>
            {reviews.length === 0 ? (
              <p className="text-[color:var(--color-muted)]">
                Bu ürün için henüz değerlendirme yok. İlk yorumu sen yaz!
              </p>
            ) : (
              <ul className="space-y-6">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="border-b border-[color:var(--color-line)] pb-5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex" aria-label={`${review.rating} yıldız`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={13}
                            className={
                              n <= review.rating
                                ? "fill-[color:var(--color-brand)] text-[color:var(--color-brand)]"
                                : "text-[color:var(--color-line-strong)]"
                            }
                          />
                        ))}
                      </span>
                      <span className="text-[12px] text-[color:var(--color-muted)]">
                        {review.date}
                      </span>
                    </div>
                    {review.title && <p className="mt-2 font-medium">{review.title}</p>}
                    <p className="mt-1 text-[color:var(--color-ink-soft)]">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}

            {/* Yorum formu */}
            <div className="mt-9 border-t border-[color:var(--color-line)] pt-7">
              <h3 className="text-[18px]">Değerlendirme yaz</h3>
              {!isLoggedIn ? (
                <p className="mt-2 text-[13px] text-[color:var(--color-muted)]">
                  Yorum yazmak için{" "}
                  <Link href="/giris" className="text-[color:var(--color-brand)] underline">
                    giriş yapmalısın
                  </Link>
                  .
                </p>
              ) : (
                <form action={action} className="mt-4 space-y-4">
                  <input type="hidden" name="productId" value={productId} />
                  <input type="hidden" name="rating" value={rating} />

                  <div>
                    <span className="label">Puanın</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          aria-label={`${n} yıldız ver`}
                          aria-pressed={rating === n}
                        >
                          <Star
                            size={22}
                            className={
                              n <= rating
                                ? "fill-[color:var(--color-brand)] text-[color:var(--color-brand)]"
                                : "text-[color:var(--color-line-strong)]"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="review-title">Başlık (opsiyonel)</label>
                    <input id="review-title" name="title" className="field" maxLength={120} />
                  </div>

                  <div>
                    <label className="label" htmlFor="review-comment">Yorumun</label>
                    <textarea
                      id="review-comment"
                      name="comment"
                      rows={4}
                      required
                      minLength={10}
                      className="field"
                      placeholder="Beden uyumu, kumaş kalitesi, konfor..."
                    />
                  </div>

                  <button type="submit" disabled={pending} className="btn-primary">
                    {pending ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
                  </button>

                  {state && (
                    <p
                      role="status"
                      className={`text-[13px] ${
                        state.ok
                          ? "text-[color:var(--color-success)]"
                          : "text-[color:var(--color-sale)]"
                      }`}
                    >
                      {state.message}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        )}

        {active === "teslimat" && (
          <div className="space-y-4 text-[color:var(--color-ink-soft)]">
            <p>
              Saat 15:00'e kadar verilen siparişler aynı gün kargoya teslim edilir. Türkiye
              içinde ortalama teslim süresi 1-3 iş günüdür.
            </p>
            <p>
              Teslim tarihinden itibaren 14 gün içinde, hijyen etiketi çıkarılmamış ürünleri
              ücretsiz iade edebilirsin.
            </p>
            <p className="text-[13px]">
              Hijyen kuralları gereği hijyen etiketi çıkarılmış külot, boxer, mayo ve bikini
              altları iade alınamaz.
            </p>
            <Link
              href="/sayfa/iade-ve-degisim"
              className="inline-block text-[13px] text-[color:var(--color-brand)] underline"
            >
              Tüm iade koşullarını oku
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
