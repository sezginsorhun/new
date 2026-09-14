import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCategoryBySlug,
  getCategoryTree,
  getFilterOptions,
  listProducts,
  type ProductListOptions,
} from "@/lib/catalog";
import ProductCard from "@/components/shop/ProductCard";
import ProductFilters from "@/components/shop/ProductFilters";
import SortSelect from "@/components/shop/SortSelect";
import Pagination from "@/components/shop/Pagination";

export async function generateMetadata(
  props: PageProps<"/kategori/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori bulunamadı" };
  return {
    title: category.metaTitle ?? category.name,
    description: category.metaDescription ?? undefined,
    alternates: { canonical: `/kategori/${category.slug}` },
  };
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function CategoryPage(props: PageProps<"/kategori/[slug]">) {
  const { slug } = await props.params;
  const query = await props.searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const options: ProductListOptions = {
    categorySlug: slug,
    sizes: toArray(query.beden),
    colors: toArray(query.renk),
    onlyInStock: query.stok === "1",
    maxPrice: query.max ? Number(query.max) : undefined,
    sort: (query.sirala as ProductListOptions["sort"]) ?? "newest",
    page: query.sayfa ? Number(query.sayfa) : 1,
    perPage: 24,
  };

  const [{ items, total, page, perPage }, filterOptions, tree] = await Promise.all([
    listProducts(options),
    getFilterOptions(slug),
    getCategoryTree(),
  ]);

  // Kırılım yolu (breadcrumb) ve alt kategoriler
  const parentNode = tree.find((node) =>
    node.slug === slug ? true : node.children.some((child) => child.slug === slug),
  );
  const isParent = parentNode?.slug === slug;
  const siblings = isParent
    ? (parentNode?.children ?? [])
    : (parentNode?.children ?? []);

  return (
    <div className="container-page py-8">
      {/* Kırılım yolu */}
      <nav aria-label="Konum" className="mb-6 flex flex-wrap items-center gap-2 text-[12px] text-[color:var(--color-muted)]">
        <Link href="/" className="hover:text-[color:var(--color-ink)]">Ana sayfa</Link>
        {parentNode && !isParent && (
          <>
            <span aria-hidden>/</span>
            <Link href={`/kategori/${parentNode.slug}`} className="hover:text-[color:var(--color-ink)]">
              {parentNode.name}
            </Link>
          </>
        )}
        <span aria-hidden>/</span>
        <span className="text-[color:var(--color-ink)]">{category.name}</span>
      </nav>

      <header className="mb-7">
        <h1 className="text-[32px] leading-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-[620px] text-[14px] text-[color:var(--color-ink-soft)]">
            {category.description}
          </p>
        )}
      </header>

      {/* Alt kategori kısayolları */}
      {siblings.length > 0 && (
        <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-1">
          <Link
            href={`/kategori/${parentNode!.slug}`}
            className={`shrink-0 border px-4 py-2 text-[12.5px] transition-colors ${
              isParent
                ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
                : "border-[color:var(--color-line-strong)] bg-white hover:border-[color:var(--color-ink)]"
            }`}
          >
            Tümü
          </Link>
          {siblings.map((child) => (
            <Link
              key={child.id}
              href={`/kategori/${child.slug}`}
              className={`shrink-0 border px-4 py-2 text-[12.5px] transition-colors ${
                child.slug === slug
                  ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
                  : "border-[color:var(--color-line-strong)] bg-white hover:border-[color:var(--color-ink)]"
              }`}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-10">
        <ProductFilters options={filterOptions} total={total} />

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-[color:var(--color-line)] pb-3">
            <p className="text-[12px] text-[color:var(--color-muted)] lg:hidden">{total} ürün</p>
            <p className="hidden text-[12px] text-[color:var(--color-muted)] lg:block">
              {total > 0 ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} / ${total} ürün` : ""}
            </p>
            <SortSelect />
          </div>

          {items.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[16px]">Bu filtrelerle ürün bulunamadı.</p>
              <p className="mt-2 text-[13px] text-[color:var(--color-muted)]">
                Filtreleri temizleyip tekrar dene.
              </p>
              <Link href={`/kategori/${slug}`} className="btn-outline mt-6">
                Filtreleri temizle
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 lg:gap-x-5 xl:grid-cols-4">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination page={page} perPage={perPage} total={total} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
