import { adminUrl } from "@/lib/admin-path";
import { requirePermission } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/db";
import {
  categories,
  productCategories,
  productImages,
  productVariants,
  products,
} from "@/db/schema";
import ProductForm from "@/components/admin/ProductForm";
import ProductImages from "@/components/admin/ProductImages";
import ProductVariants from "@/components/admin/ProductVariants";

export default async function EditProductPage(props: PageProps<"/admin/urunler/[id]">) {
  await requirePermission("products.manage");
  const { id } = await props.params;

  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const product = rows[0];
  if (!product) notFound();

  const [allCategories, selected, images, variants] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select({ categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(eq(productCategories.productId, id)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder)),
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id))
      .orderBy(asc(productVariants.colorName), asc(productVariants.sortOrder)),
  ]);

  const colorNames = [...new Set(variants.map((variant) => variant.colorName))];

  return (
    <div className="max-w-[980px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={adminUrl("urunler")}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-brand)]"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Ürünlere dön
        </Link>
        <Link
          href={`/urun/${product.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-brand)]"
        >
          Sitede görüntüle
          <ExternalLink size={13} strokeWidth={1.5} />
        </Link>
      </div>

      <h1 className="mb-1 text-[26px]">{product.name}</h1>
      <p className="mb-6 text-[13px] text-[color:var(--color-muted)]">
        {product.sku} · {product.viewCount} görüntüleme · {product.soldCount} satış
      </p>

      <div className="space-y-6">
        <ProductForm
          product={product}
          categories={allCategories}
          selectedCategoryIds={selected.map((row) => row.categoryId)}
        />

        <ProductImages productId={product.id} images={images} colorNames={colorNames} />

        <ProductVariants productId={product.id} variants={variants} />
      </div>
    </div>
  );
}
