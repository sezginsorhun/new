/**
 * NİLSER — site içeriği
 * Metinler ürün kataloğundan (NILSER_A4) alınmıştır. Telefon, adres veya
 * ürün metni değişecekse yalnızca bu dosyayı düzenleyip `npm run build`
 * çalıştırmanız yeterli.
 */

export const site = {
  name: "NİLSER Alüminyum",
  short: "NİLSER",
  url: "https://nilseraluminyum.com",
  description:
    "Antalya'da sineklik, plise perde, cam balkon ve duşakabin sistemleri. Yerinde ölçü, keşif ve proje bazlı uygulama.",
  email: "info@nilseraluminyum.com",
  address: "Altınkale Mah. 4218. Sokak No: 19",
  district: "Döşemealtı",
  city: "Antalya",
  legal: "NİLSER Emlak İnşaat Turizm Otomotiv Makina San. ve Tic. Ltd. Şti.",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Alt%C4%B1nkale+Mah.+4218.+Sokak+No%3A19+D%C3%B6%C5%9Femealt%C4%B1+Antalya",
  mapsEmbed:
    "https://www.google.com/maps?q=Alt%C4%B1nkale+Mah.+4218.+Sokak+19+D%C3%B6%C5%9Femealt%C4%B1+Antalya&output=embed",
  catalogPdf: "/assets/katalog/nilser-urun-katalogu.pdf",
  catalogPages: 28,
  // WhatsApp ve "Hemen ara" butonlarının kullandığı ana hat
  primaryPhone: { label: "0536 448 17 25", tel: "+905364481725", wa: "905364481725" },
  contacts: [
    { name: "Serdar Arıer", phone: "0536 448 17 25", tel: "+905364481725", email: "serdar@nilseraluminyum.com" },
    { name: "Ufuk Karcı", phone: "0537 605 95 27", tel: "+905376059527", email: "ufuk@nilseraluminyum.com" },
  ],
};

export const nav = [
  { href: "/sineklik/", label: "Sineklik" },
  { href: "/plise-perde/", label: "Plise perde" },
  { href: "/cam-balkon/", label: "Cam balkon" },
  { href: "/dusakabin/", label: "Duşakabin" },
  { href: "/katalog/", label: "Katalog" },
  { href: "/iletisim/", label: "İletişim" },
];

/* Ana sayfadaki koleksiyon dizini ve seçim rehberi */
export const collection = [
  {
    no: "01",
    slug: "sineklik",
    title: "Sineklik sistemleri",
    sub: "Plise, sürme, menteşeli ve stor",
    img: "sineklik-plise",
    need: "Havalandırma ve geçiş",
    check: "Doğrama, panjur ve açılma alanı",
    pitch:
      "Kapı ve pencere açıklıklarında tül; katlanarak, kayarak ya da sarılarak toplanır. Doğramanıza göre içten veya dıştan takılır.",
  },
  {
    no: "02",
    slug: "plise-perde",
    title: "Plise perde",
    sub: "Kumaş, ışık ve mahremiyet",
    img: "plise-gece-gunduz",
    need: "Işık ve mahremiyet",
    check: "Panel ölçüsü, kol ve toplama alanı",
    pitch:
      "Kumaş katlanarak hareketli profilin yanında toplanır. Gece-gündüz sistemiyle gün ışığını yumuşatır, gerektiğinde örter.",
  },
  {
    no: "03",
    slug: "cam-balkon",
    title: "Cam balkon",
    sub: "Katlanır, sürme, ısıcamlı, giyotin",
    img: "cam-balkon-katlanir",
    need: "Alanı kapatma ve açılma",
    check: "Eşik, panel parkı ve bağlantı yüzeyi",
    pitch:
      "Balkon, teras ve ticari açıklıklarda panel hareketi, geçiş alanı ve kullanım alışkanlıklarınız birlikte planlanır.",
  },
  {
    no: "04",
    slug: "dusakabin",
    title: "Duşakabin",
    sub: "10 model ve yerleşim rehberi",
    img: "dk-02",
    need: "Duş alanı ve giriş",
    check: "Duvar, zemin ve kapı hareketi",
    pitch:
      "Düz cephe, köşe, niş ve sabit panel seçenekleri. Cam görünümü, profil ve kapı hareketi banyonuzun yerleşimiyle seçilir.",
  },
];

export const steps = [
  { no: "01", title: "İhtiyaç", text: "Geçiş, havalandırma, ışık ve mahremiyet beklentinizi konuşalım." },
  { no: "02", title: "Yerinde kontrol", text: "Ölçü, doğrama, panjur, eşik ve bağlantı yüzeyini inceleyelim." },
  { no: "03", title: "Teklif", text: "Sistem, renk, cam, kumaş ve donanımı teklifte tanımlayalım." },
  { no: "04", title: "Uygulama", text: "Montaj sonrası hareket, kapanma ve kullanım noktalarını kontrol edelim." },
];

/* ---------------- Sineklik ---------------- */
export const sineklikTypes = [
  { title: "Plise", img: "sineklik-plise", text: "Tül katlanarak yana toplanır. Sık kullanılan geçişlerde değerlendirilir." },
  { title: "Sürme", img: "sineklik-surme", text: "Kanat ray üzerinde yana hareket eder. Kapı önündeki alan serbest kalır." },
  { title: "Sabit / menteşeli", img: "sineklik-menteseli", text: "Sabit tip havalandırma; menteşeli tip geçiş ve dışarıya erişim içindir." },
  { title: "Stor", img: "sineklik-stor", text: "Tül, kullanım sonunda kasete sarılır. Kılavuzların temiz tutulması gerekir." },
];

export const sineklikMaterials = [
  { title: "Plise ipi", img: "plise-ipi", text: "Tülün hareket ve gergi düzeninde görev alır." },
  { title: "Metal kuş gözü", img: "kus-gozu", text: "İp geçiş deliğindeki temas yüzeyini düzenler." },
  { title: "Tül sabitleme şeridi", img: "tul-seridi", text: "Tülün kenarını ilgili profil yuvasıyla birleştirir." },
  { title: "Mıknatıs", img: "miknatis", text: "Uyumlu karşılıklı kapanma detayını tamamlar." },
  { title: "Kıl fitil", img: "kil-fitil", text: "Birleşim boşluklarında fırça görevi görür." },
];

/* ---------------- Cam balkon ---------------- */
export const camBalkonSystems = [
  {
    key: "katlanir",
    title: "Katlanır",
    img: "cam-balkon-katlanir",
    text: "Paneller ray boyunca kaydırılıp toplama bölgesinde katlanır. Toplanma yönü; balkon biçimi, mobilya ve erişim ihtiyacıyla birlikte belirlenir.",
    note: "Toplanma yönü yerinde belirlenir.",
  },
  {
    key: "surme",
    title: "Sürme",
    img: "cam-balkon-surme",
    text: "Paneller yana hareket eder. Ray sayısı, eşik ve kanat park bölgesi açılabilecek alanı belirler.",
    note: "Ray sayısı açılabilir alanı belirler.",
  },
  {
    key: "isicamli",
    title: "Isıcamlı",
    img: "cam-balkon-isicamli",
    text: "İki cam arasında ara boşluk bulunan yalıtım camı üniteleri kullanılır. Profil, conta, birleşim ve montaj detayları birlikte değerlendirilir.",
    note: "Cam bileşimi proje bazında belirlenir.",
  },
  {
    key: "giyotin",
    title: "Motorlu giyotin",
    img: "cam-balkon-giyotin",
    text: "Paneller motorla dikey hareket eder. Motor, kumanda, taşıyıcı sistem ve panel ölçüleri birlikte projelendirilir.",
    note: "Kontrol donanımı ve bakım erişimi planlanır.",
  },
];

/* ---------------- Duşakabin ---------------- */
export const dkFilters = [
  { key: "hepsi", label: "Tümü" },
  { key: "duz", label: "Düz cephe" },
  { key: "kose", label: "Köşe" },
  { key: "nis", label: "Niş" },
  { key: "sabit", label: "Sabit panel" },
];

export const dkModels = [
  { no: "01", type: "duz", title: "Çizgili düz cephe", text: "Siyah profil ve çizgili cam görünümü.", plan: "Düz duvar hattı ve ön cepheden erişim." },
  { no: "02", type: "kose", title: "Çizgili köşe", text: "İki yüzeyli, tanımlı bir duş alanı.", plan: "Kapı açılımı ve yaklaşma mesafesi." },
  { no: "03", type: "duz", title: "Üst raylı çizgili", text: "Üst ray ile güçlü bir yatay vurgu.", plan: "Ray, bağlantı ve kapı hareketi." },
  { no: "04", type: "nis", title: "Çizgili niş", text: "İki duvar arasında tamamlanan cephe.", plan: "Duvar düşeyliği ve açıklık ölçüsü." },
  { no: "05", type: "duz", title: "Koyu çerçeveli", text: "Şeffaf camı vurgulayan koyu profiller.", plan: "Armatür ve metal detaylarla renk uyumu." },
  { no: "06", type: "kose", title: "Parlak profilli köşe", text: "Işığı yansıtan tamamlayıcı detaylar.", plan: "Profil tonu ve günlük temizlik." },
  { no: "07", type: "kose", title: "Siyah menteşeli köşe", text: "Görünür menteşe, yalın hareket.", plan: "Açılma yönü ve serbest kullanım alanı." },
  { no: "08", type: "sabit", title: "Şeffaf cam bölme", text: "Banyonun görünümünü devam ettirir.", plan: "Giriş açıklığı ve suyun sıçrama yönü." },
  { no: "09", type: "sabit", title: "Minimal sabit panel", text: "Daha az çizgi, daha açık bir görünüm.", plan: "Duş başlığı, panel boyutu ve zemin eğimi." },
  { no: "10", type: "kose", title: "Füme köşe", text: "Füme cam ve koyu profilde bütünlük.", plan: "Banyo ışığı, seramik tonu ve mahremiyet." },
];

/* Teklif formundaki ürün seçenekleri */
export const quoteProducts = [
  { key: "sineklik", label: "Sineklik", types: ["Plise", "Sürme", "Sabit / menteşeli", "Stor", "Emin değilim"] },
  { key: "plise-perde", label: "Plise perde", types: ["Tül", "Gece-gündüz", "Emin değilim"] },
  { key: "cam-balkon", label: "Cam balkon", types: ["Katlanır", "Sürme", "Isıcamlı", "Motorlu giyotin", "Emin değilim"] },
  { key: "dusakabin", label: "Duşakabin", types: ["Düz cephe", "Köşe", "Niş", "Sabit panel", "Emin değilim"] },
];
