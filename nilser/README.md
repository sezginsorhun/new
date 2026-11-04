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
├─ build.mjs          derleyici (--next → ../public/, aksi hâlde → dist/)
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
npm ci
npm run build      # önce nilser/build.mjs sayfaları public/ içine üretir, sonra Next.js derlenir
npm start          # http://localhost:3000
```

## Hostinger (mevcut kurulum)

nilseraluminyum.com, Hostinger'da **Node.js Web App** olarak bu GitHub deposunun
`main` dalına bağlıdır. `main`'e gelen her değişiklik otomatik derlenip yayınlanır.
Uygulama ayarları değişmedi:

| Alan | Değer |
|---|---|
| Application type | `next` |
| Install | `npm ci` |
| Build | `build` |
| Output directory | `.next` |
| Start | `start` |

Sayfalar düz HTML olarak `public/` klasöründen sunulur; Next.js yalnızca teklif
formunu (`/api/teklif/`) çalıştırır. Eski mağaza uygulamasının ortam değişkenleri
(DATABASE_URL vb.) artık kullanılmaz; silinmeleri bir şeyi bozmaz.

### Teklif formunun e-posta göndermesi için
hPanel → **E-postalar** → `info@nilseraluminyum.com` hesabını açın, sonra
uygulama → **Environment variables** bölümüne ekleyin:

| Anahtar | Değer |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `info@nilseraluminyum.com` |
| `SMTP_PASS` | o e-posta hesabının şifresi |
| `MAIL_TO` | *(isteğe bağlı)* talebin gideceği adres |

SMTP tanımlı değilken form "WhatsApp veya telefonla ulaşın" uyarısı verir;
WhatsApp ile gönderim her durumda çalışır.

### Alternatif: düz paylaşımlı hosting
`cd nilser && node build.mjs` komutu `nilser/dist/` klasörünü `.htaccess` ve
PHP form alıcısıyla (`iletisim.php`) birlikte üretir; içeriği `public_html`
klasörüne yüklemek yeterlidir.

## Kontrol listesi (yayından önce)
- [ ] Telefon / e-posta / adres doğru mu? (`src/data.mjs`)
- [ ] "Yerinde keşif" ücretsiz mi? Ücretsizse metinlere eklenebilir.
- [ ] `info@nilseraluminyum.com` hesabı ve SMTP değişkenleri girildi mi? Formdan test gönderin.
- [ ] KVKK metni (`/kvkk/`) şirketinize göre gözden geçirildi mi?
