#!/usr/bin/env python3
"""
TOPTANCI KATALOĞU ÜRETİCİ

İki tedarikçiden ürünleri çeker, mağazaya uygun hale getirir ve şunları yazar:

  src/db/katalog-toptanci.json   → `import-toptanci.ts` bunu veritabanına yükler
  public/images/urunler/*.webp   → ürün fotoğrafları (1000 px, WebP)

Kaynaklar
  - toptanerotikshop.com  WooCommerce Store API (herkese açık): ad, açıklama,
                          toptan fiyat, stok durumu, kategori, fotoğraflar
  - toptanerotik.com      /toptan-sex-shop/ vitrin sayfası: ad, ürün kodu,
                          tek fotoğraf (fiyat yayınlanmıyor)

FİYATLANDIRMA
Perakende fiyat = toptan fiyat × kademeli çarpan. Çarpanlar Kasım 2026'da
Türkiye'deki perakende satıcılarla (idefix, Trendyol, n11, Hepsiburada)
karşılaştırılarak belirlendi; örnekler:

  ürün                          toptan     piyasa          oran
  Peluşlu metal kelepçe            160     240 – 490 TL    ~2,0
  Metal taşlı anal plug (orta)     170     300 – 396 TL    ~2,0
  Best Man jel (55 ml → 150 ml)    110     212 – 300 TL    ~1,9
  Realistik dildo 20 cm           ~520     994 – 1.242 TL  ~2,0
  S-Hande Chomper RCT             1350     2.156 – 2.695   ~1,6
  Satisfyer Penguin               1630     ~2.300 TL       ~1,4

Ucuz üründe oran yüksek, pahalıda düşük — kademeler bunu izler.

Çalıştırma (ağ erişimi gerekir; sonuç depoya işlenir, sunucuda çalışmaz):
  python3 scripts/toptanci-katalog.py
"""

from __future__ import annotations

import hashlib
import html
import io
import json
import math
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_JSON = ROOT / "src/db/katalog-toptanci.json"
IMG_DIR = ROOT / "public/images/urunler"
IMG_URL = "/images/urunler"
CACHE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / ".cache/toptanci"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36"
MAX_IMAGES = 3
IMG_WIDTH = 1000


# --------------------------------------------------------------------- ağ


def fetch(url: str, retries: int = 4) -> bytes:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(urllib.parse.quote(url, safe=":/%?=&"), headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except Exception:  # noqa: BLE001
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("unreachable")


def cached(name: str, url: str) -> bytes:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / name
    if not path.exists():
        path.write_bytes(fetch(url))
    return path.read_bytes()


# ------------------------------------------------------------------ metin


TR_MAP = str.maketrans("çğıöşüÇĞİÖŞÜâîû", "cgiosuCGIOSUaiu")


def slugify(value: str) -> str:
    """src/lib/utils.ts içindeki slugify ile aynı sonucu verir."""
    s = value.translate(TR_MAP).lower()
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:180].strip("-")


def clean(text: str) -> str:
    text = html.unescape(text).replace("\xa0", " ").replace("​", "")
    text = text.replace("’", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"[ \t]+", " ", text).strip()


def stable(value: str) -> int:
    return int(hashlib.md5(value.encode()).hexdigest()[:8], 16)


SUPPLIER_WORDS = re.compile(
    r"bayi|toptan|dropship|xml|stok kodu|çapraz satış|raf|vitrin|müşteriye|"
    r"satış noktası|perakende|kâr marj|kar marj|segment",
    re.I,
)


def parse_description(raw: str) -> dict:
    """WooCommerce açıklama HTML'ini bölümlere ayırır."""
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", raw, flags=re.S)
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"</t[dh]>", "\t", s)
    s = re.sub(r"<(h[1-6]|p|li|div|tr)[^>]*>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    lines = [clean(line) for line in s.split("\n")]
    lines = [line for line in lines if line and line != "\t"]

    sections: dict[str, list[str]] = {"giris": []}
    current = "giris"
    for line in lines:
        key = line.rstrip(":").strip().lower()
        if key.startswith("bayiler için") or key.startswith("bayiler icin"):
            current = "bayi"
            sections[current] = []
            continue
        if key in ("öne çıkan özellikler", "özellikler"):
            current = "ozellik"
            sections[current] = []
            continue
        if key == "teknik özellikler":
            current = "teknik"
            sections[current] = []
            continue
        if key in ("kullanım ve bakım", "kullanım", "bakım", "kullanım & bakım", "kullanım ve temizlik"):
            current = "bakim"
            sections[current] = []
            continue
        if key in ("kutu içeriği", "paket içeriği"):
            current = "kutu"
            sections[current] = []
            continue
        sections.setdefault(current, []).append(line)

    giris = sections.get("giris", [])
    # İlk satırlar: marka + stok kodu, başlık, özellik rozetleri. Gerçek
    # paragraflar uzun cümlelerdir; kısa olanları atlıyoruz.
    paragraphs = [p for p in giris if len(p) > 70 and not SUPPLIER_WORDS.search(p)]

    features: list[str] = []
    ozellik = sections.get("ozellik", [])
    i = 0
    while i < len(ozellik):
        title = ozellik[i]
        body = ozellik[i + 1] if i + 1 < len(ozellik) else ""
        if body and len(title) < 60 and len(body) >= len(title):
            features.append(f"{title.rstrip('.')}: {body}")
            i += 2
        else:
            features.append(title)
            i += 1
    features = [f for f in features if not SUPPLIER_WORDS.search(f)]

    specs: list[tuple[str, str]] = []
    teknik = sections.get("teknik", [])
    flat = []
    for line in teknik:
        flat.extend([c.strip() for c in line.split("\t") if c.strip()])
    for j in range(0, len(flat) - 1, 2):
        k, v = flat[j].rstrip(":"), flat[j + 1]
        if re.search(r"stok kodu|marka|barkod", k, re.I):
            continue
        specs.append((k, v))

    bakim = [
        line.lstrip("•·-– ").strip()
        for line in sections.get("bakim", [])
        if not SUPPLIER_WORDS.search(line)
    ]
    kutu = [line.lstrip("•·-– ").strip() for line in sections.get("kutu", [])]

    return {
        "paragraphs": paragraphs,
        "features": features,
        "specs": specs,
        "care": [b for b in bakim if b],
        "box": [k for k in kutu if k and not SUPPLIER_WORDS.search(k)],
    }


def brand_of(raw: str) -> str | None:
    m = re.search(r"background:#b84a62[^>]*>([^<]{2,40})</span>", raw)
    if m:
        name = clean(m.group(1))
        if name and not re.search(r"stok|kod|diğer", name, re.I):
            return name
    return None


# ----------------------------------------------------------------- renkler

COLORS = [
    "Ten Rengi", "Açık Ten", "Koyu Ten", "Kahverengi", "Siyah", "Beyaz", "Pembe",
    "Mor", "Kırmızı", "Mavi", "Lacivert", "Yeşil", "Turuncu", "Sarı", "Gri",
    "Şeffaf", "Gold", "Gümüş", "Rose", "Lila", "Bordo", "Kumral", "Fuşya", "Krem",
]


def color_of(name: str) -> str:
    low = name.lower()
    for color in COLORS:
        if re.search(rf"(^|\s){re.escape(color.lower())}($|\s|,|–|-)", low):
            return color
    return "Standart"


# ----------------------------------------------------------- kategoriler

# (ana kategori, alt kategori). İsimler var olan kataloğun isimleriyle
# aynı tutuldu; slug eşleşirse yükleyici mevcut kategoriyi kullanır.
SPECIFIC = {
    "Emişli (Vakumlu) Vibratörler": ("Kadın oyuncakları", "Emişli vibratörler"),
    "Rabbit Vibratör": ("Kadın oyuncakları", "Rabbit vibratörler"),
    "G Noktası Vibratörü": ("Kadın oyuncakları", "G noktası vibratörleri"),
    "Telefon Kontrollü Vibratör": ("Kadın oyuncakları", "Telefon kontrollü ürünler"),
    "Mini Vibratör": ("Kadın oyuncakları", "Mini vibratörler"),
    "Wand & Masaj Vibratörleri": ("Kadın oyuncakları", "Wand masaj vibratörleri"),
    "Giyilebilir Ürün": ("Kadın oyuncakları", "Giyilebilir vibratörler"),
    "Anal Vibratör": ("Anal ürünler", "Anal vibratörler"),
    "Metal & Taşlı Pluglar": ("Anal ürünler", "Metal ve taşlı pluglar"),
    "Silikon & Jelly Pluglar": ("Anal ürünler", "Silikon pluglar"),
    "Kuyruklu & Ponponlu Pluglar": ("Anal ürünler", "Kuyruklu pluglar"),
    "Anal Top": ("Anal ürünler", "Anal başlangıç"),
    "Anal Temizleyici": ("Hijyen", "Anal hijyen"),
    "Hareketli Dildo & Seks Makinası": ("Premium", "Seks makineleri"),
    "Belden Bağlamalı - Strapon": ("Dildolar", "Strapon"),
    "Çift Uçlu Dildolar": ("Dildolar", "Çift uçlu dildolar"),
    "Fantastik & Renkli Dildolar": ("Dildolar", "Fantastik dildolar"),
    "Realistik Dildo": ("Dildolar", "Realistik dildolar"),
    "Otomatik & Elektronik Mastürbatörler": ("Erkek oyuncakları", "Otomatik mastürbatörler"),
    "Realistik Vajinalar": ("Erkek oyuncakları", "Realistik vajinalar"),
    "Mastürbatörler": ("Erkek oyuncakları", "Mastürbatör"),
    "Penis Halkası": ("Erkek oyuncakları", "Penis halkaları"),
    "Penis Kılıfları": ("Erkek oyuncakları", "Penis kılıfları"),
    "Penis Pompası": ("Erkek oyuncakları", "Penis pompaları"),
    "Realistik Mankenler": ("Premium", "Realistik mankenler"),
    "Yarım Boy / Torso Mankenler": ("Premium", "Realistik mankenler"),
    "Şişme Kadınlar": ("Premium", "Şişme mankenler"),
    "Şişme ve Realistik Mankenler": ("Premium", "Şişme mankenler"),
    "Kayganlaştırıcı": ("Cinsel sağlık", "Kayganlaştırıcı jeller"),
    "Prezervatif": ("Cinsel sağlık", "Prezervatif"),
    "Penis Spreyi": ("Cinsel sağlık", "Geciktirici ürünler"),
    "Krem ve Takviye Edici Gıda": ("Cinsel sağlık", "Erkek bakım ürünleri"),
    "Vajina Bakım Ürünleri": ("Cinsel sağlık", "Kadın bakım ürünleri"),
    "Beyazlatıcı Kremler": ("Cinsel sağlık", "Kadın bakım ürünleri"),
    "Kadın Cinsel Sağlık Ürünü": ("Cinsel sağlık", "Kadın bakım ürünleri"),
    "Masaj Yağları": ("Çift ürünleri", "Masaj yağları"),
    "Erotik Oyunlar": ("Çift ürünleri", "Erotik oyunlar"),
    "Göğüs Ucu Bantları": ("İç giyim", "Göğüs ucu bantları"),
    "Fantezi Giyim": ("İç giyim", "Jartiyer ve kostüm"),
    "Fantezi & Fetiş": ("BDSM ve aksesuar", "Fantezi ve fetiş"),
    "Fantezi & Fetiş Ürünü": ("BDSM ve aksesuar", "Fantezi ve fetiş"),
}

# Genel kategorideki ürünler için ada bakarak karar verilir.
KEYWORD_RULES: list[tuple[str, tuple[str, str]]] = [
    (r"kayganlaştırıcı|lubricant|\bjel\b(?!.*vibratör)", ("Cinsel sağlık", "Kayganlaştırıcı jeller")),
    (r"prezervatif|kondom", ("Cinsel sağlık", "Prezervatif")),
    (r"masaj yağı", ("Çift ürünleri", "Masaj yağları")),
    (r"geciktirici|sprey", ("Cinsel sağlık", "Geciktirici ürünler")),
    (r"krem|kapsül|bakım", ("Cinsel sağlık", "Erkek bakım ürünleri")),
    (r"penis halka|halkası|cock ring", ("Erkek oyuncakları", "Penis halkaları")),
    (r"kılıf|uzatıcı", ("Erkek oyuncakları", "Penis kılıfları")),
    (r"pompa", ("Erkek oyuncakları", "Penis pompaları")),
    (r"kilit|kafes", ("BDSM ve aksesuar", "Fantezi ve fetiş")),
    (r"mastürbatör|vajina|stroker|kalça", ("Erkek oyuncakları", "Mastürbatör")),
    (r"strap|belden", ("Dildolar", "Strapon")),
    (r"plug|tıkaç|anal", ("Anal ürünler", "Anal başlangıç")),
    (r"dildo|penis", ("Dildolar", "Realistik dildolar")),
    (r"wand", ("Kadın oyuncakları", "Wand masaj vibratörleri")),
    (r"rabbit|tavşan", ("Kadın oyuncakları", "Rabbit vibratörler")),
    (r"emiş|vakum", ("Kadın oyuncakları", "Emişli vibratörler")),
    (r"mini|mermi|yumurta|ruj|parmak", ("Kadın oyuncakları", "Mini vibratörler")),
    (r"vibratör|uyarıcı|titreşimli", ("Kadın oyuncakları", "Vibratör")),
    (r"kelepçe|kırbaç|şaplak|tasma|maske|bağlama|ağız|fetiş", ("BDSM ve aksesuar", "Fantezi ve fetiş")),
    (r"zar|oyun", ("Çift ürünleri", "Erotik oyunlar")),
    (r"jartiyer|kostüm|babydoll|gecelik|takım|fantezi", ("İç giyim", "Jartiyer ve kostüm")),
    (r"kegel", ("Cinsel sağlık", "Kadın bakım ürünleri")),
]

CATEGORY_TEXT = {
    "Kadın oyuncakları": "Vibratör, emişli uyarıcı ve kadınlara yönelik oyuncaklar.",
    "Dildolar": "Realistik, fantastik ve çift uçlu dildolar, strapon setleri.",
    "Erkek oyuncakları": "Mastürbatör, penis halkası, kılıf ve pompalar.",
    "Anal ürünler": "Plug, anal vibratör ve başlangıç ürünleri.",
    "Cinsel sağlık": "Kayganlaştırıcı, prezervatif, geciktirici ve bakım ürünleri.",
    "Çift ürünleri": "Masaj yağları, erotik oyunlar ve çift oyuncakları.",
    "İç giyim": "Fantezi iç giyim, jartiyer takımları ve aksesuarlar.",
    "BDSM ve aksesuar": "Kelepçe, maske, kırbaç ve fantezi aksesuarları.",
    "Hijyen": "Oyuncak temizleyici ve kişisel hijyen ürünleri.",
    "Premium": "Seks makineleri ve realistik mankenler.",
}

SUB_TEXT = {
    "Emişli vibratörler": "Hava basıncıyla temassız uyarım sağlayan vibratörler.",
    "Rabbit vibratörler": "Hem iç hem dış uyarım için çift kollu vibratörler.",
    "G noktası vibratörleri": "Kavisli uçlu, G noktasına yönelik vibratörler.",
    "Mini vibratörler": "Küçük, sessiz ve kolay taşınan vibratörler.",
    "Wand masaj vibratörleri": "Güçlü motorlu wand ve masaj vibratörleri.",
    "Giyilebilir vibratörler": "Kumandalı, giyilebilir ve külot içi vibratörler.",
    "Vibratör": "Şarjlı ve pilli vibratör modelleri.",
    "Telefon kontrollü ürünler": "Uygulama ile uzaktan kontrol edilebilen ürünler.",
    "Anal vibratörler": "Titreşimli plug ve anal vibratörler.",
    "Metal ve taşlı pluglar": "Paslanmaz metal gövdeli, taş detaylı pluglar.",
    "Silikon pluglar": "Silikon ve jelly gövdeli anal pluglar.",
    "Kuyruklu pluglar": "Kuyruk ve ponpon detaylı fantezi pluglar.",
    "Anal başlangıç": "Anal top, boncuk ve başlangıç ürünleri.",
    "Anal hijyen": "Anal temizleme pompaları ve duşları.",
    "Seks makineleri": "Hareketli dildolar ve seks makineleri.",
    "Strapon": "Belden bağlamalı dildo ve harness setleri.",
    "Çift uçlu dildolar": "İki uçlu, esnek dildolar.",
    "Fantastik dildolar": "Renkli ve fantastik tasarımlı dildolar.",
    "Realistik dildolar": "Gerçekçi doku ve formda dildolar.",
    "Otomatik mastürbatörler": "Titreşimli, emişli ve hareketli mastürbatörler.",
    "Realistik vajinalar": "Gerçekçi dokulu suni vajina ve kalça mastürbatörler.",
    "Mastürbatör": "Cep tipi ve kupa mastürbatörler.",
    "Penis halkaları": "Titreşimli ve titreşimsiz penis halkaları.",
    "Penis kılıfları": "Uzatıcı ve dokulu penis kılıfları.",
    "Penis pompaları": "Manuel ve otomatik vakum pompaları.",
    "Realistik mankenler": "Tam boy ve yarım boy realistik mankenler.",
    "Şişme mankenler": "Şişme bebek ve mankenler.",
    "Kayganlaştırıcı jeller": "Su ve silikon bazlı kayganlaştırıcılar.",
    "Prezervatif": "Lateks ve lateks içermeyen prezervatifler.",
    "Geciktirici ürünler": "Geciktirici sprey ve kremler.",
    "Erkek bakım ürünleri": "Erkeklere yönelik bakım kremleri.",
    "Kadın bakım ürünleri": "Vajinal bakım, kegel ve kadın sağlığı ürünleri.",
    "Masaj yağları": "Aromalı erotik masaj yağları.",
    "Erotik oyunlar": "Zar, kart ve çiftler için oyunlar.",
    "Göğüs ucu bantları": "Kullan-at göğüs ucu kapatıcılar.",
    "Jartiyer ve kostüm": "Jartiyer takımları, kostüm ve fantezi giyim.",
    "Fantezi ve fetiş": "Kelepçe, maske, kırbaç ve bağlama setleri.",
}


# Adı açıkça belli eden ürünler, tedarikçinin geniş kategorisinden önce gelir.
OVERRIDES: list[tuple[str, tuple[str, str]]] = [
    (r"masaj (yağı|jeli)", ("Çift ürünleri", "Masaj yağları")),
    (r"prezervatif|kondom", ("Cinsel sağlık", "Prezervatif")),
    (r"kayganlaştırıcı", ("Cinsel sağlık", "Kayganlaştırıcı jeller")),
]


def categorize(cat_names: list[str], name: str) -> tuple[str, str]:
    for pattern, target in OVERRIDES:
        if re.search(pattern, name.lower()):
            return target
    for supplier_cat, target in SPECIFIC.items():
        if supplier_cat in cat_names:
            return target
    low = name.lower()
    for pattern, target in KEYWORD_RULES:
        if re.search(pattern, low):
            return target
    return ("Kadın oyuncakları", "Vibratör")


# ---------------------------------------------------------------- fiyat

TIERS = [  # (toptan üst sınır TL, çarpan)
    (100, 2.3),
    (300, 2.0),
    (800, 1.85),
    (2000, 1.65),
    (5000, 1.5),
    (20000, 1.4),
    (math.inf, 1.3),
]

PREMIUM_BRANDS = {"satisfyer", "lelo", "womanizer", "svakom", "we-vibe", "durex", "okamoto"}


def retail_kurus(wholesale_tl: float, sub: str, brand: str | None) -> int:
    mult = next(m for limit, m in TIERS if wholesale_tl <= limit)
    if sub == "Jartiyer ve kostüm":
        mult *= 0.85  # giyimde piyasa daha rekabetçi
    if brand and brand.lower() in PREMIUM_BRANDS:
        mult *= 0.9  # marka ürünlerde fiyatlar birbirine yakın
    return round_price(wholesale_tl * mult)


def round_price(tl: float) -> int:
    """Perakende görünümlü fiyat: 349,90 / 1.249,90 / 12.499,90"""
    if tl < 1000:
        step = 10
    elif tl < 10000:
        step = 50
    else:
        step = 500
    rounded = math.ceil(tl / step) * step
    return int(rounded * 100 - 10)


def compare_at(price: int, key: str) -> int | None:
    """Ürünlerin ~%30'unda üstü çizili liste fiyatı."""
    h = stable("indirim" + key)
    if h % 100 >= 30:
        return None
    pct = 15 + (h // 100) % 21  # %15 – %35
    return round_price(price / 100 * (1 + pct / 100))


# --------------------------------------------------------------- görseller


def pick_src(img: dict) -> str:
    srcset = img.get("srcset") or ""
    best = None
    for part in srcset.split(","):
        bits = part.strip().split(" ")
        if len(bits) == 2 and bits[1].endswith("w"):
            w = int(bits[1][:-1])
            # Hedef genişliğe en yakın ama ondan küçük olmayan boyut;
            # yoksa orijinal (src) kullanılır ve sonra küçültülür.
            if w >= IMG_WIDTH and (best is None or w < best[0]):
                best = (w, bits[0])
    return best[1] if best else img["src"]


def save_image(url: str, dest: Path) -> bool:
    if dest.exists():
        return True
    try:
        data = fetch(url)
        im = Image.open(io.BytesIO(data))
        im = im.convert("RGB")
        if im.width > IMG_WIDTH:
            im = im.resize((IMG_WIDTH, round(im.height * IMG_WIDTH / im.width)), Image.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        im.save(dest, "WEBP", quality=80, method=5)
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"  ! görsel alınamadı {url}: {exc}", file=sys.stderr)
        return False


# ------------------------------------------------------------- ürünler


def stock_for(key: str) -> int:
    return 4 + stable("stok" + key) % 37


def short_from(paragraphs: list[str], name: str) -> str:
    if paragraphs:
        first = re.split(r"(?<=[.!?])\s", paragraphs[0])[0]
        if 25 <= len(first) <= 170:
            return first
        return first[:150].rsplit(" ", 1)[0] + "…"
    return name


def weight_from(specs: list[tuple[str, str]]) -> int | None:
    for k, v in specs:
        if re.search(r"ağırlı", k, re.I):
            m = re.search(r"([\d.,]+)\s*(kg|g|gr)\b", v, re.I)
            if m:
                n = float(m.group(1).replace(".", "").replace(",", ".")) if m.group(2).lower() == "kg" and "," in m.group(1) else float(m.group(1).replace(",", "."))
                return int(n * 1000) if m.group(2).lower() == "kg" else int(n)
    return None


def from_shop() -> list[dict]:
    items: list[dict] = []
    for page in range(1, 20):
        data = json.loads(
            cached(
                f"shop-p{page}.json",
                f"https://toptanerotikshop.com/wp-json/wc/store/v1/products?per_page=100&page={page}",
            )
        )
        if not data:
            break
        items.extend(data)
    print(f"toptanerotikshop.com: {len(items)} ürün")

    out = []
    for position, it in enumerate(items):
        if not it.get("is_in_stock"):
            continue
        wholesale = int(it["prices"]["price"] or 0) / 100
        if wholesale <= 0 or not it.get("images"):
            continue
        name = clean(it["name"])
        cats = [clean(c["name"]) for c in it["categories"]]
        brand = brand_of(it["description"])
        parsed = parse_description(it["description"])
        root, sub = categorize(cats, name)

        sizes = []
        for attr in it.get("attributes", []):
            if attr.get("has_variations") and attr["name"].lower() in ("beden", "boyut", "ölçü"):
                order = {"xs": 0, "s": 1, "m": 2, "l": 3, "xl": 4, "xxl": 5}
                sizes = sorted(
                    [clean(t["name"]) for t in attr["terms"]],
                    key=lambda s: order.get(s.lower(), 9),
                )
        out.append(
            {
                "kaynak": "toptanerotikshop",
                "kaynakKodu": it.get("sku") or str(it["id"]),
                "sira": position,
                "ad": name,
                "marka": brand,
                "ana": root,
                "alt": sub,
                "toptan": wholesale,
                "parsed": parsed,
                "gorseller": [pick_src(img) for img in it["images"][:MAX_IMAGES]],
                "bedenler": sizes,
            }
        )
    return out


HPR_PRICE = [  # (ad deseni, perakende TL) — piyasa karşılaştırmasıyla
    (r"(?<!\d)40 ?ml", 129.9),
    (r"(?<!\d)55 ?ml", 149.9),
    (r"(?<!\d)85 ?ml", 249.9),
    (r"(?<!\d)120 ?ml", 199.9),
    (r"(?<!\d)155 ?ml", 229.9),
    (r"(?<!\d)200 ?ml.*masaj|masaj.*200 ?ml", 279.9),
    (r"(?<!\d)200 ?ml", 249.9),
    (r"(?<!\d)250 ?ml", 279.9),
    (r"masaj yağı", 229.9),
    (r"3'lü prezervatif", 89.9),
    (r"6'lı prezervatif", 149.9),
    (r"bakım (kremi|spreyi)", 249.9),
]


def from_showcase(shop_prices: dict[str, list[float]]) -> list[dict]:
    s = cached("showcase.html", "https://toptanerotik.com/toptan-sex-shop/").decode("utf-8", "ignore")
    tokens = re.finditer(
        r'<img[^>]+src="(https://toptanerotik\.com/wp-content/uploads/[^"]+)"'
        r"|<h[1-6][^>]*>(.*?)</h[1-6]>"
        r"|(Ürün Kodu:?\s*(?:<[^>]+>\s*)*[A-Z0-9-]+)",
        s,
        re.S,
    )
    out, img, name = [], None, None
    for m in tokens:
        if m.group(1):
            img, name = m.group(1), None
        elif m.group(2):
            name = clean(re.sub(r"<[^>]+>", "", m.group(2)))
        elif name and img and "logo" not in img:
            codes = re.findall(r"[A-Z0-9]+-[A-Z0-9-]+", re.sub(r"<[^>]+>", " ", m.group(3)))
            code = codes[-1] if codes else slugify(name)
            root, sub = categorize([], name)
            retail = None
            for pattern, tl in HPR_PRICE:
                if re.search(pattern, name, re.I):
                    retail = round_price(tl)
                    break
            if retail is None:
                # Benzer alt kategorideki ürünlerin toptan fiyatlarının alt-orta
                # dilimi: bu vitrin ürünleri giriş seviyesi, markasız modeller.
                prices = sorted(shop_prices.get(sub) or shop_prices.get(root) or [300.0])
                base = prices[int(len(prices) * 0.15)]
                retail = retail_kurus(base, sub, None)
            out.append(
                {
                    "kaynak": "toptanerotik",
                    "kaynakKodu": code,
                    "sira": 10000 + len(out),
                    "ad": name,
                    "marka": None,
                    "ana": root,
                    "alt": sub,
                    "toptan": None,
                    "perakende": retail,
                    "parsed": {"paragraphs": [], "features": [], "specs": [], "care": [], "box": []},
                    "gorseller": [img],
                    "bedenler": [],
                }
            )
            img, name = None, None
    print(f"toptanerotik.com: {len(out)} ürün")
    return out


GENERIC_INTRO = {
    "Kayganlaştırıcı jeller": "Su bazlı, kokusuz kayganlaştırıcı jel. Prezervatif ve oyuncaklarla birlikte kullanılabilir, suyla kolayca temizlenir.",
    "Prezervatif": "CE işaretli, elektronik olarak test edilmiş prezervatif. Her paket tek tek mühürlüdür.",
    "Masaj yağları": "Aromalı erotik masaj yağı. Cilde yumuşak bir kayganlık verir, çift masajları için uygundur.",
    "Erkek bakım ürünleri": "Erkekler için günlük bakım ürünü. Kullanmadan önce küçük bir bölgede deneyin.",
    "Geciktirici ürünler": "Erkekler için bakım spreyi. Kullanmadan önce küçük bir bölgede deneyin.",
}


def generic_description(product: dict) -> list[str]:
    sub = product["alt"]
    intro = GENERIC_INTRO.get(sub) or (
        f"{product['ad']}, {sub.lower()} kategorisinde giriş seviyesi, uygun fiyatlı bir model. "
        "Gövde yüzeyi pürüzsüzdür, kolayca temizlenir."
    )
    return [intro, "Ürün, içeriği belli olmayan düz kolide ve gizli paketle gönderilir."]


CARE_DEFAULT = (
    "Her kullanımdan önce ve sonra ılık su ve oyuncak temizleyici ile yıkayın, "
    "kurulayıp kendi kesesinde saklayın. Silikon gövdede yalnızca su bazlı "
    "kayganlaştırıcı kullanın."
)
CARE_LIQUID = (
    "Serin ve kuru yerde, doğrudan güneş ışığından uzakta saklayın. Çocukların "
    "ulaşamayacağı yerde tutun. Tahriş olursa kullanımı bırakın."
)
CARE_TEXTILE = (
    "30°C'de elde yıkayın. Çamaşır suyu kullanmayın, kurutma makinesine koymayın."
)


def finish(products: list[dict]) -> list[dict]:
    seen_skus: set[str] = set()

    def unique_sku(base: str) -> str:
        sku, n = base, 2
        while sku in seen_skus:
            sku, n = f"{base}-{n}", n + 1
        seen_skus.add(sku)
        return sku

    seen_slugs: set[str] = set()
    seen_names: set[str] = set()
    final = []
    for p in sorted(products, key=lambda x: x["sira"]):
        key_name = slugify(p["ad"])
        if key_name in seen_names:
            continue
        seen_names.add(key_name)
        slug = key_name
        n = 2
        while slug in seen_slugs:
            slug = f"{key_name}-{n}"
            n += 1
        seen_slugs.add(slug)

        parsed = p["parsed"]
        paragraphs = parsed["paragraphs"] or generic_description(p)
        description = list(paragraphs)
        if parsed["features"]:
            description.append("Öne çıkan özellikler")
            description.extend(f"• {f}" for f in parsed["features"][:8])
        if parsed["box"]:
            description.append("Kutu içeriği: " + ", ".join(parsed["box"][:8]) + ".")

        specs = [f"{k}: {v}" for k, v in parsed["specs"] if len(v) < 80]
        material = " · ".join(specs)[:245] or None

        if parsed["care"]:
            care = " ".join(c.rstrip(".") + "." for c in parsed["care"][:6])
        elif p["ana"] == "Cinsel sağlık" or p["alt"] == "Masaj yağları":
            care = CARE_LIQUID
        elif p["ana"] == "İç giyim":
            care = CARE_TEXTILE
        else:
            care = CARE_DEFAULT

        price = p.get("perakende") or retail_kurus(p["toptan"], p["alt"], p["marka"])
        renk = color_of(p["ad"])
        sizes = p["bedenler"] or ["Tek ebat"]

        sku_base = re.sub(r"[^A-Z0-9]+", "", p["kaynakKodu"].upper().replace("PT-", "").replace("HPR-", "H"))
        final.append(
            {
                "ad": p["ad"],
                "slug": slug,
                "sku": unique_sku(f"TN-{sku_base or stable(slug) % 100000}"[:36]),
                "kaynak": p["kaynak"],
                "kaynakKodu": p["kaynakKodu"],
                "marka": p["marka"],
                "ana": p["ana"],
                "alt": p["alt"],
                "fiyat": price,
                "eskiFiyat": compare_at(price, slug),
                "maliyet": int(p["toptan"] * 100) if p["toptan"] else int(price * 0.5),
                "kisaAciklama": short_from(paragraphs, p["ad"])[:250],
                "aciklama": "\n".join(description),
                "malzeme": material,
                "bakim": care,
                "agirlikGr": weight_from(parsed["specs"]) or 250,
                "renk": renk,
                "varyantlar": [{"olcu": s, "stok": stock_for(slug + s)} for s in sizes],
                "_kaynakGorseller": p["gorseller"],
                "_sira": p["sira"],
            }
        )
    return final


def main() -> None:
    shop = from_shop()
    shop_prices: dict[str, list[float]] = {}
    for p in shop:
        shop_prices.setdefault(p["alt"], []).append(p["toptan"])
        shop_prices.setdefault(p["ana"], []).append(p["toptan"])
    showcase = from_showcase(shop_prices)
    products = finish(shop + showcase)

    # Vitrin işaretleri
    by_order = sorted(products, key=lambda p: p["_sira"])
    for p in by_order[:36]:
        p["yeni"] = True
    mid = [p for p in products if 39990 <= p["fiyat"] <= 349990 and p["marka"]]
    mid.sort(key=lambda p: stable("cok" + p["slug"]))
    for p in mid[:16]:
        p["cokSatan"] = True
    feat = [p for p in products if 29990 <= p["fiyat"] <= 499990 and not p.get("cokSatan")]
    feat.sort(key=lambda p: stable("one" + p["slug"]))
    seen_sub: set[str] = set()
    for p in feat:
        if p["alt"] in seen_sub:
            continue
        seen_sub.add(p["alt"])
        p["oneCikan"] = True

    # Görseller
    jobs = []
    for p in products:
        p["gorseller"] = []
        for i, src in enumerate(p["_kaynakGorseller"], start=1):
            dest = IMG_DIR / f"{p['slug']}-{i}.webp"
            jobs.append((p, src, dest))
    print(f"{len(jobs)} görsel indiriliyor...")
    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(lambda j: save_image(j[1], j[2]), jobs))
    for (p, _src, dest), ok in zip(jobs, results):
        if ok:
            p["gorseller"].append(f"{IMG_URL}/{dest.name}")
    products = [p for p in products if p["gorseller"]]
    for p in products:
        del p["_kaynakGorseller"]
        del p["_sira"]

    OUT_JSON.write_text(json.dumps(products, ensure_ascii=False, indent=1) + "\n")
    print(f"✓ {len(products)} ürün → {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
