import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { getProductBySlug, getRelatedProducts, incrementProductView } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { whatsappNumber } from "@/lib/whatsapp";
import { formatDate } from "@/lib/utils";
import ProductBuyBox from "@/components/shop/ProductBuyBox";
import ProductCard from "@/components/shop/ProductCard";
import ProductTabs from "@/components/shop/ProductTabs";

export async function generateMetadata(props: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün bulunamadı" };
  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.description.slice(0, 155),
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.metaDescription ?? undefined,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/urun/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [session, related, settings] = await Promise.all([
    getSession(),
    getRelatedProducts(product.id, 4),
    getSettings(),
  ]);
  const freeShippingThreshold = Number(settings.free_shipping_threshold) || 0;
  const waNumber = whatsappNumber(settings.whatsapp_number);

  let isFavorite = false;
  if (session) {
    const rows = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, session.userId), eq(favorites.productId, product.id)))
      .limit(1);
    isFavorite = Boolean(rows[0]);
  }

  // Görüntüleme sayacı (hata olursa sayfayı bozmasın)
  incrementProductView(product.id).catch(() => {});

  const mainCategory =
    product.categories.find((category) => category.parentId !== null) ?? product.categories[0];

  // Arama motorları için ürün yapılandırılmış verisi
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "TRY",
      availability: product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.averageRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.averageRating,
        reviewCount: product.reviews.length,
      },
    }),
  };

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        // "<" kaçışlanır: açıklamada "</script>" geçse etiketi kapatıp kod çalıştıramaz.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Kırılım yolu */}
      <nav
        aria-label="Konum"
        className="mb-7 flex flex-wrap items-center gap-2 text-[12px] text-[color:var(--color-muted)]"
      >
        <Link href="/" className="hover:text-[color:var(--color-ink)]">Ana sayfa</Link>
        {mainCategory && (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/kategori/${mainCategory.slug}`}
              className="hover:text-[color:var(--color-ink)]"
            >
              {mainCategory.name}
            </Link>
          </>
        )}
        <span aria-hidden>/</span>
        <span className="text-[color:var(--color-ink)]">{product.name}</span>
      </nav>

      <ProductBuyBox
        productId={product.id}
        productName={product.name}
        sku={product.sku}
        brandName={product.brandName}
        rating={product.averageRating ? { value: product.averageRating, count: product.reviews.length } : null}
        price={product.price}
        compareAtPrice={product.compareAtPrice}
        images={product.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
          colorName: image.colorName,
        }))}
        variants={product.variants}
        isFavorite={isFavorite}
        freeShippingThreshold={freeShippingThreshold}
        whatsapp={
          waNumber
            ? {
                number: waNumber,
                message: settings.whatsapp_message,
                sku: product.sku,
                url: `${(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/urun/${product.slug}`,
              }
            : null
        }
      />

      <ProductTabs
        description={product.description}
        material={product.material}
        careInfo={product.careInfo}
        modelInfo={product.modelInfo}
        productId={product.id}
        isLoggedIn={Boolean(session)}
        reviews={product.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          date: formatDate(review.createdAt),
        }))}
      />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 border-b border-[color:var(--color-line)] pb-3 text-[22px]">
            Benzer ürünler
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-4 lg:gap-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
