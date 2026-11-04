import { asc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { db } from "@/db";
import { pages } from "@/db/schema";
import PageManager from "@/components/admin/PageManager";

export default async function AdminPagesPage() {
  await requirePermission("content.manage");
  const rows = await db.select().from(pages).orderBy(asc(pages.title));

  return (
    <div className="max-w-[1000px]">
      <h1 className="mb-1 text-[26px]">Sayfalar</h1>
      <p className="mb-6 text-[13px] text-[color:var(--color-muted)]">
        Hakkımızda, iade koşulları, gizlilik politikası gibi kurumsal sayfalar.
        Sitede /sayfa/URL adresinden görünürler.
      </p>
      <PageManager pages={rows} />
    </div>
  );
}
