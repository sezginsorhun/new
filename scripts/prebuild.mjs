/**
 * DERLEME ÖNCESİ KONTROL
 *
 * `npm run build` çalıştığında otomatik olarak bu dosya önce çalışır.
 * İki iş yapar:
 *
 *  1) Zorunlu ortam değişkenleri eksikse derlemeyi ANLAŞILIR bir hatayla
 *     durdurur. Hostinger panelinde bir değişkeni unutursan, siteyi açınca
 *     tuhaf bir hata görmek yerine burada net uyarı alırsın.
 *
 *  2) AUTO_MIGRATE=1 ise veritabanı migration'larını uygular. Hostinger'da
 *     bu değişkeni açarsan her dağıtımda veritabanı kendiliğinden güncellenir;
 *     elle komut çalıştırman gerekmez.
 *
 * Not: Bu dosya bilerek sade tutuldu — derlemeden önce çalıştığı için
 * hiçbir TypeScript/bundler desteği olmadan, düz Node ile çalışır.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

/* .env dosyasını oku (Hostinger değişkenleri zaten process.env'de olur) */
function loadDotEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}
loadDotEnv();

const isProduction = process.env.NODE_ENV === "production" || process.env.CI === "true";
const problems = [];
const warnings = [];

/* 1) Zorunlu değişkenler ------------------------------------------------- */

const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl) {
  problems.push(
    "DATABASE_URL tanımlı değil.\n" +
      "   Hostinger → Siteniz → Environment variables bölümüne MySQL\n" +
      "   bağlantı adresini ekle. Örnek:\n" +
      "   mysql://u242826491_alenora:SIFRE@localhost:3306/u242826491_alenora",
  );
} else if (!/^mysql:\/\//.test(dbUrl)) {
  problems.push(
    "DATABASE_URL bir MySQL adresi olmalı (mysql:// ile başlar).\n" +
      "   Hostinger'ın MySQL bilgileri: hPanel → Veritabanları → Yönetim",
  );
}

const secret = process.env.AUTH_SECRET ?? "";
if (!secret) {
  problems.push(
    "AUTH_SECRET tanımlı değil.\n" +
      "   `openssl rand -base64 48` ile üret ve ortam değişkenlerine ekle.",
  );
} else if (secret.length < 32) {
  problems.push("AUTH_SECRET en az 32 karakter olmalı. `openssl rand -base64 48` ile yenisini üret.");
}

const adminPath = process.env.ADMIN_PATH ?? "";
const publicAdminPath = process.env.NEXT_PUBLIC_ADMIN_PATH ?? "";
if (!adminPath || !publicAdminPath) {
  problems.push(
    "ADMIN_PATH ve NEXT_PUBLIC_ADMIN_PATH tanımlı olmalı (ikisi de AYNI değer).\n" +
      "   Yönetim paneli bu gizli adresten açılır. Örnek: yonetim-8f3a2c",
  );
} else if (adminPath !== publicAdminPath) {
  problems.push(
    `ADMIN_PATH ("${adminPath}") ile NEXT_PUBLIC_ADMIN_PATH ("${publicAdminPath}") aynı değil.\n` +
      "   Aynı olmalılar, yoksa paneldeki bağlantılar yanlış adrese gider.",
  );
} else if (/^(admin|yonetim|panel)$/i.test(adminPath)) {
  warnings.push(
    `ADMIN_PATH çok tahmin edilebilir ("${adminPath}"). Sonuna rastgele bir ek koy: yonetim-$(openssl rand -hex 4)`,
  );
}

/* 2) Üretimde olması beklenen ama zorunlu olmayanlar ---------------------- */

if (isProduction) {
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    warnings.push("NEXT_PUBLIC_SITE_URL boş — e-postalardaki ve SEO etiketlerindeki adresler yanlış olur.");
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    warnings.push(
      "SMTP ayarlı değil — yönetici girişindeki 6 haneli doğrulama kodu e-postayla GİTMEZ.\n" +
        "   Panele yalnızca yedek kodlarla girebilirsin.",
    );
  }
  if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) {
    warnings.push("iyzico anahtarları yok — kredi kartıyla ödeme çalışmaz (havale/kapıda ödeme çalışır).");
  }
  if (process.env.STORAGE_DRIVER === "file") {
    warnings.push(
      "STORAGE_DRIVER=file seçilmiş. Yönetilen hosting paketlerinde yüklenen görseller\n" +
        "   her dağıtımda SİLİNİR. Kendi sunucun yoksa bu değişkeni kaldır (varsayılan: db).",
    );
  }
}

/* Sonuç ------------------------------------------------------------------ */

if (warnings.length) {
  console.warn("\n⚠  Uyarılar:");
  for (const warning of warnings) console.warn("   • " + warning);
}

if (problems.length) {
  console.error("\n✗ Derleme durduruldu. Eksik/yanlış ayarlar:\n");
  for (const problem of problems) console.error("   • " + problem + "\n");
  console.error("Ayarları düzeltip tekrar dağıt.\n");
  process.exit(1);
}

console.log("✓ Ortam değişkenleri tamam.");

/* 3) İsteğe bağlı otomatik migration ------------------------------------- */

if (process.env.AUTO_MIGRATE === "1") {
  console.log("→ AUTO_MIGRATE=1 — veritabanı migration'ları uygulanıyor...");
  const result = spawnSync("npx", ["tsx", "src/db/migrate.ts"], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error("✗ Migration başarısız. Derleme durduruldu.");
    process.exit(1);
  }
} else {
  console.log("ℹ AUTO_MIGRATE kapalı. Veritabanı şemasını elle güncellemen gerekir:");
  console.log("   npm run db:migrate");
}
