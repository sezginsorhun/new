/**
 * GÖRSEL YÜKLEME (sadece yönetici)
 *
 * Güvenlik kontrolleri sırayla:
 *   1) Oturum + ADMIN rolü + 2FA doğrulanmış mı?
 *   2) İstek bu siteden mi geliyor (Origin) ve CSRF jetonu geçerli mi?
 *   3) Dosya boyutu sınırı
 *   4) İÇERİK İMZASI (magic byte) — uzantıya ve tarayıcının bildirdiği
 *      content-type'a ASLA güvenilmez; dosyanın ilk baytları okunur.
 *      Böylece ".png" adıyla yüklenen bir HTML/script dosyası reddedilir.
 *   5) Dosya adı sunucu tarafında rastgele üretilir (yol gezinmesi imkansız)
 *
 * Görsel NEREYE kaydedilir? src/lib/storage.ts belirler. Varsayılan olarak
 * veritabanına yazılır; böylece yönetilen hosting paketlerinde dağıtım
 * sonrası kaybolmaz.
 *
 * SVG kabul edilmez: içine script gömülebilir.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { verifyCsrfToken, isSameOrigin } from "@/lib/security";
import { saveImage } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

/** Medya kaydının panele gönderilen alanları (ham baytlar hariç). */
const MEDIA_FIELDS = {
  id: mediaAssets.id,
  url: mediaAssets.url,
  fileName: mediaAssets.fileName,
  mimeType: mediaAssets.mimeType,
  sizeBytes: mediaAssets.sizeBytes,
  width: mediaAssets.width,
  height: mediaAssets.height,
  alt: mediaAssets.alt,
  folder: mediaAssets.folder,
  storage: mediaAssets.storage,
  createdAt: mediaAssets.createdAt,
} as const;

type Kind = { ext: string; mime: string };

/** Dosyanın ilk baytlarından gerçek türünü bulur. */
function sniff(buffer: Buffer): Kind | null {
  const b = buffer;
  // JPEG: FF D8 FF
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b.length > 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  // WEBP: "RIFF" .... "WEBP"
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  // AVIF / HEIF: .... "ftyp" + "avif"/"avis"
  if (b.length > 12 && b.toString("ascii", 4, 8) === "ftyp") {
    const brand = b.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return { ext: "avif", mime: "image/avif" };
  }
  // GIF
  if (b.length > 6 && b.toString("ascii", 0, 3) === "GIF") {
    return { ext: "gif", mime: "image/gif" };
  }
  return null;
}

/** PNG/JPEG için basit boyut okuma (medya kütüphanesinde göstermek için). */
function readSize(buffer: Buffer, kind: Kind): { width?: number; height?: number } {
  try {
    if (kind.ext === "png" && buffer.length > 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (kind.ext === "jpg") {
      let i = 2;
      while (i < buffer.length - 9) {
        if (buffer[i] !== 0xff) { i++; continue; }
        const marker = buffer[i + 1];
        const len = buffer.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
        }
        i += 2 + len;
      }
    }
  } catch {
    /* boyut okunamadı — önemli değil */
  }
  return {};
}

function fail(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  // 1) Yetki
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return fail("Yetkisiz.", 403);
  }

  // 2) Kaynak + CSRF
  if (!(await isSameOrigin())) return fail("İstek kaynağı doğrulanamadı.", 403);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("Dosya okunamadı.", 400);
  }

  const csrf = formData.get("csrf");
  if (!(await verifyCsrfToken(typeof csrf === "string" ? csrf : null))) {
    return fail("Oturum doğrulaması başarısız. Sayfayı yenileyip tekrar dene.", 403);
  }

  const value = formData.get("file");
  if (!(value instanceof File)) return fail("Dosya seçilmedi.", 400);

  // 3) Boyut
  if (value.size === 0) return fail("Dosya boş.", 400);
  if (value.size > MAX_BYTES) return fail("Dosya 6 MB'tan büyük olamaz.", 400);

  const buffer = Buffer.from(await value.arrayBuffer());

  // 4) Gerçek tür
  const kind = sniff(buffer);
  if (!kind) {
    return fail("Sadece JPG, PNG, WEBP, AVIF veya GIF yükleyebilirsin.", 400);
  }

  // 5) Kaydet — nereye yazılacağına storage katmanı karar verir
  const folderInput = String(formData.get("folder") ?? "genel");
  const folder = /^[a-z0-9-]{1,40}$/i.test(folderInput) ? folderInput.toLowerCase() : "genel";
  const { width, height } = readSize(buffer, kind);
  const alt = String(formData.get("alt") ?? "").slice(0, 250) || null;

  let saved;
  try {
    saved = await saveImage({
      bytes: buffer,
      originalName: value.name,
      mimeType: kind.mime,
      extension: kind.ext,
      width,
      height,
      alt,
      folder,
      uploadedBy: admin.id,
    });
  } catch (error) {
    return fail("Görsel kaydedilemedi: " + (error as Error).message.slice(0, 200), 500);
  }

  // Panele geri dönen kayıtta ham baytlar YOKTUR — sadece üst bilgiler.
  const [asset] = await db
    .select(MEDIA_FIELDS)
    .from(mediaAssets)
    .where(eq(mediaAssets.id, saved.id))
    .limit(1);

  await logAudit({
    action: "media.upload",
    userId: admin.id,
    actorEmail: admin.email,
    entity: "media",
    entityId: saved.id,
    summary: `${value.name} yüklendi (${Math.round(buffer.length / 1024)} KB, ${saved.storage})`,
  });

  return Response.json({ ok: true, url: saved.url, asset });
}

/** Medya kütüphanesini listeler (panel içindeki seçici için). */
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return fail("Yetkisiz.", 403);
  }
  const url = new URL(request.url);
  const folder = url.searchParams.get("klasor");
  const rows = await db
    .select(MEDIA_FIELDS)
    .from(mediaAssets)
    .where(folder ? and(eq(mediaAssets.folder, folder)) : undefined)
    .orderBy(mediaAssets.createdAt)
    .limit(200);
  return Response.json({ ok: true, items: rows.reverse() });
}
