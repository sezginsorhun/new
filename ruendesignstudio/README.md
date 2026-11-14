# Ruen Design Studio — ruendesignstudio.com

İç mimarlık stüdyosu sitesi ve yönetim paneli. Düz PHP 8 + SQLite; Hostinger
paylaşımlı hostingde ek kurulum (Node, MySQL, Composer) gerektirmez.

## Yapı

```
index.php            tek giriş noktası (yönlendirme)
.htaccess            HTTPS, temiz adresler, app/ ve data/ erişim engeli
app/                 uygulama kodu (dışarıya kapalı)
  config.php         gizli ayarlar — depoda YOK, config.sample.php'den üretilir
  site.php           vitrin sayfaları
  admin.php          yönetim paneli
  views/site, views/admin
data/site.sqlite     veritabanı (ilk açılışta otomatik oluşur, dışarıya kapalı)
uploads/             panelden yüklenen görseller (PHP çalıştırılamaz)
assets/              CSS, JS, yazı tipleri, yer tutucu görseller
```

## Vitrin

`/` tam ekran görsel geçişi + giriş metni + öne çıkan projeler ·
`/projeler` ve `/kategori/<ad>` · `/projeler/<proje>` kapak, bilgiler, metin,
galeri, sıradaki proje · `/studyo` · `/basin` (kayıt yoksa menüde görünmez) ·
`/iletisim` (form → panel + e-posta) · `/kvkk` · `/sitemap.xml`.

## Yönetim paneli

`https://ruendesignstudio.com/<admin_path>/` — `/admin` 404 döner.
Panel, Mesajlar, Projeler (kapak + galeri + SEO), Kategoriler, Basın,
Ana Sayfa (tam ekran görseller ve giriş metni), Sayfalar (Stüdyo, KVKK),
Medya kütüphanesi, Hesabım (şifre, yönetici ekleme), Ayarlar, Güvenlik.

Güvenlik: bcrypt şifre, oturum çerezi httpOnly/SameSite, her formda CSRF
belirteci, IP başına 15 dakikada 8 hatalı girişte kilit, yüklenen görseller
GD ile yeniden kodlanır (gizli içerik ve EXIF atılır), şifre değişince diğer
oturumlar düşer.

## Yerelde çalıştırma

```bash
cp app/config.sample.php app/config.php   # değerleri doldurun
php -S 127.0.0.1:8000 index.php
```

## Yedek

`data/site.sqlite` ve `uploads/` klasörünü indirmek yeterlidir
(hPanel → Dosya Yöneticisi).
