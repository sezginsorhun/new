import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Heart } from "lucide-react";
import { db } from "@/db";
import { favorites, products, productImages, productVariants } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import ProductCard from "@/components/shop/ProductCard";
import type { ProductCardData } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Favorilerim",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
    })
    .from(favorites)
    .innerJoin(products, eq(favorites.productId, products.id))
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.createdAt));

  if (rows.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Heart size={38} strokeWidth={1} className="mx-auto text-[color:var(--color-line-strong)]" />
        <p className="mt-4 text-[15px]">Favori listen boş</p>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Beğendiğin ürünlerdeki kalp simgesine dokunarak buraya ekleyebilirsin.
        </p>
        <Link href="/" className="btn-primary mt-5">Ürünleri Keşfet</Link>
      </div>
    );
  }

  // Görsel, renk ve stok bilgisini ekle
  const ids = rows.map((row) => row.id);
  const [images, variants] = await Promise.all([
    db.select().from(productImages),
    db.select().from(productVariants),
  ]);

  const items: ProductCardData[] = rows.map((row) => {
    const rowImages = images
      .filter((image) => image.productId === row.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({ url: image.url, alt: image.alt, colorName: image.colorName }));

    const colorMap = new Map<string, string>();
    let inStock = false;
    for (const variant of variants) {
      if (variant.productId !== row.id) continue;
      if (!colorMap.has(variant.colorName)) colorMap.set(variant.colorName, variant.colorHex);
      if (variant.stock > 0) inStock = true;
    }

    return {
      ...row,
      images: rowImages,
      colors: [...colorMap].map(([name, hex]) => ({ name, hex })),
      inStock,
      rating: null,
      reviewCount: 0,
    };
  });

  void ids;

  return (
    <div>
      <h2 className="mb-5 text-[18px]">Favorilerim ({items.length})</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 lg:gap-x-5">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
