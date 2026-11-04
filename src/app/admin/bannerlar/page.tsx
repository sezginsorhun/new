import Link from "next/link";
import { asc } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { adminUrl } from "@/lib/admin-path";
import SlideManager from "@/components/admin/SlideManager";

export const metadata = { title: "Carousel" };

export default async function AdminBannersPage() {
  await requirePermission("content.manage");
  const slides = await db.select().from(banners).orderBy(asc(banners.sortOrder));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px]">Ana Sayfa Carousel</h1>
          <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
            Ana sayfanın en üstünde dönen slaytlar. Görsel ekle, sırala, yayın tarihi ver.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={adminUrl("anasayfa")} className="btn-outline btn-sm">
            Ana sayfa düzeni
          </Link>
          <Link href="/" target="_blank" className="btn-ghost btn-sm">
            <ExternalLink size={14} strokeWidth={1.6} />
            Siteyi gör
          </Link>
        </div>
      </div>

      <SlideManager slides={slides} />
    </div>
  );
}
