import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, productCategories } from "@/db/schema";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const [rows, counts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select({
        categoryId: productCategories.categoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(productCategories)
      .groupBy(productCategories.categoryId),
  ]);

  void eq;

  return (
    <div className="max-w-[1000px]">
      <h1 className="mb-1 text-[26px]">Kategoriler</h1>
      <p className="mb-6 text-[13px] text-[color:var(--color-muted)]">
        Menüde görünen kategori ağacı. Bir kategoriyi başka bir kategorinin altına alarak
        alt kategori yapabilirsin.
      </p>

      <CategoryManager
        categories={rows}
        productCounts={Object.fromEntries(counts.map((row) => [row.categoryId, row.count]))}
      />
    </div>
  );
}
