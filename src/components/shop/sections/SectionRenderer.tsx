/**
 * BÖLÜM ÇİZİCİ
 *
 * Ana sayfa, veritabanındaki bölüm listesini sırayla buraya verir.
 * Her bölüm tipinin kendi çizim fonksiyonu vardır; hangi veriyi çekeceğini
 * de bölüm ayarları (config) belirler.
 */

import Image from "next/image";
import Link from "next/link";
import {
  Truck, RefreshCw, ShieldCheck, Leaf, Heart, Package, CreditCard,
  Headphones, Gift, Sparkles, Lock, Clock,
} from "lucide-react";
import type { HomeSection, SectionConfig, UspItem } from "@/lib/home";
import {
  getBanners,
  getBestsellerProducts,
  getCategoryTree,
  getDiscountedProducts,
  getFeaturedProducts,
  getNewProducts,
  getProductsByCategorySlug,
  type ProductCardData,
} from "@/lib/catalog";
import ProductCard from "@/components/shop/ProductCard";
import HeroCarousel from "@/components/shop/HeroCarousel";
import NewsletterForm from "@/components/shop/NewsletterForm";
import { sanitizeRichText, safeUrl } from "@/lib/security";

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  truck: Truck,
  refresh: RefreshCw,
  shield: ShieldCheck,
  leaf: Leaf,
  heart: Heart,
  package: Package,
  "credit-card": CreditCard,
  headphones: Headphones,
  gift: Gift,
  sparkles: Sparkles,
  lock: Lock,
  clock: Clock,
};

function backgroundClass(config: SectionConfig): string {
  if (config.background === "soft") return "bg-[color:var(--color-surface-2)]";
  if (config.background === "ink") return "bg-[color:var(--color-ink)] text-white";
  return "";
}

/* ------------------------------ BAŞLIK ---------------------------------- */

function SectionHead({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  if (!title && !subtitle && !ctaLabel) return null;
  return (
    <div className="section-head">
      <div>
        {title && <h2>{title}</h2>}
        {subtitle && (
          <p className="mt-1.5 max-w-[560px] text-[13.5px] text-[color:var(--color-ink-soft)]">
            {subtitle}
          </p>
        )}
      </div>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="shrink-0 border-b border-[color:var(--color-ink)] pb-0.5 text-[12.5px] font-semibold"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

/* ------------------------------- BÖLÜMLER ------------------------------- */

async function HeroSection({ section }: { section: HomeSection }) {
  const slides = await getBanners(section.config.position ?? "home_hero");
  if (!slides.length) return null;
  return (
    <HeroCarousel
      slides={slides}
      autoplayMs={section.config.autoplayMs ?? 6000}
      showArrows={section.config.showArrows !== false}
      showDots={section.config.showDots !== false}
      height={section.config.height ?? "tall"}
    />
  );
}

function UspSection({ section }: { section: HomeSection }) {
  const items: UspItem[] = section.config.items ?? [];
  if (!items.length) return null;
  return (
    <section className="border-y border-[color:var(--color-line)] bg-white">
      <div className="container-page grid grid-cols-2 gap-px lg:grid-cols-4">
        {items.map((item, i) => {
          const Icon = ICONS[item.icon] ?? ShieldCheck;
          return (
            <div
              key={`${item.title}-${i}`}
              className="flex items-center gap-3 py-5 lg:justify-center lg:px-4"
            >
              <Icon size={19} strokeWidth={1.4} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold">{item.title}</p>
                <p className="truncate text-[11.5px] text-[color:var(--color-muted)]">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function CategoriesSection({ section }: { section: HomeSection }) {
  const tree = await getCategoryTree();
  const config = section.config;
  const limit = config.limit ?? 6;

  let list =
    config.source === "roots"
      ? tree
      : config.source === "manual"
        ? tree
            .flatMap((parent) => [parent, ...parent.children])
            .filter((c) => (config.categoryIds ?? []).includes(c.id))
        : tree.flatMap((parent) => parent.children);

  list = list.slice(0, limit);
  if (!list.length) return null;

  const columns = config.columns ?? 6;
  const gridClass =
    columns === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
  const ratio =
    config.shape === "square" ? "1 / 1" : config.shape === "wide" ? "4 / 3" : "3 / 4";

  /*
   * KART STİLİ
   * Görsel üstte, altında büyük başlık ve bir düğme. Az sayıda kutuyla
   * (2-4) vitrinin girişinde yön gösterici olarak kullanılır.
   *
   * Düğme ayrı bir <a> DEĞİL: tüm kutu zaten bağlantı. İç içe bağlantı
   * geçersiz HTML'dir ve ekran okuyucuda aynı hedefi iki kez okutur.
   * Düğme görünümlü bir <span> yeterli.
   */
  const isCard = config.tileStyle === "card";
  const buttonLabel = config.tileButtonLabel?.trim() || "Alışverişe başla";

  return (
    <section className={`${backgroundClass(config)} py-12 lg:py-16`}>
      <div className="container-page">
        <SectionHead
          title={section.title}
          subtitle={section.subtitle}
          ctaLabel={config.ctaLabel}
          ctaHref={config.ctaHref}
        />
        <div className={`grid ${isCard ? "gap-4 sm:gap-5" : "gap-2.5"} ${gridClass}`}>
          {list.map((category) => (
            <Link key={category.id} href={`/kategori/${category.slug}`} className="group block">
              <div
                className="relative overflow-hidden bg-[color:var(--color-surface-3)]"
                style={{ aspectRatio: ratio }}
              >
                {category.imageUrl && (
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    sizes={
                      isCard
                        ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                    }
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                {!isCard && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                    <span className="absolute inset-x-3 bottom-3 text-[13px] font-semibold text-white">
                      {category.name}
                    </span>
                  </>
                )}
              </div>

              {isCard && (
                <div className="bg-[color:var(--color-surface-2)] px-4 py-6 text-center">
                  <h3 className="text-[26px] font-bold uppercase leading-none tracking-[-0.01em] text-[color:var(--color-brand)] sm:text-[30px]">
                    {category.name}
                  </h3>
                  <span className="mt-4 inline-block bg-[color:var(--color-brand)] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-white transition-colors group-hover:bg-[color:var(--color-brand-dark)]">
                    {buttonLabel}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

async function ProductsSection({ section }: { section: HomeSection }) {
  const config = section.config;
  const limit = config.limit ?? 8;

  let products: ProductCardData[] = [];
  switch (config.source) {
    case "new":
      products = await getNewProducts(limit);
      break;
    case "discounted":
      products = await getDiscountedProducts(limit);
      break;
    case "bestsellers":
      products = await getBestsellerProducts(limit);
      break;
    case "category":
      products = config.categorySlug
        ? await getProductsByCategorySlug(config.categorySlug, limit)
        : [];
      break;
    default:
      products = await getFeaturedProducts(limit);
  }

  if (!products.length) return null;

  return (
    <section className={`${backgroundClass(config)} py-12 lg:py-16`}>
      <div className="container-page">
        <SectionHead
          title={section.title}
          subtitle={section.subtitle}
          ctaLabel={config.ctaLabel}
          ctaHref={config.ctaHref}
        />
        {config.layout === "rail" ? (
          <div className="rail">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PromoSection({ section }: { section: HomeSection }) {
  const config = section.config;
  const dark = config.theme === "dark";
  const href = safeUrl(config.buttonUrl) ?? "/";

  // Görsel yoksa bölüm yine de düz zeminle çizilir — panelden görsel
  // eklenene kadar sayfa bozulmaz.
  const alignClass =
    config.align === "center"
      ? "items-center text-center mx-auto"
      : config.align === "right"
        ? "items-end text-right ml-auto"
        : "items-start text-left";

  if (config.layout === "split") {
    return (
      <section className={backgroundClass(config)}>
        <div className="container-page grid items-center gap-8 py-12 lg:grid-cols-2 lg:py-16">
          <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--color-surface-3)]">
            {config.imageUrl && (
              <Image src={config.imageUrl} alt="" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            )}
          </div>
          <div className="max-w-[460px]">
            {config.eyebrow && <p className="eyebrow">{config.eyebrow}</p>}
            {section.title && <h2 className="mt-3 text-[26px] sm:text-[32px]">{section.title}</h2>}
            {config.text && (
              <p className="mt-4 text-[14.5px] text-[color:var(--color-ink-soft)]">{config.text}</p>
            )}
            {config.buttonLabel && (
              <Link href={href} className="btn-primary mt-7">
                {config.buttonLabel}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[color:var(--color-surface-3)]">
      <div className="relative h-[280px] sm:h-[360px] lg:h-[420px]">
        {config.imageUrl && (
          <>
            <Image
              src={config.imageUrl}
              alt=""
              fill
              sizes="100vw"
              className={`object-cover ${config.mobileImageUrl ? "hidden sm:block" : ""}`}
            />
            {config.mobileImageUrl && (
              <Image src={config.mobileImageUrl} alt="" fill sizes="100vw" className="object-cover sm:hidden" />
            )}
          </>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: dark
              ? `rgba(255,255,255,${(config.overlay ?? 25) / 100})`
              : `rgba(0,0,0,${(config.overlay ?? 25) / 100})`,
          }}
        />
        <div className="relative flex h-full items-center">
          <div className="container-page">
            <div className={`flex max-w-[480px] flex-col ${alignClass}`}>
              {config.eyebrow && (
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    dark ? "text-[color:var(--color-ink-soft)]" : "text-white/85"
                  }`}
                >
                  {config.eyebrow}
                </p>
              )}
              {section.title && (
                <h2
                  className={`mt-3 text-[28px] sm:text-[38px] ${
                    dark ? "" : "text-white"
                  }`}
                >
                  {section.title}
                </h2>
              )}
              {config.text && (
                <p className={`mt-4 text-[14.5px] ${dark ? "text-[color:var(--color-ink-soft)]" : "text-white/85"}`}>
                  {config.text}
                </p>
              )}
              {config.buttonLabel && (
                <Link
                  href={href}
                  className={
                    dark
                      ? "btn-primary mt-7"
                      : "btn mt-7 inline-flex bg-white text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-2)]"
                  }
                >
                  {config.buttonLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RichTextSection({ section }: { section: HomeSection }) {
  const config = section.config;
  const html = config.html ? sanitizeRichText(config.html) : "";
  return (
    <section className={`${backgroundClass(config)} border-t border-[color:var(--color-line)] py-14 lg:py-20`}>
      <div
        className="container-page text-center"
        style={{ maxWidth: config.maxWidth ? `${config.maxWidth}px` : undefined }}
      >
        {config.eyebrow && <p className="eyebrow">{config.eyebrow}</p>}
        {section.title && <h2 className="mt-3 text-[26px] sm:text-[32px]">{section.title}</h2>}
        {section.subtitle && (
          <p className="mx-auto mt-5 max-w-[620px] text-[14.5px] leading-relaxed text-[color:var(--color-ink-soft)]">
            {section.subtitle}
          </p>
        )}
        {html && (
          <div
            className="prose mx-auto mt-5 max-w-[620px] text-[14.5px] leading-relaxed text-[color:var(--color-ink-soft)]"
            // İçerik panelden gelir ve sanitizeRichText ile temizlenmiştir.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        {config.buttonLabel && config.buttonUrl && (
          <Link href={safeUrl(config.buttonUrl) ?? "/"} className="btn-outline mt-7">
            {config.buttonLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

function NewsletterSection({ section }: { section: HomeSection }) {
  return (
    <section className={`${backgroundClass(section.config) || "bg-[color:var(--color-surface-2)]"} py-14`}>
      <div className="container-page max-w-[560px] text-center">
        {section.title && <h2 className="text-[24px] sm:text-[28px]">{section.title}</h2>}
        {section.subtitle && (
          <p className="mx-auto mt-3 max-w-[460px] text-[13.5px] text-[color:var(--color-ink-soft)]">
            {section.subtitle}
          </p>
        )}
        <div className="mx-auto mt-6 max-w-[420px]">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- DAĞITICI ------------------------------- */

export default async function SectionRenderer({ section }: { section: HomeSection }) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} />;
    case "usp":
      return <UspSection section={section} />;
    case "categories":
      return <CategoriesSection section={section} />;
    case "products":
      return <ProductsSection section={section} />;
    case "promo":
      return <PromoSection section={section} />;
    case "richtext":
      return <RichTextSection section={section} />;
    case "newsletter":
      return <NewsletterSection section={section} />;
    default:
      return null;
  }
}
