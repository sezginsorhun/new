import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * VERİTABANI BAĞLANTISI (MySQL / MariaDB)
 *
 * Next.js geliştirme modunda her sıcak yenilemede yeni havuz açılmasın diye
 * bağlantı havuzu globalThis üzerinde saklanır.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL tanımlı değil. .env dosyasını kontrol et.");
}

const globalForDb = globalThis as unknown as {
  __mysqlPool?: mysql.Pool;
};

/**
 * Havuzdaki en fazla bağlantı sayısı.
 * Paylaşımlı hosting'de eşzamanlı bağlantı sınırı düşüktür; havuzu küçük
 * tutmak "too many connections" hatasını önler. Gerekirse .env'den
 * DB_POOL_MAX ile büyütebilirsin.
 */
const poolMax =
  Number(process.env.DB_POOL_MAX) ||
  (process.env.NODE_ENV === "production" ? 5 : 3);

const pool =
  globalForDb.__mysqlPool ??
  mysql.createPool({
    uri: connectionString,
    connectionLimit: poolMax,
    waitForConnections: true,
    connectTimeout: 15_000,
    enableKeepAlive: true,
    // Tarih sütunları JS Date olarak gelsin (drizzle bunu bekliyor)
    dateStrings: false,
    // Para alanları tam sayı; BIGINT'i string'e çevirmeye gerek yok
    supportBigNumbers: true,
    bigNumberStrings: false,
    timezone: "Z",
  });

if (process.env.NODE_ENV !== "production") globalForDb.__mysqlPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
export * from "./schema";
