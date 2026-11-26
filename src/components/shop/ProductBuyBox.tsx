"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Heart, Lock, Minus, Package, Plus, RotateCcw, Ruler, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import type { ProductVariant } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import { addToCartAction } from "@/actions/cart";
import { toggleFavoriteAction } from "@/actions/account";
import Price from "./Price";
import ProductGallery, { type GalleryImage } from "./ProductGallery";
import SizeGuideDialog from "./SizeGuideDialog";
import WhatsAppIcon from "./WhatsAppIcon";

export default function ProductBuyBox({
  productId,
  productName,
  sku,
  brandName,
  rating,
  price,
  compareAtPrice,
  images,
  variants,
  isFavorite,
  freeShippingThreshold,
  whatsapp,
}: {
  productId: string;
  productName: string;
  sku: string;
  brandName?: string | null;
  rating?: { value: number; count: number } | null;
  price: number;
  compareAtPrice: number | null;
  images: GalleryImage[];
  variants: ProductVariant[];
  isFavorite: boolean;
  freeShippingThreshold: number;
  /** Panelde WhatsApp numarası girildiyse "WhatsApp ile sipariş ver" çıkar */
  whatsapp?: { number: string; message: string; sku: string; url: string } | null;
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
  // Efekt kurup state yazmak yerine render sırasında türetiyoruz: tek
  // seçenek varsa seçili sayılır, fazladan bir render turu olmaz.
  const effectiveSize = singleOption ? sizesForColor[0].size : size;

  const selectedVariant = sizesForColor.find((v) => v.size === effectiveSize) ?? null;
  const activePrice = selectedVariant?.priceOverride ?? price;
  const maxQuantity = selectedVariant ? Math.min(selectedVariant.stock, 10) : 10;

  function handleAdd(buyNow = false) {
    if (!selectedVariant) {
      setFeedback({ ok: false, text: `Lütfen bir ${sizeLabel.toLocaleLowerCase("tr")} seç.` });
      return;
    }
    startTransition(async () => {
      const result = await addToCartAction(selectedVariant.id, quantity);
      if (result.ok && buyNow) {
        router.push("/sepet");
        return;
      }
      setFeedback({ ok: result.ok, text: result.message ?? "" });
      if (result.ok) router.refresh();
    });
  }

  function handleFavorite() {
    startTransition(async () => {
      const result = await toggleFavoriteAction(productId);
      if (result.requiresLogin) {
        router.push(`/giris?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setFavorite(result.isFavorite);
    });
  }

  return (
    <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-14">
      <ProductGallery images={images} activeColor={color} productName={productName} />

      <div className="lg:pt-2">
        {/* Başlık */}
        {brandName && (
          <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-brand)]">
            {brandName}
          </p>
        )}
        <h1 className="text-[22px] font-semibold leading-snug tracking-[-0.01em] sm:text-[26px]">
          {productName}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[color:var(--color-muted)]">
          <span>
            Ürün kodu: <span className="font-medium text-[color:var(--color-ink-soft)]">{sku}</span>
          </span>
          {rating && (
            <a href="#yorumlar" className="flex items-center gap-1 hover:underline">
              <span aria-hidden className="text-[#f5a623]">★</span>
              {rating.value} ({rating.count} değerlendirme)
            </a>
          )}
        </div>

        {/* Fiyat */}
        <div className="mt-5 rounded-[var(--radius-card)] bg-[color:var(--color-surface-2)] px-4 py-4">
          <Price price={activePrice} compareAtPrice={compareAtPrice} size="lg" showBadge />
          <p className="mt-2 text-[12px] text-[color:var(--color-muted)]">KDV dahil fiyat</p>
        </div>

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

        {/*
          HİÇ SEÇENEĞİ OLMAYAN ÜRÜN
          Stok ve sepet kaydı varyanta bağlıdır; varyantı olmayan ürün
          satın alınamaz. Çalışmayan bir "Sepete Ekle" düğmesi göstermek
          yerine durumu açıkça söylüyoruz — müşteri boşuna denemesin.
        */}
        {variants.length === 0 ? (
          <div className="mt-7 border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] p-4 text-[13px]">
            Bu ürün şu an satışta değil.
            <Link href="/iletisim" className="ml-1 link-underline">
              Bize ulaş
            </Link>
            , ne zaman geleceğini söyleyelim.
          </div>
        ) : (
        <>
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
            onClick={() => handleAdd(false)}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-card)] bg-[color:var(--color-sale)] px-4 text-[13.5px] font-bold uppercase tracking-[0.03em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <ShoppingBag size={17} strokeWidth={1.8} />
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

        <button
          type="button"
          onClick={() => handleAdd(true)}
          disabled={pending}
          className="mt-3 flex h-[50px] w-full items-center justify-center rounded-[var(--radius-card)] bg-[color:var(--color-brand)] text-[13.5px] font-bold uppercase tracking-[0.03em] text-white transition-colors hover:bg-[color:var(--color-brand-dark)] disabled:opacity-50"
        >
          Hemen Al
        </button>

        {whatsapp && (
          <a
            href={whatsappHref(whatsapp, {
              productName,
              variant: selectedVariant
                ? [selectedVariant.colorName, selectedVariant.size]
                    .filter((part) => part && part !== "Standart" && part !== "Tek ebat")
                    .join(" / ")
                : "",
              quantity,
              price: formatPrice(activePrice),
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 border border-[#1fa855] bg-[#25d366] px-6 py-3.5 text-[13px] font-semibold text-[#0b3d1f] transition-colors hover:bg-[#1fbe5b]"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            <WhatsAppIcon size={18} />
            WhatsApp ile sipariş ver
          </a>
        )}

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
        </>
        )}

        {/* Güvenceler */}
        <ul className="mt-6 grid grid-cols-2 gap-2.5">
          {[
            { icon: Truck, title: `${formatPrice(freeShippingThreshold)} üzeri ücretsiz kargo`, text: "Hafta içi 15:00'e kadar genellikle aynı gün kargoda" },
            { icon: Package, title: "Gizli paketleme", text: "Düz koli, ürün adı yazmayan fiş" },
            { icon: ShieldCheck, title: "Orijinal ürün", text: "Faturalı, ithalatçı firmadan" },
            { icon: Lock, title: "Güvenli alışveriş", text: "Kart bilgisi saklanmaz" },
          ].map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex items-start gap-2.5 rounded-[var(--radius-card)] border border-[color:var(--color-line)] bg-white p-3"
            >
              <Icon size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[color:var(--color-brand)]" />
              <span>
                <span className="block text-[12.5px] font-semibold leading-tight">{title}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-[color:var(--color-muted)]">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[color:var(--color-ink-soft)]">
          <RotateCcw size={14} strokeWidth={1.6} />
          Ambalajı açılmamış ürünlerde 14 gün iade.{" "}
          <Link href="/sayfa/iade-degisim" className="underline">Koşullar</Link>
        </p>

      </div>

      <SizeGuideDialog open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}

/** wa.me bağlantısı: mesajda ürün, seçenek, adet, fiyat, kod ve adres hazır gelir. */
function whatsappHref(
  wa: { number: string; message: string; sku: string; url: string },
  item: { productName: string; variant: string; quantity: number; price: string },
) {
  const lines = [
    wa.message || "Merhaba, bu ürünü sipariş etmek istiyorum:",
    "",
    `Ürün: ${item.productName}`,
    item.variant ? `Seçenek: ${item.variant}` : "",
    `Adet: ${item.quantity}`,
    `Fiyat: ${item.price}`,
    `Ürün kodu: ${wa.sku}`,
    wa.url,
  ].filter((line, index) => line || index === 1);
  return `https://wa.me/${wa.number}?text=${encodeURIComponent(lines.join("\n"))}`;
}
