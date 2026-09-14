/**
 * GÖRSEL YÜKLEME
 *
 * Dosyalar public/uploads altına kaydedilir ve /uploads/... adresinden servis edilir.
 *
 * ⚠️ ÖNEMLİ: Vercel gibi sunucusuz (serverless) ortamlarda dosya sistemi
 * salt-okunurdur; orada bu yöntem çalışmaz. Canlıda Cloudinary, AWS S3 veya
 * Vercel Blob kullanmak gerekir. README'de nasıl geçileceği anlatılıyor.
 * O zamana kadar panelde "görsel adresi yapıştır" alanı da kullanılabilir.
 */

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { createId } from "@/lib/id";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return Response.json({ ok: false, error: "Yetkisiz." }, { status: 403 });
  }

  let file: File | null = null;
  try {
    const formData = await request.formData();
    const value = formData.get("file");
    if (value instanceof File) file = value;
  } catch {
    return Response.json({ ok: false, error: "Dosya okunamadı." }, { status: 400 });
  }

  if (!file) return Response.json({ ok: false, error: "Dosya seçilmedi." }, { status: 400 });

  // SVG kabul edilmiyor — içine script gömülebilir
  if (!ALLOWED.has(file.type)) {
    return Response.json(
      { ok: false, error: "Sadece JPG, PNG, WEBP veya AVIF yükleyebilirsin." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "Dosya 6 MB'tan büyük olamaz." },
      { status: 400 },
    );
  }

  const extension =
    { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[
      file.type
    ] ?? "jpg";

  const fileName = `${createId(18)}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          "Dosya kaydedilemedi. Sunucu dosya sistemi salt-okunur olabilir (Vercel). " +
          "Bu durumda görsel adresini elle yapıştır veya S3/Cloudinary bağla. " +
          (error as Error).message,
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, url: `/uploads/${fileName}` });
}
