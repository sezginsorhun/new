# Alenora — İç Giyim E-Ticaret Sistemi

Next.js 16 + MySQL + iyzico ile yazılmış, tam işlevli bir iç giyim e-ticaret sitesi.
Vitrin, sepet, üyelik, 3D Secure ödeme ve kapsamlı bir yönetim paneli içerir.

Üç tasarım kararı projenin tamamını belirler:

- **Ana sayfanın tamamı panelden yönetilir.** Kodda sabitlenmiş bölüm yoktur.
- **Yönetim paneli ayrı ve gizli bir adrestedir.** `/admin` dışarıya 404 döner,
  vitrinde panele giden hiçbir bağlantı bulunmaz.
- **Güvenlik katmanlıdır:** 2FA, hız sınırı, hesap kilidi, veritabanı destekli
  oturumlar, denetim kaydı, CSP ve CSRF koruması. Ayrıntı: [bölüm 9](#9-güvenlik).

---

## İçindekiler

1. [Neler var?](#1-neler-var)
2. [Hızlı başlangıç (kendi bilgisayarında)](#2-hızlı-başlangıç-kendi-bilgisayarında)
3. [Veritabanı nereye kurulur?](#3-veritabanı-nereye-kurulur)
4. [iyzico sanal POS başvurusu ve ayarı](#4-iyzico-sanal-pos-başvurusu-ve-ayarı)
5. [E-posta (SMTP) ayarı](#5-e-posta-smtp-ayarı)
6. [Canlıya alma: Hostinger](#6-canlıya-alma-hostinger)
7. [Görsel yükleme ve depolama](#7-görsel-yükleme-ve-depolama)
8. [Yönetim panelini kullanma](#8-yönetim-panelini-kullanma)
9. [Güvenlik](#9-güvenlik)
10. [Ana sayfayı panelden yönetmek](#10-ana-sayfayı-panelden-yönetmek)
11. [Yasal zorunluluklar (Türkiye)](#11-yasal-zorunluluklar-türkiye)
12. [Proje yapısı](#12-proje-yapısı)
13. [Sık karşılaşılan sorunlar](#13-sık-karşılaşılan-sorunlar)

---

## 1. Neler var?

### Vitrin (müşterinin gördüğü kısım)

| Sayfa | Adres | Ne yapar |
|---|---|---|
| Anasayfa | `/` | **Tamamı panelden yönetilen bölümler**: carousel, güven şeridi, kategori kutuları, ürün rayları, tanıtım bandı, bülten |
| Kategori | `/kategori/[slug]` | Beden / renk / fiyat / stok filtreleri, 5 sıralama seçeneği, sayfalama |
| Ürün detay | `/urun/[slug]` | Renk-beden seçimi, stoğa göre kapanan bedenler, galeri, beden tablosu, sekmeler, yorumlar |
| Arama | `/arama?q=` | Ürün adı, açıklama ve kodda arama |
| İndirimliler | `/indirimli` | Eski fiyatı olan tüm ürünler |
| Sepet | `/sepet` | Adet değiştirme, kupon uygulama, ücretsiz kargo çubuğu |
| Ödeme | `/odeme` | 5 adımlı checkout, kayıtlı adres seçimi, 3 ödeme yöntemi, taksit |
| Hesabım | `/hesabim` | Profil, şifre, siparişler, sipariş detayı, adres defteri, favoriler |
| Kurumsal | `/sayfa/[slug]` | Panelden düzenlenen içerik sayfaları |
| İletişim | `/iletisim` | Form, mesajlar panele düşer |

### Yönetim paneli (`/admin`)

| Bölüm | Ne yapar |
|---|---|
| Panel | Günlük/aylık ciro, bekleyen sipariş, 30 günlük grafik, kritik stok, en çok satanlar |
| Siparişler | Durum sekmeleri, arama, sipariş detayı, durum değiştirme, kargo girişi + müşteriye mail, iyzico iadesi |
| Ürünler | Arama/filtre, ürün ekle-düzenle-sil, yayından kaldırma |
| Ürün düzenleme | Genel bilgi, fiyat/maliyet/KDV, SEO, görsel yükleme ve sıralama, varyant yönetimi, **toplu varyant üretme** |
| Stok Durumu | Tüm varyantların stoğu, satır içinde hızlı düzenleme, kritik/tükendi filtresi |
| Kategoriler | İki seviyeli ağaç, görsel, sıralama, SEO |
| Kuponlar | Yüzde / sabit tutar / ücretsiz kargo, min. sepet, üst sınır, kullanım limiti, tarih aralığı |
| Bannerlar | Anasayfa slider yönetimi |
| Yorumlar | Onaylama — onaylanmayan yorum sitede görünmez |
| Müşteriler | Arama, sipariş sayısı ve toplam harcama, hesap açma/kapama |
| Mesajlar | İletişim formu mesajları, okundu işaretleme |
| Sayfalar | Kurumsal metinleri düzenleme |
| Ayarlar | Kargo ücreti, ücretsiz kargo limiti, kapıda ödeme bedeli, ödeme yöntemleri, banka hesapları, iletişim bilgileri, taksit limiti |

### Teknik özellikler

- **Para birimi hatası yok:** Tüm tutarlar veritabanında **kuruş** (tam sayı) tutulur. `299,90 TL → 29990`. Kayan nokta yuvarlama hatası oluşmaz.
- **Fiyat güvenliği:** Sepet ve sipariş tutarları **her zaman sunucuda, veritabanından** hesaplanır. Tarayıcıdan gelen fiyata asla güvenilmez.
- **Stok tutarlılığı:** Stok düşümü, kupon sayacı ve sipariş durumu **tek transaction** içinde yapılır. Biri başarısız olursa hiçbiri uygulanmaz.
- **Sipariş numarası çakışması yok:** Veritabanında atomik sayaç kullanılır
  (`LAST_INSERT_ID`), iki sipariş aynı numarayı alamaz (`SP-2026-000123`).
- **Kart bilgisi saklanmaz:** Kart verisi veritabanına yazılmaz, loglanmaz. Doğrudan iyzico'ya gider.
- **Şifreler:** bcrypt (12 tur). Oturum: imzalı JWT, httpOnly cookie.
- **Yetki kontrolü iki katmanlı:** `proxy.ts` hızlı ön kontrol yapar, her sayfa ayrıca `requireAdmin()` ile veritabanından doğrular.
- **SEO:** Her ürün/kategori için ayarlanabilir meta etiketler, ürün sayfalarında `Product` yapılandırılmış verisi (JSON-LD).
- **Erişilebilirlik:** Klavye ile gezinilebilir, `aria` etiketleri, görünür odak halkaları.

---

## 2. Hızlı başlangıç (kendi bilgisayarında)

### Gereksinimler

- **Node.js 20.9 veya üzeri** — [nodejs.org](https://nodejs.org) (LTS sürümü)
- **MySQL 8 veya MariaDB 10.5+** — yerel kurulum ya da hosting paketindeki
  veritabanı (bkz. bölüm 3)
- **Git** — [git-scm.com](https://git-scm.com)

Sürümleri kontrol et:

```bash
node -v     # v20.9.0 veya üzeri olmalı
npm -v
```

### Adım adım

**1) Projeyi al ve paketleri kur**

```bash
cd lingerie-store
npm install
```

**2) Ayar dosyasını oluştur**

```bash
cp .env.example .env
```

**3) `.env` dosyasını doldur**

En az şu iki satır dolu olmalı:

```env
DATABASE_URL="mysql://root:SIFREN@localhost:3306/lingerie"
AUTH_SECRET="buraya-uzun-rastgele-bir-metin"
```

`AUTH_SECRET` üretmek için:

```bash
# macOS / Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

**4) Veritabanı tablolarını oluştur**

```bash
npm run db:migrate
```

**5) Örnek verileri yükle** (18 ürün, 208 varyant, kategoriler, kuponlar, kurumsal sayfalar)

```bash
npm run db:seed
```

Çıktıda giriş bilgileri yazar:

```
Admin girişi : admin@alenora.com / Admin123!
Müşteri      : musteri@ornek.com / Test123!
```

> ⚠️ **Canlıya çıkmadan önce admin şifresini mutlaka değiştir.** Hesabım > Şifre Değiştir.

**6) Siteyi başlat**

```bash
npm run dev
```

Tarayıcıda aç:

- Site: <http://localhost:3000>
- Yönetim paneli: <http://localhost:3000/admin>

### Kullanışlı komutlar

```bash
npm run dev           # geliştirme sunucusu (dosya değişince otomatik yeniler)
npm run build         # canlı sürüm derlemesi — hata var mı diye kontrol eder
npm run start         # derlenmiş sürümü çalıştırır
npm run db:generate   # şemayı değiştirdiysen yeni migration dosyası üretir
npm run db:migrate    # bekleyen migration'ları uygular
npm run db:push       # şemayı doğrudan veritabanına uygular (hızlı, geliştirme için)
npm run db:studio     # veritabanını tarayıcıdan görüntüle/düzenle
npm run db:seed       # örnek verileri (yeniden) yükler — MEVCUT VERİYİ SİLER
```

---

## 3. Veritabanı nereye kurulur?

Proje **MySQL** (ve onunla uyumlu **MariaDB**) kullanır. Hostinger'ın paylaşımlı
paketlerinde zaten MySQL vardır; ayrı bir veritabanı servisine abone olmana
gerek yoktur.

Bağlantı adresinin biçimi her yerde aynıdır:

```
mysql://KULLANICI:SIFRE@HOST:3306/VERITABANI
```

### Seçenek A — Hostinger (canlı site için bu kullanılır)

1. hPanel → **Veritabanları → MySQL veritabanları**.
2. Veritabanı adı, kullanıcı adı ve şifre gir, **Oluştur**'a bas.
   Hostinger ikisinin de başına hesap numaranı ekler: `u242826491_alenora`.
3. Şifreyi bir yere kaydet — panel bir daha göstermez.
4. Site ile veritabanı aynı sunucuda olduğu için **HOST = `localhost`**:
   ```
   mysql://u242826491_alenora:SIFRE@localhost:3306/u242826491_alenora
   ```
5. Bu değeri Hostinger'daki **Environment variables** bölümüne `DATABASE_URL`
   adıyla ekle. Şifreyi dosyaya yazıp depoya göndermeyin.

> Uzaktan (kendi bilgisayarından) bağlanmak istersen hPanel →
> **Veritabanları → Uzak MySQL** bölümünden IP adresini yetkilendirmen gerekir.

### Seçenek B — Bilgisayarına kurmak (geliştirme)

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql -u root -e "create database lingerie character set utf8mb4 collate utf8mb4_unicode_ci;"
# DATABASE_URL="mysql://root@localhost:3306/lingerie"
```

**Windows:** <https://dev.mysql.com/downloads/installer/> adresinden MySQL
Installer'ı indir. Kurulumda belirlediğin `root` şifresini not al, sonra MySQL
Workbench'ten `lingerie` adında bir veritabanı oluştur.

**Ubuntu / Debian:**
```bash
sudo apt update && sudo apt install -y mariadb-server
sudo service mariadb start
sudo mysql -e "create database lingerie character set utf8mb4 collate utf8mb4_unicode_ci;"
# DATABASE_URL="mysql://root@localhost:3306/lingerie"
```

Veritabanı hazır olunca şemayı kur ve örnek verileri yükle:

```bash
npm run db:migrate
npm run db:seed
```

### Bilinmesi gereken iki ayar

- **Karakter seti `utf8mb4` olmalı.** Türkçe karakterler ve emoji ancak böyle
  doğru saklanır. Yukarıdaki komutlar bunu zaten ayarlıyor.
- **`DB_POOL_MAX`** bağlantı havuzunun üst sınırıdır (varsayılan 5). Paylaşımlı
  hostingde eşzamanlı bağlantı hakkı sınırlıdır; "too many connections" hatası
  alırsan bu değeri düşür.

---

## 4. iyzico sanal POS başvurusu ve ayarı

### 4.1 Önce sandbox (test) ile dene — ücretsiz, başvuru gerekmez

1. <https://sandbox-merchant.iyzipay.com/auth/register> adresinden test hesabı aç.
2. Giriş yap → **Ayarlar → API Anahtarları**.
3. **API Key** ve **Secret Key** değerlerini kopyala.
4. `.env` dosyasına yaz:

```env
IYZICO_API_KEY="sandbox-xxxxxxxxxxxxx"
IYZICO_SECRET_KEY="sandbox-xxxxxxxxxxxxx"
IYZICO_BASE_URL="https://sandbox-api.iyzipay.com"
```

5. Sunucuyu yeniden başlat (`Ctrl+C` sonra `npm run dev`).
6. Ödeme sayfasında artık "Kredi / Banka Kartı" seçeneği görünür.

**Sandbox test kartları** (gerçek para çekilmez):

| Banka | Kart numarası | Ay/Yıl | CVC | 3D şifre |
|---|---|---|---|---|
| Akbank | `5528 7900 0000 0008` | 12/2030 | 123 | `283126` |
| Garanti | `5504 7200 0000 0003` | 12/2030 | 123 | `283126` |
| İş Bankası | `4543 5900 0000 0006` | 12/2030 | 123 | `283126` |

Başarısız ödeme senaryosunu denemek için: `5406 6700 0000 0009`

> Tam liste: <https://docs.iyzico.com/#test-kartlari>

### 4.2 Gerçek (canlı) POS başvurusu

1. <https://www.iyzico.com/uye-ol> adresinden başvur.
2. Gereken belgeler:
   - **Şahıs şirketi:** vergi levhası, kimlik fotokopisi, imza beyannamesi, banka hesap bilgisi (IBAN)
   - **Limited/Anonim şirket:** vergi levhası, ticaret sicil gazetesi, imza sirküleri, ortaklık yapısı, IBAN
3. Sitede **zorunlu olarak bulunması gerekenler** (iyzico onay için kontrol eder):
   - Mesafeli satış sözleşmesi
   - Gizlilik politikası / KVKK aydınlatma metni
   - İade ve değişim koşulları
   - Teslimat koşulları
   - İletişim bilgileri (adres, telefon, e-posta)

   👉 Bunların hepsi `/admin/sayfalar` bölümünde hazır şablon olarak var. **Metinleri kendi firma bilgilerinle güncelle ve bir avukata kontrol ettir.**
4. Onay genelde 1-3 iş günü sürer.
5. Onaydan sonra **canlı** API anahtarlarını alıp `.env`'i güncelle:

```env
IYZICO_API_KEY="gercek-api-key"
IYZICO_SECRET_KEY="gercek-secret-key"
IYZICO_BASE_URL="https://api.iyzipay.com"
```

### 4.3 Ödeme akışı nasıl çalışıyor?

```
Müşteri kart bilgisini girer
        ↓
Sunucu siparişi "Ödeme Bekliyor" olarak oluşturur  (stok henüz düşmez)
        ↓
iyzico /payment/3dsecure/initialize çağrılır
        ↓
Bankanın 3D Secure ekranı iframe içinde açılır → müşteri SMS kodunu girer
        ↓
Banka /api/odeme/callback adresine POST eder
        ↓
mdStatus = 1 mi?  ──── hayır ──→  sipariş "Başarısız", müşteriye hata gösterilir
        │ evet
        ↓
iyzico /payment/3dsecure/auth ile ödeme kesinleşir
        ↓
Sipariş "Ödendi" → stok düşer, kupon sayacı artar, sepet boşalır, mailler gider
        ↓
Müşteri sonuç sayfasına yönlenir
```

Kart numarasının ilk 6 hanesi girildiğinde `/api/odeme/taksit` çağrılır ve
kartın bankasına göre geçerli taksit seçenekleri gösterilir.

> **Not:** Ödeme imza algoritması (IYZWSv2 / HMAC-SHA256), resmi `iyzipay`
> npm kütüphanesiyle bire bir aynı çıktıyı üretecek şekilde doğrulanmıştır.

---

## 5. E-posta (SMTP) ayarı

Sipariş onayı ve kargo bildirimi mailleri için gerekli. **Boş bırakırsan sistem çalışır,
sadece mail göndermez** (konsola bilgi yazar).

### Gmail ile (küçük hacim için)

1. Google Hesabı → Güvenlik → **2 Adımlı Doğrulama**'yı aç.
2. Sonra → **Uygulama şifreleri** → yeni bir şifre üret (16 haneli).
3. `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="senin@gmail.com"
SMTP_PASS="uygulama-sifresi-16-hane"
MAIL_FROM="Alenora <senin@gmail.com>"
ADMIN_NOTIFY_EMAIL="senin@gmail.com"
```

### Profesyonel kullanım için

Gmail günlük 500 mail sınırı koyar ve maillerin spam'e düşme riski yüksektir.
Ciddi hacim için: **Resend** (ayda 3.000 ücretsiz), **Brevo**, **Amazon SES** veya
hosting firmanın sunduğu kurumsal mail. Hepsi SMTP bilgisi verir, aynı alanlara yazılır.

---

## 6. Canlıya alma: Hostinger

Bu bölüm **Hostinger Web Apps Hosting** (Node.js uygulama paketi) içindir.
Bu paket Next.js'i tanır, GitHub'dan otomatik dağıtır ve sunucuyla uğraşmanı
gerektirmez.

> **Önemli not — hangi Hostinger paketi?**
> Next.js bir Node.js sunucusu olarak çalışır. Bu yüzden:
> - ✅ **Web Apps Hosting** (Node.js) → çalışır, bu bölüm bunu anlatıyor
> - ✅ **VPS (KVM)** → çalışır, bkz. [6.8](#68-alternatif-hostinger-vps)
> - ✅ **Business Web Hosting** → hPanel'de **Web Apps** bölümü açıktır, çalışır
> - ❌ **Premium / Single Web Hosting** → Node.js uygulaması çalıştıramaz,
>   bu paketlerde site **açılmaz** (Business'a yükseltmek gerekir)

### 6.1 Veritabanı: önce burayı halledelim

Projenin veritabanı **MySQL**'dir — yani Hostinger'ın paylaşımlı paketlerinde
hazır gelen veritabanıdır. Ayrı bir servise abone olmana gerek yok, ek ücret
de ödemezsin.

1. hPanel → **Veritabanları → MySQL veritabanları**.
2. Veritabanı adı, kullanıcı adı, şifre gir → **Oluştur**.
   Hostinger ikisinin de başına hesap numaranı ekler, örn. `u242826491_alenora`.
3. Şifreyi kendine kaydet; panel bir daha göstermez, kimseyle paylaşma.
4. Uygulama ile veritabanı aynı sunucuda olduğundan **HOST = `localhost`**.
   `DATABASE_URL` şu biçimde olur:

```
mysql://u242826491_alenora:SIFRE@localhost:3306/u242826491_alenora
```

Bu değeri 6.4'teki ortam değişkenlerine `DATABASE_URL` adıyla ekleyeceksin.
`AUTO_MIGRATE=1` açıkken tablolar ilk dağıtımda kendiliğinden oluşur.

> **Bağlantı sayısı:** paylaşımlı paketlerde eşzamanlı MySQL bağlantısı
> sınırlıdır. Proje varsayılan olarak en fazla 5 bağlantı açar; "too many
> connections" hatası görürsen `DB_POOL_MAX` değişkenini 3'e düşür.

### 6.2 Kodu GitHub'a koy

Hostinger GitHub'dan dağıtım yapar. Depoyu **private** (özel) aç — `.env`
dosyası `.gitignore` içinde olduğu için yüklenmez, anahtarların güvende kalır.

```bash
cd ~/development/lingerie-store
git init                     # zaten varsa atla
git add .
git commit -m "Alenora — ilk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI-ADIN/lingerie-store.git
git push -u origin main
```

> ZIP yükleyerek de dağıtabilirsin ama GitHub'ı bağlarsan her `git push` sonrası
> site kendiliğinden güncellenir. Uzun vadede çok daha rahat.

### 6.3 Uygulamayı oluştur

hPanel → **Websites → Add Website → Web Apps / Node.js** → GitHub deposunu seç.

Ayarlar:

| Alan | Değer |
|---|---|
| Application type | `next` |
| Node version | **20 veya üstü** |
| Install script | `npm ci` |
| Build script | `build` |
| Output directory | `.next` |
| Start script | `start` |

Hostinger `output: "standalone"` ayarını kendisi uygular; `next.config.ts`
dosyasında bir şey değiştirmene gerek yok.

### 6.4 Ortam değişkenleri

hPanel → uygulaman → **Environment variables**. `.env` dosyanı toplu olarak
içe aktarabilir ya da tek tek ekleyebilirsin. Kaydettiğinde Hostinger otomatik
yeniden dağıtır.

**Zorunlu olanlar** (biri eksikse derleme anlaşılır bir hatayla durur):

| Anahtar | Değer | Not |
|---|---|---|
| `DATABASE_URL` | Hostinger MySQL bağlantı adresi | `mysql://kullanici:sifre@localhost:3306/veritabani` |
| `AUTH_SECRET` | `openssl rand -base64 48` çıktısı | **Yereldekinden farklı olsun.** Değişirse herkesin oturumu kapanır |
| `ADMIN_PATH` | `yonetim-a1b2c3d4` | Gizli panel adresi. `openssl rand -hex 4` ile üret |
| `NEXT_PUBLIC_ADMIN_PATH` | `ADMIN_PATH` ile **birebir aynı** | Tarayıcı tarafı için |

**Olması gerekenler:**

| Anahtar | Değer |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://alanadin.com` |
| `NEXT_PUBLIC_SITE_NAME` | `Alenora` |
| `NODE_ENV` | `production` |
| `AUTO_MIGRATE` | `1` → her dağıtımda veritabanı şeması kendiliğinden güncellenir |
| `STORAGE_DRIVER` | `db` (varsayılan; bu pakette **file yapma**, görseller kaybolur) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Mail sunucusu — **yoksa yönetici giriş kodu e-postayla gitmez** |
| `MAIL_FROM` | `Alenora <siparis@alanadin.com>` |
| `ADMIN_NOTIFY_EMAIL` | Sipariş bildirimlerinin düşeceği adres |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` | iyzico anahtarların |
| `IYZICO_BASE_URL` | Test: `https://sandbox-api.iyzipay.com` · Canlı: `https://api.iyzipay.com` |

> `NEXT_PUBLIC_` ile başlayan değişkenler **derleme sırasında** koda gömülür.
> Değiştirdiğinde mutlaka yeniden dağıtım yapılmalı (Hostinger kaydettiğinde
> kendisi yapıyor).

### 6.5 İlk dağıtım ve veritabanını doldurma

`AUTO_MIGRATE=1` ayarlıysa tablolar ilk dağıtımda kendiliğinden oluşur.
Örnek kategorileri, sayfaları ve yönetici hesabını yüklemek için **bir kez**,
kendi bilgisayarından canlı veritabanına bağlanarak:

```bash
# .env içindeki DATABASE_URL'i geçici olarak canlı adresle değiştir
npm run db:seed
```

> ⚠️ `db:seed` mevcut **tüm** veriyi siler. Yalnızca site boşken, ilk kurulumda
> çalıştır. Çıktıda yöneticinin **8 yedek giriş kodu** bir kez görünür —
> güvenli bir yere kaydet.

Sonra `.env` dosyanı yerel veritabanına geri çevirmeyi unutma.

### 6.6 Alan adını ve SSL'i bağla

Alan adın zaten Hostinger'daysa:

1. hPanel → uygulaman → **Domains** → alan adını seç.
2. Hostinger DNS kaydını kendisi oluşturur.
3. **SSL** sekmesinden ücretsiz sertifikayı aç (genelde otomatik gelir).
4. DNS yayılması 5 dakika – 24 saat sürebilir.

Bittiğinde `NEXT_PUBLIC_SITE_URL` değerini kesin adresle güncelle — iyzico'nun
geri dönüş (callback) adresi buradan üretiliyor, yanlışsa ödeme tamamlanmaz.

iyzico panelinde de **callback adresini** güncelle:

```
https://alanadin.com/api/odeme/callback
```

### 6.7 Dağıtım sonrası kontrol listesi

| Kontrol | Nasıl |
|---|---|
| Site ayakta mı | `https://alanadin.com/api/saglik` → `{"ok":true,"db":"up"}` dönmeli |
| Panel gizli mi | `https://alanadin.com/admin` → **404** dönmeli |
| Panel açılıyor mu | `https://alanadin.com/<ADMIN_PATH>` → giriş ekranı |
| 2FA çalışıyor mu | Admin şifresini gir → e-postana 6 haneli kod gelmeli |
| Görsel yükleme | Panel → Medya → bir görsel yükle, listede görünmeli |
| HTTPS zorunlu mu | `http://` ile gir, `https://`'e düşmeli |
| Güvenlik başlıkları | <https://securityheaders.com> adresinde alan adını tara |

**Yayına almadan önce mutlaka:** admin şifresini değiştir (`Admin123!` kalmasın),
`AUTH_SECRET` ve `ADMIN_PATH` değerlerinin yereldekinden farklı olduğunu doğrula.

### 6.8 Alternatif: Hostinger VPS

Tam kontrol istiyorsan (veritabanını da aynı makinede çalıştırmak, dosya
sistemine yazmak, sınırsız depolama) VPS paketi uygundur:

```bash
# Ubuntu 24.04 VPS üzerinde
sudo apt update && sudo apt install -y nodejs npm mariadb-server nginx certbot python3-certbot-nginx
sudo mysql -e "create database alenora character set utf8mb4 collate utf8mb4_unicode_ci;"
git clone https://github.com/KULLANICI-ADIN/lingerie-store.git
cd lingerie-store && npm ci && cp .env.example .env   # .env'i doldur
npm run db:migrate && npm run db:seed
npm run build
sudo npm i -g pm2
pm2 start npm --name alenora -- start     # 3000 portunda çalışır
pm2 startup && pm2 save
```

Sonra nginx'i 80/443'ten 3000'e yönlendir ve `sudo certbot --nginx -d alanadin.com`
ile ücretsiz SSL al. VPS'te `STORAGE_DRIVER="file"` kullanabilirsin —
dosya sistemi kalıcıdır.

### 6.9 Alternatif: Vercel

Next.js'in üreticisinin platformu; ücretsiz paketi küçük siteler için yeterli.
GitHub deposunu bağla, aynı ortam değişkenlerini gir, **Deploy**. Görsel
depolama yine `db` sürücüsünde kalmalı (Vercel'in dosya sistemi de geçicidir).

---

## 7. Görsel yükleme ve depolama

Panelden yüklediğin görseller **varsayılan olarak veritabanında** saklanır ve
`/api/gorsel/<id>` adresinden sunulur.

**Neden dosya değil de veritabanı?** Yönetilen hosting paketlerinde (Hostinger
Web Apps, Vercel, Railway…) uygulamanın yazdığı dosyalar kalıcı değildir: her
yeni dağıtımda sunucu sıfırdan kurulur ve `public/uploads` altına yazdığın
görseller kaybolur. Veritabanında duran görseller dağıtımdan, sunucu
değişiminden ve ölçeklenmeden etkilenmez; veritabanı yedeğini aldığında
görsellerin de yedeklenmiş olur.

Görsel adresleri değişmez olduğu için bir yıllık önbellek başlığıyla sunulur —
ikinci istekte tarayıcıdan gelir, veritabanına tekrar gidilmez.

### Sürücüyü değiştirmek

`.env` dosyasındaki tek satır belirler:

```bash
STORAGE_DRIVER="db"    # varsayılan — veritabanı (her yerde çalışır)
STORAGE_DRIVER="file"  # public/uploads — yalnızca KENDİ sunucun/VPS varsa
```

### Dış adres yapıştırmak

Her görsel alanında "veya görsel adresi yapıştır" kutusu var. Cloudinary, S3
gibi bir yerde duran görselin adresini doğrudan yapıştırabilirsin. Dış alan
adı kullanacaksan `next.config.ts` içine eklemen gerekir:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "res.cloudinary.com" },
  ],
}
```

### Sınırlar

| Konu | Değer |
|---|---|
| En büyük dosya | 6 MB |
| Kabul edilen türler | JPG, PNG, WEBP, AVIF, GIF |
| Kabul edilmeyen | SVG (içine script gömülebilir) |
| Denetim | Uzantıya değil, dosyanın ilk baytlarına bakılır |

> Görseller veritabanında saklandığı için hosting paketindeki veritabanı
> kotası (Business pakette sınırsız, ama tablo başına pratik bir sınır var)
> görsellerle paylaşılır. Yüzlerce ürün fotoğrafı
> yükleyecekseniz görselleri yüklemeden önce 200–400 KB'a düşürmek (TinyPNG,
> Squoosh) hem yeri hem sayfa hızını ciddi biçimde iyileştirir.

---

## 8. Yönetim panelini kullanma

### İlk kurulum sırası (önerilen)

1. **Ayarlar** → kargo ücretini, ücretsiz kargo limitini, iletişim bilgilerini ve
   banka hesap bilgilerini gir.
2. **Sayfalar** → beş kurumsal metni kendi firma bilgilerinle güncelle.
3. **Kategoriler** → kendi kategori yapını kur (örnek kategoriler silinebilir).
4. **Ürünler → Yeni Ürün** → ürünü kaydet, sonra:
   - **Görseller** bölümünden fotoğrafları yükle (ilk görsel kapak olur)
   - **Varyantlar → Toplu Oluştur** ile renk × beden kombinasyonlarını tek seferde üret
5. **Görünüm → Carousel** → anasayfa slaytlarını kendi görsellerinle değiştir.
   **Görünüm → Ana Sayfa Düzeni** → bölümlerin sırasını kendine göre ayarla.
6. **Kuponlar** → açılış kampanyanı tanımla.
7. **Hesabım → Şifre Değiştir** → admin şifresini değiştir!
8. **Güvenlik** ekranından açık oturumlarını ve denetim kaydını kontrol et.

### Günlük iş akışı

**Sipariş geldiğinde:**

1. Panel → **Siparişler** → yeni siparişe gir.
2. Kartla ödendiyse durum otomatik **Ödendi** olur. Havale ise ödemeyi banka
   hesabından kontrol et, sonra durumu **Ödendi** yap.
3. Ürünleri paketle, durumu **Hazırlanıyor** yap.
4. Kargoya verince **Kargo Bilgisi** kutusuna firma ve takip numarasını gir →
   **Kaydet ve Müşteriye Bildir**. Durum otomatik **Kargoda** olur ve müşteriye mail gider.
5. Teslim edilince **Teslim Edildi** yap.

**İade talebinde:**

- Kartla ödendiyse: sipariş detayında **İade İşlemi Başlat** → iyzico üzerinden
  para geri döner ve stok otomatik geri eklenir.
- Havale/kapıda ödemede: parayı elden/banka yoluyla gönder, sonra durumu
  **İade Edildi** yap (stok otomatik geri eklenir).

**Stok takibi:**

- Panel ana sayfasındaki **Kritik Stok** listesi, kritik eşiğin altına düşen
  varyantları gösterir. Eşiği her varyant için ayrı ayarlayabilirsin.
- **Stok Durumu** sayfasında satır içinde hızlıca güncelleyebilirsin. Her
  değişiklik `stock_movements` tablosuna kaydedilir (kim ne zaman ne yaptı izlenebilir).

---

## 9. Güvenlik

Bu projede güvenlik tek bir yere bırakılmaz; birden fazla katman vardır.
Bir katman aşılsa bile diğerleri devrede kalır.

### Yönetim paneli ayrı ve gizli bir adrestedir

Panel kodları projede `/admin` altında durur ama **dışarıya bu adresle asla
açılmaz**. Erişim yalnızca `.env` dosyandaki `ADMIN_PATH` ile tanımlı gizli
yoldan olur:

```bash
ADMIN_PATH="yonetim-8f3a2c"
NEXT_PUBLIC_ADMIN_PATH="yonetim-8f3a2c"   # ikisi de AYNI olmalı
```

- Panel adresi: `https://alanadin.com/yonetim-8f3a2c`
- `https://alanadin.com/admin` → sitenin normal **"sayfa bulunamadı"** ekranı (404).
  Dışarıdan bakan biri panelin var olup olmadığını anlayamaz.
- Giriş yapmış ama yetkisi olmayan bir müşteri gizli adresi bilse bile 404 görür.
- Panel sayfalarına `noindex` verilir ve önbelleğe alınmaz.
- Vitrinde panele giden **hiçbir bağlantı yoktur**; müşteri panelin varlığını
  hiçbir şekilde görmez.

> Gizlilik tek başına güvenlik değildir — asıl koruma giriş + rol + 2FA
> kontrolüdür. Ama bot taramalarını ve otomatik saldırı denemelerini pratikte
> sıfıra indirir. Kendi değerini `openssl rand -hex 4` ile üret.

### İki adımlı doğrulama (2FA)

Yönetici şifresi doğru girildiğinde oturum **hemen açılmaz**. E-posta adresine
6 haneli bir kod gider:

- Kod veritabanında düz metin değil, **bcrypt özeti** olarak saklanır.
- 10 dakika geçerlidir, **tek kullanımlıktır**, 5 yanlış denemede iptal olur.
- "Bu cihazı 30 gün hatırla" seçilirse aynı tarayıcıda tekrar sorulmaz.
- SMTP tanımlı değilse kod sunucu konsoluna yazılır (sadece geliştirme için).
- `npm run db:seed` çalıştırıldığında **8 adet yedek kod** ekrana bir kez basılır.
  E-postaya erişemezsen panele bunlarla girebilirsin — güvenli bir yere kaydet.

### Kaba kuvvet koruması

| Koruma | Eşik |
|---|---|
| IP başına hatalı deneme | 15 dakikada 20 |
| Hesap başına hatalı deneme | 15 dakikada 8 |
| Hesap kilidi | 5 ardışık hatada 5 dk; her turda katlanır, en fazla 60 dk |
| 2FA kodu denemesi | 5 hata → kod iptal |
| Kod tekrar gönderme | 45 saniyede bir |

Hatalı giriş mesajı her zaman aynıdır ("E-posta veya şifre hatalı"), kayıtlı
olmayan bir e-posta için de **şifre doğrulama maliyeti kadar beklenir**. Böylece
ne mesajdan ne de yanıt süresinden "bu e-posta kayıtlı mı" bilgisi sızmaz.

### Oturum güvenliği

- Oturum çerezi `httpOnly` + `secure` + `sameSite=lax`; içinde imzalı JWT taşır.
- JWT tek başına yetmez: **her oturumun veritabanında bir satırı vardır**. Satır
  iptal edilirse çerez geçerli olsa bile oturum ölür.
- Yönetici oturumu **8 saat**, müşteri oturumu 30 gün yaşar.
- Şifre değiştirildiğinde diğer tüm oturumlar otomatik kapanır.
- **Güvenlik** ekranından açık cihazlarını görür, tek tek veya toplu kapatırsın.

### Denetim kaydı (audit log)

Panelde yapılan her değiştirici işlem — ürün, stok, sipariş durumu, kupon,
slayt, ayar, giriş denemesi — kim, ne zaman, hangi IP'den sorularıyla birlikte
`audit_logs` tablosuna yazılır ve **silinmez**. Panel → **Güvenlik** ekranından
görürsün.

### Uygulama seviyesi

| Konu | Nasıl korunuyor |
|---|---|
| Şifreler | bcrypt, 12 tur. Düz metin asla saklanmaz. En az 10 karakter, harf + rakam zorunlu; yaygın şifreler reddedilir |
| SQL enjeksiyonu | Tüm sorgular Drizzle ORM ile parametreli |
| XSS | React varsayılan kaçışı + panelden girilen zengin metin `sanitizeRichText` ile temizlenir |
| CSRF | Server Action'larda Origin kontrolü + yükleme uçlarında çift gönderim jetonu |
| Açık yönlendirme | `next=` parametresi yalnızca site içi yollara izin verir |
| Dosya yükleme | Uzantıya değil **dosyanın ilk baytlarına** bakılır (magic byte). SVG kabul edilmez, 6 MB sınırı, dosya adı sunucuda üretilir |
| Rol yükseltme | Kayıt formundan rol alınmaz; yeni hesaplar her zaman müşteridir |
| Güvenlik başlıkları | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy — `next.config.ts` içinde |
| Kart bilgisi | Sunucuya hiç uğramaz; iyzico'ya 3D Secure ile gider. Veritabanında saklanmaz |

### Yayına almadan önce mutlaka

1. `AUTH_SECRET` değerini değiştir: `openssl rand -base64 48` (en az 32 karakter).
2. `ADMIN_PATH` için tahmin edilemez bir son ek üret: `openssl rand -hex 4`.
3. Admin şifresini **Hesabım → Şifre Değiştir**'den değiştir (`Admin123!` kalmasın).
4. SMTP'yi ayarla — yoksa 2FA kodu e-postayla gitmez.
5. Yedek kodları güvenli bir yere kaydet.
6. Siteyi mutlaka **HTTPS** üzerinden yayınla (HSTS başlığı yalnızca canlıda açılır).

---

## 10. Ana sayfayı panelden yönetmek

Ana sayfada **kodda sabitlenmiş hiçbir bölüm yoktur**. Müşterinin gördüğü her
alan panelden yönetilir.

### Ana Sayfa Düzeni ekranı

Panel → **Görünüm → Ana Sayfa Düzeni**. Her blok bir satırdır:

- ↑ ↓ ile sırasını değiştir
- **Gizle / Yayına al** ile yayından kaldır (silmeden)
- **Düzenle** ile başlığını ve ayarlarını değiştir
- **Sil** ile tamamen kaldır (iki kez basılır, yanlışlıkla silinmez)

Eklenebilecek bölüm tipleri:

| Tip | Ne yapar | Ayarlanabilenler |
|---|---|---|
| Carousel (slayt) | Üstteki büyük dönen alan | Geçiş süresi, yükseklik, ok ve nokta göstergeleri |
| Güven şeridi | Kargo / iade / güvenli ödeme vaatleri | 4 adete kadar simge + başlık + açıklama |
| Kategori kutuları | Görselli kategori bağlantıları | Hangi kategoriler, kaç tane, sütun sayısı, kutu oranı |
| Ürün listesi | Ürün rayı veya ızgarası | Kaynak (öne çıkan / yeni / indirimli / çok satan / kategori), adet, düzen, "tümünü gör" bağlantısı |
| Tanıtım bandı | Tek büyük görsel + başlık + buton | Masaüstü ve mobil görsel, hizalama, karartma, yazı rengi, düzen |
| Serbest metin | Marka hikâyesi gibi metin blokları | Başlık, metin, buton, genişlik |
| Bülten kaydı | E-posta toplama alanı | Başlık, açıklama, zemin rengi |

### Carousel ekranı

Panel → **Görünüm → Carousel**. Her slaytta:

- **Masaüstü görseli** ve ayrı **mobil görseli** (mobilde dikey kesim daha iyi durur)
- Üst yazı, başlık, açıklama
- **İki ayrı buton** (ana + ikincil), her birinin kendi adresi
- Hizalama (sol/orta/sağ), yazı rengi (açık/koyu), **karartma oranı** (yazı
  okunmuyorsa artır)
- **Yayın başlangıcı ve bitişi** — kampanya slaytını önceden hazırlayıp tarihini
  verebilirsin, zamanı gelince kendi çıkar, bitince kendi iner
- Sırala, gizle, sil

### Medya kütüphanesi

Panel → **Görünüm → Medya**. Yüklediğin her görsel buraya kaydedilir ve
carousel, tanıtım bandı, kategori, logo gibi her yerden tekrar seçilebilir.
Görsel açıklaması (alt metni) yazabilir, adresini kopyalayabilirsin.

### Diğer alanlar

| Alan | Nereden |
|---|---|
| Üst duyuru şeridi (metin, renk, aç/kapat) | Ayarlar → Üst Duyuru Şeridi |
| Logo (yazı ya da görsel) | Ayarlar → Site Bilgileri |
| Menüdeki vurgulu bağlantı ("İndirim") | Ayarlar → Üst Duyuru Şeridi |
| Menü kategorileri | Kategoriler |
| Alt bilgi kolonları ve bağlantıları | Ayarlar → Alt Bilgi |
| Sosyal medya adresleri | Ayarlar → İletişim Bilgileri |
| Kurumsal sayfa metinleri | Sayfalar |

---

## 11. Yasal zorunluluklar (Türkiye)

Bu bir yazılım projesi, hukuki danışmanlık değil. **Yayına almadan önce bir
avukata ve mali müşavire danışman gerekir.** Yine de bilmen gerekenler:

| Konu | Ne gerekiyor |
|---|---|
| **Şirket** | Şahıs şirketi veya limited. E-ticaret için vergi levhası zorunlu. |
| **ETBİS kaydı** | Ticaret Bakanlığı'nın E-Ticaret Bilgi Sistemi'ne kayıt zorunlu: <https://etbis.ticaret.gov.tr> |
| **Mesafeli satış sözleşmesi** | Zorunlu. Şablon `/admin/sayfalar`'da var, firma bilgilerini gir. |
| **Ön bilgilendirme formu** | Zorunlu. Sipariş öncesi müşteriye gösterilmeli. |
| **Cayma hakkı** | 14 gün. İç giyimde hijyen etiketi açılmışsa istisna uygulanır — bunu iade metninde açıkça yaz. |
| **KVKK** | Aydınlatma metni + açık rıza. Şablon hazır, VERBİS kaydı gerekebilir. |
| **Fatura** | e-Arşiv fatura zorunlu. Mali müşavirinle entegrasyon (Paraşüt, Logo, Nilvera vb.) kur. |
| **Çerez politikası** | Analitik/pazarlama çerezi kullanacaksan çerez banner'ı eklemen gerekir. |
| **Fiyat gösterimi** | KDV dahil fiyat gösterilmesi zorunlu — sistem KDV dahil gösteriyor. |

---

## 12. Proje yapısı

```
lingerie-store/
├── drizzle/                      # SQL migration dosyaları (otomatik üretilir)
├── public/
│   ├── images/                   # örnek ürün/kategori/banner görselleri
│   └── uploads/                  # panelden yüklenen görseller
├── src/
│   ├── actions/                  # Server Actions (form gönderimleri)
│   │   ├── auth.ts               # kayıt, giriş, çıkış
│   │   ├── account.ts            # profil, adres, favori, yorum
│   │   ├── cart.ts               # sepete ekle/çıkar, kupon
│   │   ├── checkout.ts           # ⭐ sipariş oluşturma + iyzico başlatma
│   │   ├── admin-products.ts     # ürün, görsel, varyant, stok
│   │   ├── admin-orders.ts       # sipariş durumu, kargo, iade
│   │   ├── admin-content.ts      # kategori, kupon, banner, sayfa, ayar
│   │   └── newsletter.ts         # bülten, iletişim formu
│   ├── app/
│   │   ├── (shop)/               # müşterinin gördüğü sayfalar
│   │   ├── admin/                # yönetim paneli
│   │   ├── api/
│   │   │   ├── odeme/callback/   # ⭐ iyzico 3D Secure dönüşü
│   │   │   ├── odeme/taksit/     # taksit sorgulama
│   │   │   └── admin/upload/     # görsel yükleme
│   │   ├── globals.css           # ⭐ tasarım sistemi (renkler, butonlar, formlar)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── shop/                 # vitrin bileşenleri
│   │   └── admin/                # panel bileşenleri
│   ├── db/
│   │   ├── schema.ts             # ⭐ veritabanı şeması — 20 tablo
│   │   ├── index.ts              # bağlantı
│   │   └── seed.ts               # örnek veriler
│   ├── lib/
│   │   ├── auth.ts               # oturum, şifre hash
│   │   ├── cart.ts               # ⭐ sepet mantığı ve tutar hesabı
│   │   ├── orders.ts             # ⭐ sipariş, stok düşümü, iade
│   │   ├── iyzico.ts             # ⭐ sanal POS entegrasyonu
│   │   ├── catalog.ts            # ürün/kategori sorguları
│   │   ├── money.ts              # kuruş ↔ TL dönüşümleri
│   │   ├── settings.ts           # site ayarları
│   │   ├── mail.ts               # e-posta gönderimi
│   │   └── utils.ts              # slug, tarih, il listesi
│   └── proxy.ts                  # yetki ön kontrolü (eski adıyla middleware)
├── .env                          # ⚠️ gizli bilgiler — asla GitHub'a gitmez
├── .env.example                  # şablon
├── drizzle.config.ts
└── next.config.ts
```

### Veritabanı tabloları

| Tablo | Ne tutar |
|---|---|
| `users` | müşteri ve admin hesapları |
| `addresses` | müşterilerin adres defteri (kurumsal fatura alanları dahil) |
| `categories` | iki seviyeli kategori ağacı |
| `brands` | marka |
| `products` | ürün ana bilgisi, fiyat, SEO, kumaş bilgisi |
| `product_images` | ürün görselleri (renge bağlanabilir) |
| `product_variants` | **beden + renk kombinasyonu — stok burada** |
| `product_categories` | ürün ↔ kategori bağlantısı |
| `stock_movements` | her stok hareketinin kaydı (giriş, satış, iade, düzeltme) |
| `carts`, `cart_items` | sepet (misafir sepeti cookie token'ı ile) |
| `orders` | sipariş başlığı, tutarlar, adres anlık kopyası |
| `order_items` | sipariş satırları (ürün bilgisinin anlık kopyası) |
| `payments` | iyzico ödeme kayıtları, hata mesajları |
| `coupons` | indirim kuponları |
| `reviews` | ürün yorumları (onay bekler) |
| `favorites` | favori listesi |
| `settings` | site ayarları (key/value) |
| `banners` | anasayfa slider |
| `pages` | kurumsal içerik sayfaları |
| `newsletter_subscribers` | bülten kayıtları |
| `contact_messages` | iletişim formu mesajları |

---

## 13. Sık karşılaşılan sorunlar

**`DATABASE_URL tanımlı değil` hatası**
`.env` dosyası proje kök dizininde mi? `.env.example` değil `.env` olması gerekiyor.
Sunucuyu yeniden başlat.

**`AUTH_SECRET eksik veya çok kısa`**
En az 16 karakter olmalı. `openssl rand -base64 32` ile üret.

**`relation "products" does not exist`**
Migration çalıştırılmamış: `npm run db:migrate`

**Ödeme sayfasında kredi kartı seçeneği görünmüyor**
`.env` içindeki `IYZICO_API_KEY` ve `IYZICO_SECRET_KEY` boş veya hâlâ `xxxxx`
içeriyor. Doldurup sunucuyu yeniden başlat. Ayrıca Ayarlar sayfasında
"Kredi / banka kartı" işaretli olmalı.

**3D Secure ekranı açılmıyor / boş geliyor**
`NEXT_PUBLIC_SITE_URL` değeri gerçek adresle aynı olmalı — callback adresi
buradan üretiliyor. Yerelde `http://localhost:3000` olmalı.

**Ödeme sonrası "Ödeme kaydı bulunamadı"**
Callback adresine iyzico ulaşamıyor. Yerelde test ediyorsan iyzico
`localhost`'a POST edemez; bu durumda **ngrok** gibi bir tünel kullan:
```bash
npx ngrok http 3000
# çıkan https adresini NEXT_PUBLIC_SITE_URL'e yaz
```

**Görsel yüklerken "Dosya kaydedilemedi"**
Vercel'de dosya sistemi salt-okunur. Bölüm 7'ye bak.

**Panelde değişiklik yaptım, sitede görünmüyor**
Sayfa önbelleğe alınmış olabilir. Sayfayı yenile (Ctrl+Shift+R). Sorun devam
ederse `npm run build && npm run start` ile yeniden derle.

**Şifremi unuttum**
Şifre sıfırlama e-postası henüz yok. Veritabanından elle değiştir:
```bash
node -e "console.log(require('bcryptjs').hashSync('YeniSifre123!', 12))"
```
Çıkan değeri `users` tablosundaki `password_hash` alanına yaz.

---

## Sonraki adımlar için fikirler

Sistem şu an satışa hazır. İleride eklenebilecekler:

- Şifremi unuttum (e-posta ile sıfırlama)
- Kargo firması API entegrasyonu (otomatik takip numarası)
- e-Arşiv fatura entegrasyonu (Paraşüt / Nilvera / Logo)
- Google Analytics 4 + Meta Pixel
- Trendyol / Hepsiburada pazaryeri entegrasyonu
- Sepette bırakılan ürün hatırlatma maili
- Stok tükenince "gelince haber ver" bildirimi
- Çoklu dil ve döviz desteği
