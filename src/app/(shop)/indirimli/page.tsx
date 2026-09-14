import type { Metadata } from "next";
import { getFilterOptions, listProducts, type ProductListOptions } from "@/lib/catalog";
import ProductCard from "@/components/shop/ProductCard";
import ProductFilters from "@/components/shop/ProductFilters";
import SortSelect from "@/components/shop/SortSelect";
import Pagination from "@/components/shop/Pagination";

export const metadata: Metadata = {
  title: "İndirimli Ürünler",
  description: "İndirimdeki iç giyim ürünleri. Sınırlı stok, kaçırmadan incele.",
  alternates: { canonical: "/indirimli" },
};

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function SalePage(props: PageProps<"/indirimli">) {
  const query = await props.searchParams;

  const options: ProductListOptions = {
    onlyDiscounted: true,
    sizes: toArray(query.beden),
    colors: toArray(query.renk),
    onlyInStock: query.stok === "1",
    maxPrice: query.max ? Number(query.max) : undefined,
    sort: (query.sirala as ProductListOptions["sort"]) ?? "newest",
    page: query.sayfa ? Number(query.sayfa) : 1,
    perPage: 24,
  };

  const [{ items, total, page, perPage }, filterOptions] = await Promise.all([
    listProducts(options),
    getFilterOptions(),
  ]);

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <p className="eyebrow text-[color:var(--color-sale)]">Fırsat</p>
        <h1 className="mt-2 text-[32px]">İndirimli Ürünler</h1>
        <p className="mt-2 text-[14px] text-[color:var(--color-ink-soft)]">
          Sezon indirimindeki ürünler. Stoklar sınırlıdır.
        </p>
      </header>

      <div className="flex gap-10">
        <ProductFilters options={filterOptions} total={total} />
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between border-b border-[color:var(--color-line)] pb-3">
            <span className="text-[12px] text-[color:var(--color-muted)]">{total} ürün</span>
            <SortSelect />
          </div>

          {items.length === 0 ? (
            <p className="py-16 text-center text-[14px] text-[color:var(--color-muted)]">
              Şu anda indirimli ürün yok.
            </p>
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
