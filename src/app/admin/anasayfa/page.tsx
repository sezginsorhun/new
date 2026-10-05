import Link from "next/link";
import { asc } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getAllSections, ensureDefaultSections } from "@/lib/home";
import { adminUrl } from "@/lib/admin-path";
import HomeSectionManager from "@/components/admin/HomeSectionManager";

export const metadata = { title: "Ana Sayfa Düzeni" };

export default async function AdminHomePage() {
  await requireAdmin();
  await ensureDefaultSections();

  const [sections, categoryRows] = await Promise.all([
    getAllSections(),
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);

  // Kategori seçicisi için düz liste (alt kategoriler girintili görünsün)
  const roots = categoryRows.filter((row) => !row.parentId);
  const flat = roots.flatMap((root) => [
    { id: root.id, name: root.name, slug: root.slug, depth: 0 },
    ...categoryRows
      .filter((row) => row.parentId === root.id)
      .map((child) => ({ id: child.id, name: child.name, slug: child.slug, depth: 1 })),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px]">Ana Sayfa Düzeni</h1>
          <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
            Müşterinin ana sayfada gördüğü her alan burada. Sırayı değiştir, bölüm ekle,
            istemediğini gizle.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={adminUrl("bannerlar")} className="btn-outline btn-sm">
            Carousel slaytları
          </Link>
          <Link href="/" target="_blank" className="btn-ghost btn-sm">
            <ExternalLink size={14} strokeWidth={1.6} />
            Siteyi gör
          </Link>
        </div>
      </div>

      <HomeSectionManager sections={sections} categories={flat} />
    </div>
  );
}
