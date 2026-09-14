import Image from "next/image";
import Link from "next/link";
import { Leaf, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import {
  getBanners,
  getCategoryTree,
  getDiscountedProducts,
  getFeaturedProducts,
  getNewProducts,
} from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/money";
import ProductCard from "@/components/shop/ProductCard";
import HeroSlider from "@/components/shop/HeroSlider";

export default async function HomePage() {
  const [banners, tree, featured, newest, discounted, settings] = await Promise.all([
    getBanners("home_hero"),
    getCategoryTree(),
    getFeaturedProducts(8),
    getNewProducts(8),
    getDiscountedProducts(4),
    getSettings(),
  ]);

  const showcaseCategories = tree.flatMap((parent) => parent.children).slice(0, 6);
  const freeShipping = Number(settings.free_shipping_threshold) || 0;

  return (
    <>
      {/* ------------------------------- HERO ------------------------------ */}
      <HeroSlider banners={banners} />

      {/* --------------------------- GÜVEN ŞERİDİ -------------------------- */}
      <section className="border-b border-[color:var(--color-line)] bg-white">
        <div className="container-page grid grid-cols-2 divide-x divide-[color:var(--color-line)] lg:grid-cols-4">
          {[
            { icon: Truck, title: "Ücretsiz Kargo", text: `${formatPrice(freeShipping)} üzeri siparişlerde` },
            { icon: RefreshCw, title: "Kolay İade", text: "14 gün içinde koşulsuz" },
            { icon: ShieldCheck, title: "Güvenli Ödeme", text: "3D Secure ile korumalı" },
            { icon: Leaf, title: "Sertifikalı Kumaş", text: "Cilt dostu, nefes alan" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3.5 px-2 py-6 lg:px-6">
              <Icon size={22} strokeWidth={1.3} className="shrink-0 text-[color:var(--color-brand)]" />
              <div>
                <p className="text-[12.5px] font-semibold tracking-wide">{title}</p>
                <p className="text-[11.5px] text-[color:var(--color-muted)]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------- KATEGORİLER --------------------------- */}
      <section className="container-page py-16">
        <div className="mb-8 text-center">
          <p className="eyebrow">Kategoriler</p>
          <h2 className="mt-2 text-[30px]">Ne arıyorsun?</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {showcaseCategories.map((category) => (
            <Link key={category.id} href={`/kategori/${category.slug}`} className="group block">
              <div className="relative overflow-hidden bg-[#f3ece8]" style={{ aspectRatio: "4 / 5" }}>
                {category.imageUrl && (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 right-3 text-[13px] font-medium text-white">
                  {category.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------- ÖNE ÇIKAN --------------------------- */}
      {featured.length > 0 && (
        <section className="container-page pb-16">
          <div className="mb-7 flex items-end justify-between border-b border-[color:var(--color-line)] pb-4">
            <div>
              <p className="eyebrow">Seçtiklerimiz</p>
              <h2 className="mt-1.5 text-[28px]">Öne çıkan ürünler</h2>
            </div>
            <Link
              href="/kategori/kadin"
              className="hidden shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--color-brand)] sm:block"
            >
              Tümünü gör →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------ İNDİRİM ---------------------------- */}
      {discounted.length > 0 && (
        <section className="bg-[color:var(--color-brand-soft)] py-16">
          <div className="container-page">
            <div className="mb-7 flex items-end justify-between">
              <div>
                <p className="eyebrow text-[color:var(--color-sale)]">Fırsat</p>
                <h2 className="mt-1.5 text-[28px]">İndirimli ürünler</h2>
              </div>
              <Link
                href="/indirimli"
                className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--color-sale)]"
              >
                Tümü →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
              {discounted.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------- YENİ GELENLER ------------------------- */}
      {newest.length > 0 && (
        <section className="container-page py-16">
          <div className="mb-7 flex items-end justify-between border-b border-[color:var(--color-line)] pb-4">
            <div>
              <p className="eyebrow">Yeni sezon</p>
              <h2 className="mt-1.5 text-[28px]">Yeni gelenler</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
            {newest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------ HİKÂYE ----------------------------- */}
      <section className="border-t border-[color:var(--color-line)] bg-white py-16">
        <div className="container-page max-w-[720px] text-center">
          <p className="eyebrow">{settings.site_name}</p>
          <h2 className="mt-3 text-[30px] leading-snug">
            İç giyim, görünen değil hissedilen konfordur
          </h2>
          <p className="mt-5 text-[14.5px] leading-relaxed text-[color:var(--color-ink-soft)]">
            Her modeli üretime almadan önce gerçek kullanıcılarla test ediyoruz. Sertifikalı,
            nefes alan kumaşlar ve iz bırakmayan dikişlerle; her bedene ve her tene yakışan
            parçalar üretiyoruz.
          </p>
          <Link href="/sayfa/hakkimizda" className="btn-outline mt-7">
            Hikâyemizi oku
          </Link>
        </div>
      </section>
    </>
  );
}
