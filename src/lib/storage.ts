/**
 * GÖRSEL DEPOLAMA
 *
 * Neden bu katman var?
 * Yönetilen hosting paketlerinde (Hostinger Web Apps, Vercel, Railway…)
 * uygulamanın yazdığı dosyalar KALICI DEĞİLDİR: her yeni dağıtımda sunucu
 * sıfırdan kurulur ve `public/uploads` altına yazdığın görseller kaybolur.
 *
 * Bu yüzden varsayılan sürücü veritabanıdır:
 *   • Görselin baytları `media_assets.data` sütununda durur.
 *   • Adres olarak `/api/gorsel/<id>` kullanılır.
 *   • Dağıtımdan, sunucu değişiminden, ölçeklenmeden etkilenmez.
 *   • Yedeğini aldığın an görsellerin de yedeklenmiş olur.
 *
 * Sürücüyü .env'deki STORAGE_DRIVER ile değiştirebilirsin:
 *   db   → veritabanı (varsayılan; her yerde çalışır)
 *   file → public/uploads (yalnızca kendi sunucun/VPS varsa mantıklı)
 *
 * İleride S3 / Cloudinary'ye geçmek istersen yalnızca bu dosyaya bir
 * sürücü daha eklemen yeter; çağıran kodun hiçbir yeri değişmez.
 */

import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { createId } from "@/lib/id";

export type StorageDriver = "db" | "file";

export function activeDriver(): StorageDriver {
  return process.env.STORAGE_DRIVER === "file" ? "file" : "db";
}

export type SavedImage = {
  id: string;
  url: string;
  storage: string;
};

/**
 * Görseli kaydeder ve medya kütüphanesine satır ekler.
 * Dönen `url`, doğrudan <Image src> içinde kullanılabilir.
 */
export async function saveImage(params: {
  bytes: Buffer;
  originalName: string;
  mimeType: string;
  extension: string;
  width?: number;
  height?: number;
  alt?: string | null;
  folder: string;
  uploadedBy?: string | null;
}): Promise<SavedImage> {
  const driver = activeDriver();
  const id = createId(20);

  if (driver === "file") {
    const fileName = `${id}.${params.extension}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, fileName), params.bytes);

    const url = `/uploads/${fileName}`;
    await db
      .insert(mediaAssets)
      .values({
        id,
        url,
        fileName: params.originalName.slice(0, 255) || fileName,
        mimeType: params.mimeType,
        sizeBytes: params.bytes.length,
        width: params.width ?? null,
        height: params.height ?? null,
        alt: params.alt ?? null,
        folder: params.folder,
        uploadedBy: params.uploadedBy ?? null,
        storage: "file",
      });
    return { id, url, storage: "file" };
  }

  // Varsayılan: veritabanı
  const url = `/api/gorsel/${id}`;
  await db
    .insert(mediaAssets)
    .values({
      id,
      url,
      fileName: params.originalName.slice(0, 255) || `${id}.${params.extension}`,
      mimeType: params.mimeType,
      sizeBytes: params.bytes.length,
      width: params.width ?? null,
      height: params.height ?? null,
      alt: params.alt ?? null,
      folder: params.folder,
      uploadedBy: params.uploadedBy ?? null,
      storage: "db",
      data: params.bytes,
    });

  return { id, url, storage: "db" };
}

/** Veritabanındaki görselin baytlarını okur. */
export async function readImage(id: string) {
  const [row] = await db
    .select({
      data: mediaAssets.data,
      mimeType: mediaAssets.mimeType,
      sizeBytes: mediaAssets.sizeBytes,
      storage: mediaAssets.storage,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);

  if (!row || row.storage !== "db" || !row.data) return null;
  return { data: Buffer.from(row.data), mimeType: row.mimeType, size: row.sizeBytes };
}
