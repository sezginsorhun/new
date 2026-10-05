import { adminUrl } from "@/lib/admin-path";
import Image from "next/image";
import Link from "next/link";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { Plus, Search } from "lucide-react";
import { db } from "@/db";
import { categories, productCategories, productImages, productVariants, products } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import ProductRowActions from "@/components/admin/ProductRowActions";

const PER_PAGE = 20;

export default async function AdminProductsPage(props: PageProps<"/admin/urunler">) {
  const query = await props.searchParams;
  const term = typeof query.q === "string" ? query.q.trim() : "";
  const categorySlug = typeof query.kategori === "string" ? query.kategori : "";
  const durum = typeof query.durum === "string" ? query.durum : "";
  const page = Math.max(Number(query.sayfa ?? 1) || 1, 1);

  const filters = [];
  if (term) {
    filters.push(
      or(like(products.name, `%${term}%`), like(products.sku, `%${term}%`))!,
    );
  }
  if (durum === "aktif") filters.push(eq(products.isActive, true));
  if (durum === "pasif") filters.push(eq(products.isActive, false));
  if (categorySlug) {
    filters.push(
      sql`exists (
        select 1 from ${productCategories}
        join ${categories} on ${categories.id} = ${productCategories.categoryId}
        where ${productCategories.productId} = ${products.id}
          and ${categories.slug} = ${categorySlug}
      )`,
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, countRows, allCategories, images, variantStats] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.updatedAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ count: sql<number>`count(*)` }).from(products).where(where),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(productImages).orderBy(asc(productImages.sortOrder)),
    db
      .select({
        productId: productVariants.productId,
        variantCount: sql<number>`count(*)`.as("variantCount"),
        totalStock: sql<number>`coalesce(sum(${productVariants.stock}),0)`.as("totalStock"),
      })
      .from(productVariants)
      .groupBy(productVariants.productId),
  ]);

  const total = countRows[0]?.count ?? 0;
  const pageCount = Math.max(Math.ceil(total / PER_PAGE), 1);

  const coverByProduct = new Map<string, string>();
  for (const image of images) {
    if (!coverByProduct.has(image.productId)) coverByProduct.set(image.productId, image.url);
  }

  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const base = { q: term, kategori: categorySlug, durum, sayfa: String(page), ...overrides };
    for (const [key, value] of Object.entries(base)) {
      if (value && value !== "1") params.set(key, value);
      else if (key !== "sayfa" && value) params.set(key, value);
    }
    return `?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px]">Ürünler</h1>
          <p className="text-[12.5px] text-[color:var(--color-muted)]">{total} ürün</p>
        </div>
        <Link href={adminUrl("urunler/yeni")} className="btn-primary btn-sm">
          <Plus size={14} strokeWidth={1.5} />
          Yeni Ürün
        </Link>
      </div>

      {/* Filtreler */}
      <form className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1">
          <label className="label" htmlFor="ap-q">Ara</label>
          <div className="relative">
            <Search
              size={15}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
            />
            <input
              id="ap-q"
              name="q"
              defaultValue={term}
              placeholder="Ürün adı veya kodu"
              className="field pl-9"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="ap-cat">Kategori</label>
          <select id="ap-cat" name="kategori" defaultValue={categorySlug} className="field !w-auto">
            <option value="">Tümü</option>
            {allCategories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.parentId ? "— " : ""}
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ap-durum">Durum</label>
          <select id="ap-durum" name="durum" defaultValue={durum} className="field !w-auto">
            <option value="">Tümü</option>
            <option value="aktif">Aktif</option>
            <option value="pasif">Pasif</option>
          </select>
        </div>
        <button type="submit" className="btn-outline btn-sm">Filtrele</button>
        {(term || categorySlug || durum) && (
          <Link href={adminUrl("urunler")} className="btn-ghost">Temizle</Link>
        )}
      </form>

      {/* Tablo */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-basic min-w-[860px]">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Kod</th>
                <th className="text-right">Fiyat</th>
                <th className="text-right">Varyant</th>
                <th className="text-right">Stok</th>
                <th>Durum</th>
                <th className="text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[color:var(--color-muted)]">
                    Ürün bulunamadı.
                  </td>
                </tr>
              )}
              {rows.map((product) => {
                const stats = variantStats.find((s) => s.productId === product.id);
                const cover = coverByProduct.get(product.id);
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-9 shrink-0 overflow-hidden bg-[#f3ece8]">
                          {cover && (
                            <Image src={cover} alt="" fill sizes="36px" className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={adminUrl(`urunler/${product.id}`)}
                            className="block max-w-[260px] truncate font-medium hover:text-[color:var(--color-brand)]"
                          >
                            {product.name}
                          </Link>
                          <span className="flex gap-1.5 text-[11px] text-[color:var(--color-muted)]">
                            {product.isFeatured && <span>öne çıkan</span>}
                            {product.isNew && <span>yeni</span>}
                            <span>{product.soldCount} satış</span>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-[12px] text-[color:var(--color-muted)]">{product.sku}</td>
                    <td className="whitespace-nowrap text-right">
                      {formatPrice(product.price)}
                      {product.compareAtPrice && (
                        <span className="block text-[11px] text-[color:var(--color-muted)] line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                    </td>
                    <td className="text-right">{stats?.variantCount ?? 0}</td>
                    <td className="text-right">
                      <span
                        className={`badge ${
                          (stats?.totalStock ?? 0) === 0
                            ? "bg-red-50 text-[color:var(--color-sale)]"
                            : (stats?.totalStock ?? 0) < 10
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {stats?.totalStock ?? 0}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          product.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {product.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td>
                      <ProductRowActions
                        id={product.id}
                        slug={product.slug}
                        isActive={product.isActive}
                        name={product.name}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sayfalama */}
      {pageCount > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildQuery({ sayfa: String(n) })}
              className={`h-8 min-w-8 px-2 text-center text-[13px] leading-8 ${
                n === page
                  ? "bg-[color:var(--color-ink)] text-white"
                  : "border border-[color:var(--color-line-strong)] bg-white"
              }`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
