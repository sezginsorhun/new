/**
 * GÖRSEL SUNUMU
 *
 * Veritabanında saklanan görselleri servis eder: /api/gorsel/<id>
 *
 * Neden API üzerinden? Yönetilen hosting paketlerinde sunucunun dosya
 * sistemi kalıcı değildir; yüklenen görseller her dağıtımda silinir.
 * Veritabanından sunulduğunda görseller dağıtımdan etkilenmez.
 *
 * Görsel adresi içeriğe özel ve değişmez olduğu için uzun süreli
 * önbelleğe alınır — ikinci istekte tarayıcı/CDN'den gelir, veritabanına
 * tekrar gidilmez.
 */

import { readImage } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  // Kimlik biçimi sabit: sadece küçük harf ve rakam
  if (!/^[a-z0-9]{10,40}$/.test(id)) {
    return new Response("Bulunamadı", { status: 404 });
  }

  const image = await readImage(id);
  if (!image) return new Response("Bulunamadı", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    status: 200,
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.data.length),
      // Adres değişmezse içerik de değişmez: 1 yıl önbellek
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
