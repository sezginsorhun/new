/**
 * MIGRATION ÇALIŞTIRICI (canlı ortam için)
 *
 *   npm run db:migrate
 *
 * `drizzle-kit migrate` geliştirme aracıdır; bu script ise drizzle-orm'un
 * kendi çalıştırıcısını kullanır. Farkı: yalnızca `drizzle/` klasöründeki
 * hazır SQL dosyalarını sırayla uygular, şemayı yeniden hesaplamaz.
 * Bu yüzden canlı veritabanında çalıştırmak güvenlidir.
 *
 * Aynı migration iki kez uygulanmaz — drizzle hangi dosyaların
 * çalıştırıldığını `__drizzle_migrations` tablosunda tutar.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL tanımlı değil. .env dosyasını kontrol et.");
    process.exit(1);
  }

  // Migration'lar tek bağlantıda, sırayla uygulanır.
  const client = await mysql.createConnection({ uri: url, multipleStatements: true });
  const db = drizzle(client, { mode: "default" });

  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return "bilinmeyen sunucu";
    }
  })();

  console.log(`→ Migration'lar uygulanıyor (${host})...`);
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("✓ Veritabanı güncel.");
  } catch (error) {
    console.error("✗ Migration hatası:", (error as Error).message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
