import type { Metadata } from "next";
import { getFilterOptions, listProducts, type ProductListOptions } from "@/lib/catalog";
import ProductCard from "@/components/shop/ProductCard";
import ProductFilters from "@/components/shop/ProductFilters";
import SortSelect from "@/components/shop/SortSelect";
import Pagination from "@/components/shop/Pagination";
import SearchBar from "@/components/shop/SearchBar";

export const metadata: Metadata = {
  title: "Arama",
  robots: { index: false, follow: true },
};

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function SearchPage(props: PageProps<"/arama">) {
  const query = await props.searchParams;
  const term = typeof query.q === "string" ? query.q : "";

  const options: ProductListOptions = {
    search: term,
    sizes: toArray(query.beden),
    colors: toArray(query.renk),
    onlyInStock: query.stok === "1",
    maxPrice: query.max ? Number(query.max) : undefined,
    sort: (query.sirala as ProductListOptions["sort"]) ?? "newest",
    page: query.sayfa ? Number(query.sayfa) : 1,
    perPage: 24,
  };

  const [{ items, total, page, perPage }, filterOptions] = await Promise.all([
    term ? listProducts(options) : Promise.resolve({ items: [], total: 0, page: 1, perPage: 24 }),
    getFilterOptions(),
  ]);

  return (
    <div className="container-page py-10">
      <div className="mx-auto mb-9 max-w-[520px] text-center">
        <h1 className="text-[28px]">Ürün ara</h1>
        <div className="mt-5">
          <SearchBar initial={term} />
        </div>
      </div>

      {!term ? (
        <p className="py-10 text-center text-[14px] text-[color:var(--color-muted)]">
          Aramak istediğin ürünün adını yaz.
        </p>
      ) : (
        <>
          <p className="mb-7 text-center text-[13px] text-[color:var(--color-ink-soft)]">
            <strong>“{term}”</strong> için {total} sonuç bulundu.
          </p>

          {total === 0 ? (
            <p className="py-10 text-center text-[14px] text-[color:var(--color-muted)]">
              Sonuç bulunamadı. Farklı bir kelime dene.
            </p>
          ) : (
            <div className="flex gap-10">
              <ProductFilters options={filterOptions} total={total} />
              <div className="min-w-0 flex-1">
                <div className="mb-6 flex items-center justify-between border-b border-[color:var(--color-line)] pb-3">
                  <span className="text-[12px] text-[color:var(--color-muted)]">{total} ürün</span>
                  <SortSelect />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 lg:gap-x-5 xl:grid-cols-4">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Pagination page={page} perPage={perPage} total={total} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
