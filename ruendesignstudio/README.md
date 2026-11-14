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

Sayfa kurgusu ve tasarım dili gillesetboissier.com sitesini izler (üst şerit,
ortada logo, açılır geniş menüler, tam genişlik görseller, geniş harfli
başlıklar + gri serif metinler). Yazı tipleri: Lexend Exa, Cormorant Garamond,
Roboto (hepsi ücretsiz, OFL).

| Adres | Sayfa |
|---|---|
| `/` | Açılış görseli, giriş, proje kategorileri, ev koleksiyonu, adresler |
| `/evren` | Slayt, stüdyo metni, sanat şeridi, adresler |
| `/projeler`, `/projeler/<kategori>`, `/proje/<proje>` | Kategoriler, proje ızgarası, kolaj galeri + alıntı |
| `/gunce`, `/gunce/<yazı>` | Kayan başlık, yazı kartları |
| `/koleksiyonlar`, `/koleksiyon/<ad>` | Koleksiyon blokları ve ürün satırları |
| `/mobilya`, `/butik`, `/urunler/<grup>`, `/urun/<ürün>` | Ürün grupları, liste, ürün detayı + bilgi talebi |
| `/adres/<showroom>` | Slayt, bilgiler, dekorasyon hizmeti, ziyaret formu |
| `/tasarim-hizmeti`, `/iletisim` | 4 adım + proje formu; adresler + iletişim formu |
| `/arama`, `/istek-listesi` | Arama; cihazda saklanan beğeni listesi |
| `/basin`, `/oduller`, `/kariyer`, `/kvkk`, `/yasal-bildirim`, `/satis-kosullari`, `/cerez-politikasi` | Metin sayfaları |

Butik bölümünde sepet/ödeme yoktur; ürünlerde “Bilgi talep edin” formu vardır.
Demo görseller `assets/demo/` altında (Unsplash lisansı) — gerçek fotoğraflarla
panelden değiştirilir.

## Yönetim paneli

`https://ruendesignstudio.com/<admin_path>/` — `/admin` 404 döner.

- **Genel:** Panel, Mesajlar (iletişim / proje / showroom / ürün), Bülten (CSV)
- **Projeler:** Projeler (kapak + galeri), Proje Kategorileri
- **Koleksiyon:** Ürünler, Ürün Grupları (menü sütunları), Koleksiyonlar
- **İçerik:** Ana Sayfa & Metinler, Günce, Adresler, Evren Görselleri, Sayfalar, Medya
- **Sistem:** Hesabım, Ayarlar, Güvenlik

İçerik türleri `app/admin_entities.php` içinde tanımlıdır; liste ve düzenleme
ekranları bu tanımlardan oluşur.

Güvenlik: bcrypt şifre, httpOnly/SameSite oturum çerezi, her formda CSRF
belirteci, IP başına 15 dakikada 8 hatalı girişte kilit, yüklenen görseller GD
ile yeniden kodlanır, şifre değişince diğer oturumlar düşer.

Veritabanı şeması `PRAGMA user_version` ile sürümlenir; v1 → v2 geçişinde
kullanıcılar, ayarlar, mesajlar ve medya korunur.

## Yerelde çalıştırma

```bash
cp app/config.sample.php app/config.php   # değerleri doldurun
php -S 127.0.0.1:8000 index.php
```

## Yedek

`data/site.sqlite` ve `uploads/` klasörünü indirmek yeterlidir
(hPanel → Dosya Yöneticisi).
