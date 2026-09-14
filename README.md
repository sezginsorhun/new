# Alenora — İç Giyim E-Ticaret Sistemi

Next.js 16 + PostgreSQL + iyzico ile yazılmış, tam işlevli bir iç giyim e-ticaret sitesi.
Vitrin, sepet, üyelik, 3D Secure ödeme ve kapsamlı bir yönetim paneli içerir.

---

## İçindekiler

1. [Neler var?](#1-neler-var)
2. [Hızlı başlangıç (kendi bilgisayarında)](#2-hızlı-başlangıç-kendi-bilgisayarında)
3. [Veritabanı nereye kurulur?](#3-veritabanı-nereye-kurulur)
4. [iyzico sanal POS başvurusu ve ayarı](#4-iyzico-sanal-pos-başvurusu-ve-ayarı)
5. [E-posta (SMTP) ayarı](#5-e-posta-smtp-ayarı)
6. [Canlıya alma (Vercel)](#6-canlıya-alma-vercel)
7. [Görsel yükleme: canlıda dikkat!](#7-görsel-yükleme-canlıda-dikkat)
8. [Yönetim panelini kullanma](#8-yönetim-panelini-kullanma)
9. [Yasal zorunluluklar (Türkiye)](#9-yasal-zorunluluklar-türkiye)
10. [Proje yapısı](#10-proje-yapısı)
11. [Sık karşılaşılan sorunlar](#11-sık-karşılaşılan-sorunlar)

---

## 1. Neler var?

### Vitrin (müşterinin gördüğü kısım)

| Sayfa | Adres | Ne yapar |
|---|---|---|
| Anasayfa | `/` | Dönen banner, kategori vitrini, öne çıkanlar, indirimliler, yeni gelenler |
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
- **Sipariş numarası çakışması yok:** PostgreSQL sequence kullanılır (`SP-2026-000123`).
- **Kart bilgisi saklanmaz:** Kart verisi veritabanına yazılmaz, loglanmaz. Doğrudan iyzico'ya gider.
- **Şifreler:** bcrypt (12 tur). Oturum: imzalı JWT, httpOnly cookie.
- **Yetki kontrolü iki katmanlı:** `proxy.ts` hızlı ön kontrol yapar, her sayfa ayrıca `requireAdmin()` ile veritabanından doğrular.
- **SEO:** Her ürün/kategori için ayarlanabilir meta etiketler, ürün sayfalarında `Product` yapılandırılmış verisi (JSON-LD).
- **Erişilebilirlik:** Klavye ile gezinilebilir, `aria` etiketleri, görünür odak halkaları.

---

## 2. Hızlı başlangıç (kendi bilgisayarında)

### Gereksinimler

- **Node.js 20.9 veya üzeri** — [nodejs.org](https://nodejs.org) (LTS sürümü)
- **PostgreSQL** — yerel kurulum ya da ücretsiz bulut (bkz. bölüm 3)
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
DATABASE_URL="postgresql://postgres:SIFREN@localhost:5432/lingerie"
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

Üç seçenek var. **Yeni başlıyorsan Neon öneririm** — ücretsiz, 2 dakikada hazır.

### Seçenek A — Neon (önerilen, ücretsiz)

1. <https://neon.tech> adresine gir, GitHub ile kayıt ol.
2. **Create project** → bölge olarak **Frankfurt** veya **Europe** seç (Türkiye'ye en yakın).
3. Açılan ekranda **Connection string**'i kopyala. Şuna benzer:
   ```
   postgresql://kullanici:sifre@ep-xxx-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Bunu `.env` içindeki `DATABASE_URL` satırına yapıştır.
5. `npm run db:migrate && npm run db:seed` çalıştır.

### Seçenek B — Supabase (ücretsiz)

1. <https://supabase.com> → **New project**.
2. **Project Settings → Database → Connection string → URI** sekmesinden bağlantıyı kopyala.
3. **Önemli:** "Connection pooling" bölümündeki **6543** portlu adresi kullan (Transaction mode). Kod `prepare: false` ile bu moda uyumlu yazıldı.
4. `[YOUR-PASSWORD]` kısmını gerçek şifrenle değiştir.

### Seçenek C — Bilgisayarına kurmak

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb lingerie
# DATABASE_URL="postgresql://$(whoami)@localhost:5432/lingerie"
```

**Windows:** <https://www.postgresql.org/download/windows/> adresinden kurulum dosyasını indir.
Kurulumda belirlediğin şifreyi not al. Sonra pgAdmin'den `lingerie` adında bir veritabanı oluştur.

**Ubuntu / Debian:**
```bash
sudo apt install postgresql
sudo -u postgres createdb lingerie
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'sifren';"
```

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

## 6. Canlıya alma (Vercel)

### 6.1 Kodu GitHub'a koy

```bash
cd lingerie-store
git init                          # zaten varsa atla
git add .
git commit -m "İlk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI-ADIN/lingerie-store.git
git push -u origin main
```

> GitHub'da repoyu **private** (özel) oluştur. `.env` dosyası `.gitignore` içinde
> olduğu için yüklenmez — API anahtarların güvende.

### 6.2 Vercel'e bağla

1. <https://vercel.com> → GitHub ile giriş yap.
2. **Add New → Project** → repoyu seç → **Import**.
3. **Environment Variables** bölümüne `.env` içindeki tüm satırları ekle:

| Anahtar | Değer |
|---|---|
| `DATABASE_URL` | Neon/Supabase bağlantı adresin |
| `AUTH_SECRET` | `openssl rand -base64 32` çıktısı (yerelden farklı olsun) |
| `NEXT_PUBLIC_SITE_URL` | `https://alanadin.com` (veya vercel adresi) |
| `NEXT_PUBLIC_SITE_NAME` | Site adın |
| `IYZICO_API_KEY` | Canlı API key |
| `IYZICO_SECRET_KEY` | Canlı secret key |
| `IYZICO_BASE_URL` | `https://api.iyzipay.com` |
| `SMTP_*`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | Mail ayarları |

4. **Deploy**'a bas.

### 6.3 Veritabanı tablolarını canlıda oluştur

İlk deploy'dan sonra bir kez, kendi bilgisayarından canlı veritabanına bağlanarak:

```bash
# .env içindeki DATABASE_URL'i geçici olarak canlı adresle değiştir
npm run db:migrate

# Kategorileri ve kurumsal sayfaları da isteyerek yükleyebilirsin:
npm run db:seed     # ⚠️ DİKKAT: mevcut tüm veriyi siler!
```

Canlıda seed yerine ürünleri panelden tek tek girmek daha doğrudur.
Sadece admin kullanıcısı gerekiyorsa:

```sql
-- Şifre hash'i üretmek için: node -e "console.log(require('bcryptjs').hashSync('YeniSifre123!', 12))"
insert into users (id, email, password_hash, first_name, last_name, role)
values ('admin001', 'sen@alanadin.com', '$2a$12$...', 'Ad', 'Soyad', 'ADMIN');
```

### 6.4 Alan adını bağla

Vercel → proje → **Settings → Domains** → alan adını yaz. Vercel sana DNS
kayıtlarını gösterir; bunları alan adını aldığın yerde (GoDaddy, Natro, Turhost...)
tanımlarsın. Genelde:

```
A     @      76.76.21.21
CNAME www    cname.vercel-dns.com
```

DNS yayılması 5 dakika – 24 saat sürebilir. Bittiğinde `NEXT_PUBLIC_SITE_URL`
değerini de yeni alan adına güncelle (iyzico callback adresi buradan üretiliyor).

### 6.5 Alternatif: kendi sunucunda (VPS)

```bash
npm run build
npm run start          # 3000 portunda çalışır
```

Önüne **nginx** koyup 80/443'ten yönlendir, SSL için **certbot** kullan.
Sürekli çalışması için **pm2**:

```bash
npm i -g pm2
pm2 start npm --name alenora -- start
pm2 startup && pm2 save
```

---

## 7. Görsel yükleme: canlıda dikkat!

Panel görselleri `public/uploads/` klasörüne kaydeder. Bu **kendi bilgisayarında
ve kendi VPS'inde sorunsuz çalışır.**

**Ama Vercel'de çalışmaz** — Vercel'in dosya sistemi salt-okunurdur ve her
deploy'da sıfırlanır. Vercel kullanacaksan iki seçenek var:

### Kolay yol: görsel adresi yapıştırmak

Panelde her görsel alanında "veya görsel adresi yapıştır" kutusu var.
Görselleri Cloudinary / Imgur / kendi CDN'ine yükleyip adresini yapıştırabilirsin.
Dış alan adı kullanacaksan `next.config.ts` içine eklemen gerekir:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "res.cloudinary.com" },
  ],
}
```

### Doğru yol: Vercel Blob veya Cloudinary bağlamak

**Vercel Blob** (en kolay entegrasyon):

```bash
npm i @vercel/blob
```

Sonra `src/app/api/admin/upload/route.ts` dosyasındaki `writeFile` bölümünü şununla değiştir:

```ts
import { put } from "@vercel/blob";

const blob = await put(fileName, file, { access: "public" });
return Response.json({ ok: true, url: blob.url });
```

Vercel panelinde **Storage → Blob** oluşturup `BLOB_READ_WRITE_TOKEN`'ı
ortam değişkeni olarak eklemen yeterli. `next.config.ts` içindeki
`remotePatterns`'a `*.public.blob.vercel-storage.com` eklemeyi unutma.

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
5. **Bannerlar** → anasayfa görsellerini değiştir.
6. **Kuponlar** → açılış kampanyanı tanımla.
7. **Hesabım → Şifre Değiştir** → admin şifresini değiştir!

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

## 9. Yasal zorunluluklar (Türkiye)

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

## 10. Proje yapısı

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

## 11. Sık karşılaşılan sorunlar

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
