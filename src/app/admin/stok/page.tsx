import { adminUrl } from "@/lib/admin-path";
import { requirePermission } from "@/lib/auth";
import Link from "next/link";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/db";
import { productVariants, products } from "@/db/schema";
import StockRow from "@/components/admin/StockRow";

export default async function AdminStockPage(props: PageProps<"/admin/stok">) {
  await requirePermission("stock.manage");
  const query = await props.searchParams;
  const term = typeof query.q === "string" ? query.q.trim() : "";
  const filter = typeof query.filtre === "string" ? query.filtre : "";

  const filters = [eq(products.isActive, true)];
  if (term) {
    filters.push(
      or(
        like(products.name, `%${term}%`),
        like(productVariants.sku, `%${term}%`),
        like(productVariants.barcode, `%${term}%`),
      )!,
    );
  }
  if (filter === "kritik") {
    filters.push(sql`${productVariants.stock} <= ${productVariants.lowStockAlert}`);
  }
  if (filter === "tukendi") filters.push(eq(productVariants.stock, 0));

  const rows = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      size: productVariants.size,
      colorName: productVariants.colorName,
      colorHex: productVariants.colorHex,
      stock: productVariants.stock,
      lowStockAlert: productVariants.lowStockAlert,
      productId: products.id,
      productName: products.name,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(...filters))
    .orderBy(asc(productVariants.stock), asc(products.name))
    .limit(300);

  /*
   * NOT: Burada eskiden `count(*) filter (where ...)` kullanılıyordu.
   * O sözdizimi PostgreSQL'e özeldir; MySQL desteklemez ve sayfa 500
   * hatası verir. MySQL'de koşullu sayım `sum(case when ... then 1 else 0 end)`
   * ile yapılır — her iki veritabanında da çalışan yazım budur.
   */
  const totals = await db
    .select({
      totalStock: sql<number>`coalesce(sum(${productVariants.stock}),0)`,
      outOfStock: sql<number>`sum(case when ${productVariants.stock} = 0 then 1 else 0 end)`,
      lowStock: sql<number>`sum(case when ${productVariants.stock} > 0 and ${productVariants.stock} <= ${productVariants.lowStockAlert} then 1 else 0 end)`,
    })
    .from(productVariants);

  return (
    <div>
      <h1 className="mb-1 text-[26px]">Stok Durumu</h1>
      <p className="mb-5 text-[13px] text-[color:var(--color-muted)]">
        Toplam {totals[0]?.totalStock ?? 0} adet · {totals[0]?.lowStock ?? 0} kritik ·{" "}
        {totals[0]?.outOfStock ?? 0} tükendi
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[
          { value: "", label: "Tümü" },
          { value: "kritik", label: "Kritik stok" },
          { value: "tukendi", label: "Tükenenler" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? adminUrl(`stok?filtre=${tab.value}`) : adminUrl("stok")}
            className={`border px-3 py-1.5 text-[12px] ${
              filter === tab.value
                ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
                : "border-[color:var(--color-line-strong)] bg-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form className="card mb-5 flex flex-wrap items-end gap-3 p-4">
        {filter && <input type="hidden" name="filtre" value={filter} />}
        <div className="min-w-[220px] flex-1">
          <label className="label" htmlFor="st-q">Ara</label>
          <div className="relative">
            <Search
              size={15}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]"
            />
            <input
              id="st-q"
              name="q"
              defaultValue={term}
              placeholder="Ürün adı, SKU veya barkod"
              className="field pl-9"
            />
          </div>
        </div>
        <button type="submit" className="btn-outline btn-sm">Ara</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-basic min-w-[720px]">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Varyant</th>
                <th>SKU</th>
                <th className="w-[180px] text-right">Stok</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-[color:var(--color-muted)]">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <StockRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
