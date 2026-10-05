/**
 * SAĞLIK KONTROLÜ — /api/saglik
 *
 * Hostinger ve izleme araçları bu adrese bakarak sitenin ayakta olup
 * olmadığını anlar. Veritabanına da kısa bir sorgu atar; yani 200 dönüyorsa
 * hem uygulama hem veritabanı çalışıyor demektir.
 *
 * Bilgi sızdırmaz: sürüm, bağlantı adresi gibi ayrıntılar paylaşılmaz.
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json(
      { ok: true, db: "up", ms: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, db: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
