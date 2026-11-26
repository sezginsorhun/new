/**
 * DAĞITIM SIKILAŞTIRMASI — her `npm run build` öncesi çalışır
 *
 * Kurulum betiği (seed) herkesin bildiği şifrelerle örnek hesaplar açar ve
 * bu şifreler README'de yazılıdır. Canlı sitede bunlar açık kapıdır:
 *
 *  1) Örnek MÜŞTERİ hesabı (musteri@ornek.com) kapatılır, oturumları
 *     sonlandırılır. Gerçek bir müşteri değildir; silmek yerine kapatmak
 *     siparişi/yorumu varsa kayıtların bozulmamasını sağlar.
 *  2) Varsayılan şifresini hâlâ kullanan YÖNETİCİ hesabı otomatik
 *     kilitlenmez (sahibini panelin dışında bırakırdı). Panelin ana
 *     sayfasında kırmızı uyarı çıkar ve burada derleme günlüğüne yazılır.
 *
 * Tekrar tekrar çalıştırmak güvenlidir.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const DEMO_CUSTOMER_EMAILS = ["musteri@ornek.com"];
export const DEFAULT_ADMIN_PASSWORDS = ["Admin123!"];

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("ℹ Sıkılaştırma atlandı: DATABASE_URL yok.");
    return;
  }
  const conn = await mysql.createConnection({ uri: url, timezone: "Z" });
  try {
    const [demo] = await conn.query<mysql.RowDataPacket[]>(
      "select id, email from users where email in (?) and is_active = 1",
      [DEMO_CUSTOMER_EMAILS],
    );
    for (const row of demo) {
      await conn.query("update users set is_active = 0 where id = ?", [row.id]);
      await conn.query("update sessions set revoked_at = now() where user_id = ? and revoked_at is null", [row.id]);
      console.log(`✓ Örnek müşteri hesabı kapatıldı: ${row.email}`);
    }

    const [staff] = await conn.query<mysql.RowDataPacket[]>(
      "select email, password_hash from users where role <> 'CUSTOMER' and is_active = 1 and password_hash is not null",
    );
    for (const row of staff) {
      for (const candidate of DEFAULT_ADMIN_PASSWORDS) {
        if (await bcrypt.compare(candidate, row.password_hash)) {
          console.warn(
            `⚠ GÜVENLİK: ${row.email} hâlâ varsayılan kurulum şifresini kullanıyor. ` +
              "Panel → Hesabım bölümünden hemen değiştir.",
          );
        }
      }
    }
    console.log("✓ Sıkılaştırma kontrolü tamam.");
  } finally {
    await conn.end();
  }
}

run().catch((error) => {
  // Sıkılaştırma derlemeyi durdurmaz; günlüğe yazar ve devam eder.
  console.error("⚠ Sıkılaştırma kontrolü çalışamadı:", (error as Error).message);
  process.exit(0);
});
