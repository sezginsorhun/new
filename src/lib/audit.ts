/**
 * DENETİM KAYDI (AUDIT LOG)
 *
 * Panelde yapılan değiştirici her işlem buraya yazılır: kim, ne zaman,
 * hangi kayıtta, ne yaptı. Kayıtlar silinmez; "panelde kim ne yaptı"
 * sorusunun cevabı burasıdır.
 *
 * Kural: log yazarken hata olursa ana işlem BOZULMAZ (sessizce yutulur).
 */

import "server-only";
import { desc, eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getRequestInfo } from "@/lib/request-info";

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.2fa_sent"
  | "auth.2fa_ok"
  | "auth.2fa_failed"
  | "auth.locked"
  | "auth.session_revoked"
  | "auth.password_changed"
  | "product.create"
  | "product.update"
  | "product.delete"
  | "variant.update"
  | "stock.update"
  | "category.create"
  | "category.update"
  | "category.delete"
  | "order.status"
  | "order.shipping"
  | "order.refund"
  | "coupon.create"
  | "coupon.update"
  | "coupon.delete"
  | "banner.create"
  | "banner.update"
  | "banner.delete"
  | "section.update"
  | "media.upload"
  | "media.delete"
  | "page.update"
  | "settings.update"
  | "customer.update"
  | "review.moderate";

export async function logAudit(params: {
  action: AuditAction;
  userId?: string | null;
  actorEmail?: string | null;
  entity?: string;
  entityId?: string;
  summary?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { ip, userAgent } = await getRequestInfo();
    await db.insert(auditLogs).values({
      action: params.action,
      userId: params.userId ?? null,
      actorEmail: params.actorEmail ?? null,
      entity: params.entity ?? null,
      entityId: params.entityId ? String(params.entityId).slice(0, 60) : null,
      summary: params.summary?.slice(0, 400) ?? null,
      meta: params.meta ?? null,
      ip,
      userAgent,
    });
  } catch (error) {
    console.error("[audit yazılamadı]", (error as Error).message);
  }
}

export async function listAuditLogs(options?: {
  limit?: number;
  action?: string;
  userId?: string;
}) {
  const limit = Math.min(options?.limit ?? 100, 500);
  const filters = [];
  if (options?.action) filters.push(eq(auditLogs.action, options.action));
  if (options?.userId) filters.push(eq(auditLogs.userId, options.userId));

  return db
    .select()
    .from(auditLogs)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function auditActionCounts() {
  return db
    .select({ action: auditLogs.action, n: sql<number>`count(*)` })
    .from(auditLogs)
    .groupBy(auditLogs.action)
    .orderBy(desc(sql`count(*)`));
}

/** İnsan tarafından okunabilir Türkçe açıklama. */
export const AUDIT_LABELS: Record<string, string> = {
  "auth.login": "Giriş yapıldı",
  "auth.login_failed": "Hatalı giriş denemesi",
  "auth.logout": "Çıkış yapıldı",
  "auth.2fa_sent": "Doğrulama kodu gönderildi",
  "auth.2fa_ok": "İki adımlı doğrulama başarılı",
  "auth.2fa_failed": "Hatalı doğrulama kodu",
  "auth.locked": "Hesap geçici kilitlendi",
  "auth.session_revoked": "Oturum sonlandırıldı",
  "auth.password_changed": "Şifre değiştirildi",
  "product.create": "Ürün oluşturuldu",
  "product.update": "Ürün güncellendi",
  "product.delete": "Ürün silindi",
  "variant.update": "Varyant güncellendi",
  "stock.update": "Stok güncellendi",
  "category.create": "Kategori eklendi",
  "category.update": "Kategori güncellendi",
  "category.delete": "Kategori silindi",
  "order.status": "Sipariş durumu değişti",
  "order.shipping": "Kargo bilgisi girildi",
  "order.refund": "İade/iptal işlendi",
  "coupon.create": "Kupon oluşturuldu",
  "coupon.update": "Kupon güncellendi",
  "coupon.delete": "Kupon silindi",
  "banner.create": "Slayt eklendi",
  "banner.update": "Slayt güncellendi",
  "banner.delete": "Slayt silindi",
  "section.update": "Ana sayfa bölümü güncellendi",
  "media.upload": "Görsel yüklendi",
  "media.delete": "Görsel silindi",
  "page.update": "Sayfa güncellendi",
  "settings.update": "Ayarlar güncellendi",
  "customer.update": "Müşteri kaydı güncellendi",
  "review.moderate": "Yorum onay durumu değişti",
};
