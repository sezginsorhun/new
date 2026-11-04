# nilseraluminyum.com

NİLSER Alüminyum'un kurumsal sitesi: sineklik, plise perde, cam balkon ve duşakabin.
İçerik ve görseller ürün kataloğundan (NILSER_A4) alınmıştır.

- **Statik site.** Çıktı düz HTML/CSS/JS'tir; veritabanı ve Node.js sunucusu gerekmez.
  Hostinger'ın en basit paylaşımlı paketinde bile çalışır.
- **Hızlı.** Tüm CSS sayfaya gömülür, JS tek dosyadır (~10 KB, bağımlılık yok).
  Fontlar sitenin kendi sunucusundan gelir, görseller WebP'dir ve boyutları
  sabittir (sayfa kaymaz). Dış servis çağrısı yoktur. Harita yalnızca tıklanınca yüklenir.
- **Teklif sihirbazı.** Ürün → ölçü → iletişim adımları. Talep WhatsApp mesajı olarak
  ya da form ile (`iletisim.php`, PHP `mail()`) gönderilir.

## Klasör yapısı

```
nilser/
├─ build.mjs          derleyici (node build.mjs → dist/)
├─ src/
│  ├─ data.mjs        TÜM METİNLER: telefon, adres, ürünler, modeller
│  ├─ styles.css      tasarım
│  ├─ main.js         etkileşimler (menü, sekmeler, lightbox, teklif formu)
│  └─ assets/         görseller (webp), logo (svg), fontlar (woff2)
└─ public/            olduğu gibi kopyalanır: .htaccess, iletisim.php, favicon
```

Telefon, e-posta, ürün metni değişecekse yalnızca `src/data.mjs` dosyasını düzenleyin.

## Yerelde çalıştırma

```bash
cd nilser
node build.mjs
cd dist && php -S localhost:8080
```

## Hostinger kurulumu

### 1) Alan adı ve SSL
hPanel → **Web siteleri** → nilseraluminyum.com → **Güvenlik → SSL** bölümünden ücretsiz
SSL'in etkin olduğunu kontrol edin. `.htaccess` tüm trafiği `https://nilseraluminyum.com`
adresine (www'suz) yönlendirir.

### 2) E-posta hesabı (form için)
hPanel → **E-postalar** → `info@nilseraluminyum.com` hesabını oluşturun. Form bu adrese
gönderir. Farklı bir adres isterseniz `public/iletisim.php` içindeki `$TO` satırını değiştirin.

### 3a) Elle yükleme (en hızlı yol)
1. `node build.mjs` çalıştırın (veya hazır `nilser-site.zip` dosyasını kullanın).
2. hPanel → **Dosya Yöneticisi** → `public_html` klasörünü açın, içindeki varsayılan
   `default.php` / `index.php` dosyalarını silin.
3. `dist/` klasörünün **içeriğini** (zip ise yükleyip "Extract" ile) `public_html` içine koyun.
   `.htaccess` dosyasının da yüklendiğinden emin olun (gizli dosya).

### 3b) Otomatik dağıtım (GitHub → Hostinger)
`.github/workflows/nilser-deploy.yml`, `main` dalına `nilser/` altında her değişiklik
geldiğinde siteyi derleyip FTP ile `public_html/` klasörüne yükler.

GitHub → depo → **Settings → Secrets and variables → Actions** altına ekleyin:

| Secret | Nereden |
|---|---|
| `NILSER_FTP_SERVER` | hPanel → Dosyalar → FTP Hesapları → "FTP IP / hostname" |
| `NILSER_FTP_USERNAME` | aynı ekrandaki kullanıcı adı (`u123456789.nilseraluminyum.com` gibi) |
| `NILSER_FTP_PASSWORD` | FTP şifresi (gerekirse aynı ekrandan sıfırlayın) |
| `NILSER_FTP_DIR` *(isteğe bağlı)* | FTP hesabınız doğrudan `public_html` içinde açılıyorsa `./` yazın |

Sonra **Actions → "NİLSER sitesi → Hostinger" → Run workflow** ile ilk yüklemeyi yapın.

### 4) Arama motorları
Google Search Console'a `https://nilseraluminyum.com/sitemap.xml` adresini ekleyin.
Google İşletme Profili'nde web sitesi olarak aynı adresi kullanın.

## Kontrol listesi (yayından önce)
- [ ] Telefon / e-posta / adres doğru mu? (`src/data.mjs`)
- [ ] "Yerinde keşif" ücretsiz mi? Ücretsizse metinlere eklenebilir.
- [ ] `info@nilseraluminyum.com` hesabı açık mı? Formdan test gönderin.
- [ ] KVKK metni (`/kvkk/`) şirketinize göre gözden geçirildi mi?
