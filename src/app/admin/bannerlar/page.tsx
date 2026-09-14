import { asc } from "drizzle-orm";
import { db } from "@/db";
import { banners } from "@/db/schema";
import BannerManager from "@/components/admin/BannerManager";

export default async function AdminBannersPage() {
  const rows = await db.select().from(banners).orderBy(asc(banners.sortOrder));

  return (
    <div className="max-w-[900px]">
      <h1 className="mb-1 text-[26px]">Bannerlar</h1>
      <p className="mb-6 text-[13px] text-[color:var(--color-muted)]">
        Anasayfadaki büyük görsel alanı. Birden fazla banner eklersen otomatik döner.
        Önerilen görsel boyutu: 1920 × 820 piksel.
      </p>
      <BannerManager banners={rows} />
    </div>
  );
}
