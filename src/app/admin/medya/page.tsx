import { desc } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import MediaLibrary from "@/components/admin/MediaLibrary";

export const metadata = { title: "Medya" };

export default async function AdminMediaPage() {
  await requireAdmin();
  // Ham görsel baytları (data sütunu) BİLEREK seçilmiyor — liste hafif kalsın.
  const assets = await db
    .select({
      id: mediaAssets.id,
      url: mediaAssets.url,
      fileName: mediaAssets.fileName,
      mimeType: mediaAssets.mimeType,
      sizeBytes: mediaAssets.sizeBytes,
      width: mediaAssets.width,
      height: mediaAssets.height,
      alt: mediaAssets.alt,
      storage: mediaAssets.storage,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(300);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px]">Medya Kütüphanesi</h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Sitede kullandığın tüm görseller. Buraya yüklediklerini carousel, kategori ve
          ürün ekranlarından tekrar tekrar seçebilirsin.
        </p>
      </div>

      <MediaLibrary assets={assets} />
    </div>
  );
}
