"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, Minus, Plus, Ruler, ShoppingBag, Truck } from "lucide-react";
import type { ProductVariant } from "@/db/schema";
import { discountPercent, formatPrice } from "@/lib/money";
import { addToCartAction } from "@/actions/cart";
import { toggleFavoriteAction } from "@/actions/account";
import ProductGallery, { type GalleryImage } from "./ProductGallery";
import SizeGuideDialog from "./SizeGuideDialog";

export default function ProductBuyBox({
  productId,
  productName,
  price,
  compareAtPrice,
  images,
  variants,
  isFavorite,
  freeShippingThreshold,
}: {
  productId: string;
  productName: string;
  price: number;
  compareAtPrice: number | null;
  images: GalleryImage[];
  variants: ProductVariant[];
  isFavorite: boolean;
  freeShippingThreshold: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Renkler (varyantlardan türetilir)
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of variants) if (!map.has(v.colorName)) map.set(v.colorName, v.colorHex);
    return [...map].map(([name, hex]) => ({ name, hex }));
  }, [variants]);

  const [color, setColor] = useState(colors[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [favorite, setFavorite] = useState(isFavorite);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Seçili renkteki bedenler
  const sizesForColor = useMemo(
    () => variants.filter((v) => v.colorName === color),
    [variants, color],
  );

  /*
   * "Beden" mi, "Seçenek" mi?
   *
   * Varyantın ikinci ekseni şemada tek bir alandır (size). İç giyimde bu
   * gerçekten bedendir (S, M, 75B); jel, prezervatif ya da oyuncak
   * tarafında hacim/adet olur ("100 ml", "12'li"). Giysi bedenine
   * benzemeyen bir değer varsa başlık "Seçenek"e döner ve beden tablosu
   * bağlantısı gizlenir — yoksa müşteriye 100 ml için beden tablosu
   * önerilmiş olur.
   */
  const isApparelSizing = useMemo(() => {
    const apparel = /^(xs|s|m|l|xl|xxl|\d{2,3}[a-f]|\d{2}|s\/m|m\/l|l\/xl)$/i;
    return variants.every((v) => apparel.test(v.size.trim()));
  }, [variants]);
  const sizeLabel = isApparelSizing ? "Beden" : "Seçenek";

  /*
   * Tek seçenekli ürün ("Tek beden", tek hacim) için seçim listesi
   * göstermenin anlamı yok: tek düğmeyi müşteriye tıklatmak, sepete
   * eklemeyi gereksiz yere bir adım uzatır. Seçenek kendiliğinden
   * işaretlenir ve blok gizlenir.
   */
  /*
   * Tek renkte üretilen ürünlerde (jel, prezervatif, makine) varyant
   * şeması gereği bir renk adı yazmak zorundayız; katalogda bu "Standart"
   * geçiyor. Müşteriye "Renk: Standart" diye tek bir daire göstermek
   * bilgi değil gürültüdür — o blok gizlenir.
   */
  const showColors = colors.length > 1 || (colors.length === 1 && colors[0].name !== "Standart");

  const singleOption = sizesForColor.length === 1;
  useEffect(() => {
    if (singleOption) setSize(sizesForColor[0].size);
  }, [singleOption, sizesForColor]);

  const selectedVariant = sizesForColor.find((v) => v.size === size) ?? null;
  const activePrice = selectedVariant?.priceOverride ?? price;
  const discount = discountPercent(activePrice, compareAtPrice);
  const maxQuantity = selectedVariant ? Math.min(selectedVariant.stock, 10) : 10;

  function handleAdd() {
    if (!selectedVariant) {
      setFeedback({ ok: false, text: `Lütfen bir ${sizeLabel.toLocaleLowerCase("tr")} seç.` });
      return;
    }
    startTransition(async () => {
      const result = await addToCartAction(selectedVariant.id, quantity);
      setFeedback({ ok: result.ok, text: result.message ?? "" });
      if (result.ok) router.refresh();
    });
  }

  function handleFavorite() {
    startTransition(async () => {
      const result = await toggleFavoriteAction(productId);
      if (result.requiresLogin) {
        router.push("/giris?next=/urun");
        return;
      }
      setFavorite(result.isFavorite);
    });
  }

  return (
    <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-14">
      <ProductGallery images={images} activeColor={color} productName={productName} />

      <div className="lg:pt-2">
        {/* Fiyat */}
        <div className="flex items-baseline gap-3">
          <span className="text-[26px] font-semibold tracking-tight">
            {formatPrice(activePrice)}
          </span>
          {compareAtPrice && compareAtPrice > activePrice && (
            <>
              <span className="text-[15px] text-[color:var(--color-muted)] line-through">
                {formatPrice(compareAtPrice)}
              </span>
              <span className="badge bg-[color:var(--color-sale)] text-white">%{discount}</span>
            </>
          )}
        </div>
        <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">KDV dahil fiyat</p>

        {/* Renk */}
        {showColors && (
          <div className="mt-7">
            <p className="mb-2.5 text-[12px] font-medium">
              Renk: <span className="text-[color:var(--color-ink-soft)]">{color}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((item) => {
                const hasStock = variants.some(
                  (v) => v.colorName === item.name && v.stock > 0,
                );
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setColor(item.name);
                      setSize(null);
                      setQuantity(1);
                      setFeedback(null);
                    }}
                    title={item.name}
                    aria-label={item.name}
                    aria-pressed={color === item.name}
                    className={`relative h-9 w-9 rounded-full ring-offset-2 transition-all ${
                      color === item.name
                        ? "ring-2 ring-[color:var(--color-ink)]"
                        : "ring-1 ring-[color:var(--color-line-strong)]"
                    } ${!hasStock ? "opacity-40" : ""}`}
                    style={{ backgroundColor: item.hex }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Beden / seçenek */}
        {sizesForColor.length > 0 && !singleOption && (
          <div className="mt-7">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[12px] font-medium">{sizeLabel}</p>
              {isApparelSizing && (
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="flex items-center gap-1.5 text-[12px] text-[color:var(--color-brand)] underline"
                >
                  <Ruler size={13} strokeWidth={1.5} />
                  Beden tablosu
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {sizesForColor.map((variant) => {
                const out = variant.stock <= 0;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={out}
                    onClick={() => {
                      setSize(variant.size);
                      setQuantity(1);
                      setFeedback(null);
                    }}
                    aria-pressed={size === variant.size}
                    className={`relative min-w-[54px] border px-3 py-2.5 text-[13px] transition-colors ${
                      size === variant.size
                        ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
                        : "border-[color:var(--color-line-strong)] bg-white hover:border-[color:var(--color-ink)]"
                    } ${out ? "cursor-not-allowed text-[color:var(--color-muted)] line-through opacity-55" : ""}`}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>

            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
              <p className="mt-2.5 text-[12px] text-[color:var(--color-sale)]">
                Son {selectedVariant.stock} adet!
              </p>
            )}
          </div>
        )}

        {/* Adet + Sepete ekle */}
        <div className="mt-7 flex gap-3">
          <div className="flex items-center border border-[color:var(--color-line-strong)] bg-white">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="px-3 py-3.5 disabled:opacity-35"
              aria-label="Adeti azalt"
            >
              <Minus size={14} strokeWidth={1.5} />
            </button>
            <span className="w-9 text-center text-[14px] font-medium" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              className="px-3 py-3.5 disabled:opacity-35"
              aria-label="Adeti arttır"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={pending}
            className="btn-primary flex-1"
          >
            <ShoppingBag size={16} strokeWidth={1.5} />
            {pending ? "Ekleniyor..." : "Sepete Ekle"}
          </button>

          <button
            type="button"
            onClick={handleFavorite}
            disabled={pending}
            aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            aria-pressed={favorite}
            className="flex w-[52px] items-center justify-center border border-[color:var(--color-line-strong)] bg-white transition-colors hover:border-[color:var(--color-ink)]"
          >
            <Heart
              size={18}
              strokeWidth={1.5}
              className={favorite ? "fill-[color:var(--color-sale)] text-[color:var(--color-sale)]" : ""}
            />
          </button>
        </div>

        {feedback && (
          <p
            role="status"
            className={`mt-3 flex items-center gap-1.5 text-[13px] ${
              feedback.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
            }`}
          >
            {feedback.ok && <Check size={14} strokeWidth={2} />}
            {feedback.text}
          </p>
        )}

        {/* Kargo bilgisi */}
        <div className="mt-6 flex items-start gap-2.5 border border-[color:var(--color-line)] bg-white p-3.5 text-[12.5px] text-[color:var(--color-ink-soft)]">
          <Truck size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[color:var(--color-brand)]" />
          <span>
            {formatPrice(freeShippingThreshold)} ve üzeri siparişlerde <strong>kargo ücretsiz</strong>.
            Saat 15:00&apos;e kadar verilen siparişler aynı gün kargoda.
          </span>
        </div>
      </div>

      <SizeGuideDialog open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}
