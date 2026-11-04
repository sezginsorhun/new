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

/* Domain tutarlılığı — her ortamda kontrol edilir -------------------------
 *
 * CANONICAL_HOST yönlendirmenin hedefi, NEXT_PUBLIC_SITE_URL ise
 * e-postalarda, sitemap'te ve ödeme callback'inde yazan adres. İkisi farklı
 * olursa site ya kendini sonsuz yönlendirme döngüsüne sokar ya da müşteriye
 * yanlış adres gönderir. Bu yüzden uyarı değil, HATA: derleme durur.
 *
 * Bilerek `isProduction` bloğunun DIŞINDA: o blok yalnızca NODE_ENV veya CI
 * tanımlıyken çalışır, Hostinger'da ikisi de yok (NODE_ENV bilerek
 * eklenmiyor — devDependencies'i kurdurmuyor).
 */
const canonicalHost = (process.env.CANONICAL_HOST || "").trim().toLowerCase();
if (canonicalHost) {
  let siteHost = "";
  try {
    siteHost = new URL(process.env.NEXT_PUBLIC_SITE_URL || "").hostname.toLowerCase();
  } catch {
    siteHost = "";
  }
  if (!siteHost) {
    problems.push(
      `CANONICAL_HOST tanımlı ("${canonicalHost}") ama NEXT_PUBLIC_SITE_URL okunamıyor.\n` +
        "   Tam adres yaz: https://" + canonicalHost,
    );
  } else if (siteHost !== canonicalHost) {
    problems.push(
      `CANONICAL_HOST ("${canonicalHost}") ile NEXT_PUBLIC_SITE_URL adresi ("${siteHost}") farklı.\n` +
        "   İkisi AYNI alan adını göstermeli. CANONICAL_HOST yönlendirmenin hedefi,\n" +
        "   NEXT_PUBLIC_SITE_URL ise e-postalarda ve sitemap'te yazan adrestir.",
    );
  }
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
  /*
   * SANAL POS
   * Hangi sağlayıcının seçildiğine göre o sağlayıcının anahtarlarını arıyoruz.
   * PAYMENT_PROVIDER=yok ise bu bilinçli bir tercihtir; uyarı vermiyoruz.
   */
  const paymentProvider = (process.env.PAYMENT_PROVIDER || "iyzico").toLowerCase();
  const providerKeys = {
    iyzico: ["IYZICO_API_KEY", "IYZICO_SECRET_KEY"],
  };
  if (paymentProvider === "yok") {
    warnings.push(
      "PAYMENT_PROVIDER=yok — kartla ödeme kapalı. Havale/EFT ve kapıda ödeme çalışır.",
    );
  } else if (providerKeys[paymentProvider]) {
    const missing = providerKeys[paymentProvider].filter((key) => !process.env[key]);
    if (missing.length) {
      warnings.push(
        `${paymentProvider} anahtarları eksik (${missing.join(", ")}) — kartla ödeme çalışmaz.\n` +
          "   Havale/EFT ve kapıda ödeme etkilenmez.",
      );
    } else if ((process.env.IYZICO_BASE_URL || "").includes("sandbox")) {
      warnings.push(
        "Sanal POS TEST (sandbox) adresine bakıyor — gerçek kartlardan tahsilat YAPILMAZ.\n" +
          "   Canlıya geçerken sağlayıcının üretim adresini ve canlı anahtarlarını gir.",
      );
    }
  } else {
    problems.push(
      `PAYMENT_PROVIDER="${paymentProvider}" tanınmıyor.\n` +
        "   Geçerli değerler: iyzico, yok. Yeni bir sağlayıcı eklediysen\n" +
        "   src/lib/payment/index.ts içindeki PROVIDERS kaydına da eklemelisin.",
    );
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

/* 4) İlk kurulumda örnek verileri yükle ----------------------------------
 *
 * AUTO_SEED=1 ise seed çalıştırılır. Seed kendi içinde korumalıdır:
 * veritabanında zaten kullanıcı veya ürün varsa HİÇBİR ŞEY yapmaz.
 * Yani bu değişkeni açık bırakman güvenlidir — yalnızca bomboş bir
 * veritabanını doldurur, sonraki dağıtımlarda sessizce atlar.
 *
 * Bu sayede ilk dağıtımdan sonra site boş açılmaz; kategoriler,
 * ürünler, ana sayfa bölümleri ve yönetici hesabı hazır gelir.
 */
if (process.env.AUTO_SEED === "1") {
  console.log("→ AUTO_SEED=1 — örnek veriler kontrol ediliyor...");
  const seed = spawnSync("npx", ["tsx", "src/db/seed.ts"], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (seed.status !== 0) {
    console.error("✗ Örnek veri yüklenemedi. Derleme durduruldu.");
    process.exit(1);
  }
}

/* 5) Katalog yükleyici ---------------------------------------------------
 *
 * IMPORT_CATALOG=1 ise src/db/katalog-yetiskin.ts içindeki kategori ve
 * ürün ağacı veritabanına yazılır. Yükleyici HİÇBİR ŞEY SİLMEZ: zaten
 * var olan kategori/ürün (slug'ına bakarak) atlanır. Bu yüzden değişkeni
 * açık bırakmak güvenlidir — paneldeki elle düzeltmelerin üzerine yazmaz.
 */
if (process.env.IMPORT_CATALOG === "1") {
  console.log("→ IMPORT_CATALOG=1 — katalog kontrol ediliyor...");
  const katalog = spawnSync("npx", ["tsx", "src/db/import-katalog.ts"], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (katalog.status !== 0) {
    console.error("✗ Katalog yüklenemedi. Derleme durduruldu.");
    process.exit(1);
  }
}
