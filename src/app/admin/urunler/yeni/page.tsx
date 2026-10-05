import { adminUrl } from "@/lib/admin-path";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { categories } from "@/db/schema";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <div className="max-w-[880px]">
      <Link
        href={adminUrl("urunler")}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--color-brand)]"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Ürünlere dön
      </Link>

      <h1 className="mb-1 text-[26px]">Yeni Ürün</h1>
      <p className="mb-6 text-[13px] text-[color:var(--color-muted)]">
        Ürünü kaydettikten sonra görsel ve beden/renk varyantlarını ekleyebilirsin.
      </p>

      <ProductForm product={null} categories={allCategories} selectedCategoryIds={[]} />
    </div>
  );
}
