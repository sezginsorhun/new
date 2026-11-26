import type { Metadata } from "next";
import { getFilterOptions, listProducts, type ProductListOptions } from "@/lib/catalog";
import ProductCard from "@/components/shop/ProductCard";
import ProductFilters from "@/components/shop/ProductFilters";
import SortSelect from "@/components/shop/SortSelect";
import Pagination from "@/components/shop/Pagination";

/**
 * TÜM ÜRÜNLER — ana sayfadaki "Çok satanlar" ve "Yeni ürünler" kutuları
 * buraya, ilgili sıralamayla gelir (?sirala=bestseller | newest).
 */

const TITLES: Record<string, { title: string; text: string }> = {
  bestseller: { title: "Çok Satanlar", text: "Müşterilerimizin en çok tercih ettiği ürünler." },
  newest: { title: "Yeni Ürünler", text: "Mağazamıza en son eklenen ürünler." },
};

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const SORTS = ["newest", "price-asc", "price-desc", "bestseller", "name"] as const;

export async function generateMetadata(props: PageProps<"/urunler">): Promise<Metadata> {
  const query = await props.searchParams;
  const heading = TITLES[String(query.sirala)] ?? { title: "Tüm Ürünler", text: "" };
  return { title: heading.title, alternates: { canonical: "/urunler" } };
}

export default async function AllProductsPage(props: PageProps<"/urunler">) {
  const query = await props.searchParams;
  const sortParam = typeof query.sirala === "string" ? query.sirala : "newest";
  const sort = (SORTS as readonly string[]).includes(sortParam)
    ? (sortParam as ProductListOptions["sort"])
    : "newest";
  const heading = TITLES[sortParam] ?? { title: "Tüm Ürünler", text: "Mağazadaki tüm ürünler." };

  const options: ProductListOptions = {
    sizes: toArray(query.beden),
    colors: toArray(query.renk),
    onlyInStock: query.stok !== "hepsi", // varsayılan: stokta olmayanlar gizli
    maxPrice: query.max ? Number(query.max) : undefined,
    sort,
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
        <h1 className="text-[32px]">{heading.title}</h1>
        {heading.text && (
          <p className="mt-2 text-[14px] text-[color:var(--color-ink-soft)]">{heading.text}</p>
        )}
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
              Ürün bulunamadı.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:gap-4 xl:grid-cols-4">
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
