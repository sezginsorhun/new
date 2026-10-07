/**
 * YETİŞKİN ÜRÜNLERİ KATALOĞU — veri
 *
 * Bu dosya SADECE veridir; yazma işini `import-katalog.ts` yapar.
 *
 * ÜRÜN METİNLERİ HAKKINDA
 * Açıklamalar bilgilendirici ve sade tutuldu: malzeme, ölçü, kullanım ve
 * güvenlik bilgisi. Bu kategoride müşterinin satın alma kararını belirleyen
 * şey budur — gövde malzemesi, su geçirmezlik, şarj tipi, lateks içerip
 * içermediği. Eczane/ecza deposu tonu bilinçli bir tercih.
 *
 * FİYATLAR TEMSİLİDİR. Kuruş cinsinden girilir (29990 = 299,90 TL).
 * Yayına almadan önce panelden kendi alış/satış fiyatlarınla güncelle.
 *
 * VARYANTLAR
 * Şemada iki eksen var: `size` ve `colorName`. Bu kategoride:
 *   size      → hacim/adet/ölçü ("100 ml", "12'li", "Tek beden", "S/M")
 *   colorName → gerçek renk ya da "Standart"
 */

export type KatalogVaryant = {
  /** Hacim, adet ya da beden: "100 ml", "12'li", "Tek beden" */
  olcu: string;
  /** Renk adı; görsel paleti de bundan seçilir */
  renk: string;
  stok: number;
  /** Ürün fiyatından farklıysa, kuruş */
  fiyatFarki?: number;
};

export type KatalogUrun = {
  ad: string;
  /** Vitrinde kartın altında görünen tek cümle */
  kisaAciklama: string;
  aciklama: string;
  /** Kuruş. 29990 = 299,90 TL */
  fiyat: number;
  /** Üstü çizili eski fiyat, kuruş */
  eskiFiyat?: number;
  /** Malzeme / içerik bilgisi */
  malzeme?: string;
  /** Kullanım ve saklama notu */
  kullanim?: string;
  agirlikGr?: number;
  oneCikan?: boolean;
  yeni?: boolean;
  varyantlar: KatalogVaryant[];
};

export type KatalogAltKategori = {
  ad: string;
  aciklama: string;
  urunler: KatalogUrun[];
};

export type KatalogAnaKategori = {
  ad: string;
  aciklama: string;
  altlar: KatalogAltKategori[];
};

/* ========================================================================= */

export const KATALOG: KatalogAnaKategori[] = [
  {
    ad: "Cinsel sağlık",
    aciklama: "Kayganlaştırıcı, prezervatif ve geciktirici ürünler.",
    altlar: [
      {
        ad: "Kayganlaştırıcı jeller",
        aciklama: "Su ve silikon bazlı kayganlaştırıcılar.",
        urunler: [
          {
            ad: "Su Bazlı Kayganlaştırıcı Jel",
            kisaAciklama: "Prezervatif ve oyuncaklarla uyumlu, kolay temizlenir.",
            aciklama:
              "Su bazlı, kokusuz ve renksiz kayganlaştırıcı jel. Lateks prezervatiflerle ve silikon dâhil tüm oyuncak malzemeleriyle uyumludur. Suyla kolayca temizlenir, kumaşta iz bırakmaz.\n\nParaben ve gliserin içermez. Dermatolojik olarak test edilmiştir.",
            fiyat: 14990,
            eskiFiyat: 19990,
            malzeme: "Su bazlı. Paraben ve gliserin içermez.",
            kullanim:
              "Gerektiği kadar uygulayın. Serin ve kuru yerde, doğrudan güneş ışığından uzakta saklayın. Açıldıktan sonra 12 ay içinde tüketin. Tahriş olursa kullanımı bırakın.",
            agirlikGr: 120,
            oneCikan: true,
            varyantlar: [
              { olcu: "50 ml", renk: "Standart", stok: 60, fiyatFarki: 9990 },
              { olcu: "100 ml", renk: "Standart", stok: 85 },
              { olcu: "200 ml", renk: "Standart", stok: 40, fiyatFarki: 24990 },
            ],
          },
          {
            ad: "Silikon Bazlı Kayganlaştırıcı",
            kisaAciklama: "Uzun süre kalıcı, suda dağılmaz.",
            aciklama:
              "Silikon bazlı, yüksek kayganlık sağlayan ve uzun süre etkisini koruyan jel. Su içinde dağılmadığı için duş ve küvet kullanımına uygundur.\n\nÖNEMLİ: Silikon bazlı ürünler silikon oyuncakların yüzeyine zarar verebilir. Silikon oyuncaklarla su bazlı jel tercih edin. Lateks prezervatiflerle uyumludur.",
            fiyat: 22990,
            malzeme: "Silikon bazlı (dimetikon).",
            kullanim:
              "Az miktar yeterlidir. Temizlik için sabunlu su kullanın. Silikon yüzeyli ürünlerle birlikte kullanmayın.",
            agirlikGr: 110,
            varyantlar: [
              { olcu: "50 ml", renk: "Standart", stok: 45 },
              { olcu: "100 ml", renk: "Standart", stok: 30, fiyatFarki: 34990 },
            ],
          },
          {
            ad: "Aloe Veralı Hassas Cilt Jeli",
            kisaAciklama: "Hassas ciltler için katkısız formül.",
            aciklama:
              "Aloe vera özü içeren, pH dengeli su bazlı jel. Koku, renk ve tatlandırıcı içermez; hassas ciltler ve alerjik bünyeler düşünülerek hazırlanmıştır.\n\nLateks prezervatiflerle ve tüm oyuncak malzemeleriyle uyumludur.",
            fiyat: 17990,
            malzeme: "Su bazlı, %10 aloe vera özü. Paraben, koku ve renklendirici içermez.",
            kullanim: "Serin ve kuru yerde saklayın. Açıldıktan sonra 12 ay içinde tüketin.",
            agirlikGr: 120,
            yeni: true,
            varyantlar: [{ olcu: "100 ml", renk: "Standart", stok: 55 }],
          },
        ],
      },
      {
        ad: "Prezervatif",
        aciklama: "Lateks ve lateks içermeyen prezervatifler.",
        urunler: [
          {
            ad: "İnce Lateks Prezervatif",
            kisaAciklama: "0,05 mm ince duvar, CE sertifikalı.",
            aciklama:
              "Doğal lateksten üretilmiş, 0,05 mm duvar kalınlığında prezervatif. Elektronik olarak tek tek test edilir. Silikon bazlı kayganlaştırıcı ile kaplıdır.\n\nCE işaretli, ISO 4074 standardına uygundur. Son kullanma tarihi her paketin üzerinde yazılıdır.",
            fiyat: 12990,
            malzeme: "Doğal kauçuk lateks. Nominal genişlik 53 mm.",
            kullanim:
              "Ambalajı dikkatlice açın, tırnak ve takı ile delmeyin. Tek kullanımlıktır. Yağ bazlı ürünlerle kullanmayın — lateksi zayıflatır. Serin ve kuru yerde saklayın.",
            agirlikGr: 80,
            oneCikan: true,
            varyantlar: [
              { olcu: "12'li", renk: "Standart", stok: 120 },
              { olcu: "24'lü", renk: "Standart", stok: 70, fiyatFarki: 22990 },
            ],
          },
          {
            ad: "Lateks İçermeyen Prezervatif",
            kisaAciklama: "Lateks alerjisi olanlar için poliizopren.",
            aciklama:
              "Lateks alerjisi olan kullanıcılar için poliizopren malzemeden üretilmiştir. Lateksin esnekliğini korur, lateks proteini içermez.\n\nCE işaretli, tek tek test edilmiştir.",
            fiyat: 19990,
            malzeme: "Poliizopren. Lateks proteini içermez. Nominal genişlik 53 mm.",
            kullanim:
              "Tek kullanımlıktır. Yağ bazlı ürünlerle kullanmayın. Serin ve kuru yerde saklayın.",
            agirlikGr: 70,
            varyantlar: [{ olcu: "10'lu", renk: "Standart", stok: 50 }],
          },
          {
            ad: "Tırtıklı Yüzeyli Prezervatif",
            kisaAciklama: "Dokulu yüzey, bol kayganlaştırıcılı.",
            aciklama:
              "Yüzeyinde kabartma doku bulunan lateks prezervatif. Standart modele göre daha fazla kayganlaştırıcı ile kaplıdır.\n\nCE işaretli, ISO 4074 uyumlu.",
            fiyat: 14990,
            malzeme: "Doğal kauçuk lateks. Nominal genişlik 53 mm.",
            kullanim: "Tek kullanımlıktır. Yağ bazlı ürünlerle kullanmayın.",
            agirlikGr: 80,
            varyantlar: [{ olcu: "12'li", renk: "Standart", stok: 65 }],
          },
        ],
      },
      {
        ad: "Geciktirici ürünler",
        aciklama: "Geciktirici sprey, krem ve mendiller.",
        urunler: [
          {
            ad: "Geciktirici Sprey",
            kisaAciklama: "Lidokain içerir, 10 dakika önce uygulanır.",
            aciklama:
              "Yüzeysel uyuşturucu etkili lidokain içeren sprey. Hassasiyeti geçici olarak azaltır.\n\nSAĞLIK UYARISI: İlk kullanımdan önce kol içine az miktar uygulayarak alerji testi yapın. Lidokaine karşı bilinen alerjisi olanlar kullanmamalıdır. Gebelik ve emzirme döneminde hekime danışın. Göz ve mukoza ile temasından kaçının. Çocukların erişemeyeceği yerde saklayın.",
            fiyat: 24990,
            malzeme: "Lidokain %9,6 (w/w) içerir.",
            kullanim:
              "İlişkiden yaklaşık 10 dakika önce 3-5 püskürtme uygulayın, emilmesini bekleyin. Kalan ürünü yıkayın. Günde bir defadan fazla kullanmayın.",
            agirlikGr: 60,
            varyantlar: [{ olcu: "20 ml", renk: "Standart", stok: 40 }],
          },
          {
            ad: "Geciktirici Mendil",
            kisaAciklama: "Tek kullanımlık, taşıması kolay.",
            aciklama:
              "Benzokain emdirilmiş tek kullanımlık mendiller. Sprey ve kremlere göre daha kontrollü miktarda uygulama sağlar.\n\nSAĞLIK UYARISI: Benzokaine alerjisi olanlar kullanmamalıdır. İlk kullanımdan önce alerji testi yapın. Göz ve mukoza ile temasından kaçının.",
            fiyat: 17990,
            malzeme: "Benzokain içerir. Tek kullanımlık mendil.",
            kullanim:
              "Mendili açın, uygulayın ve 5 dakika bekleyin. Her mendil tek kullanımlıktır.",
            agirlikGr: 50,
            varyantlar: [{ olcu: "6'lı", renk: "Standart", stok: 55 }],
          },
        ],
      },
    ],
  },

  {
    ad: "Kadın oyuncakları",
    aciklama: "Vibratör ve uygulama kontrollü ürünler.",
    altlar: [
      {
        ad: "Vibratör",
        aciklama: "Şarjlı ve suya dayanıklı modeller.",
        urunler: [
          {
            ad: "Klasik Şarjlı Vibratör",
            kisaAciklama: "10 titreşim modu, USB şarjlı, suya dayanıklı.",
            aciklama:
              "Vücuda uygun silikon kaplamalı gövde, 10 farklı titreşim modu. USB ile şarj olur, tam şarjda yaklaşık 90 dakika kullanım sağlar.\n\nIPX7 suya dayanıklıdır; akan su altında yıkanabilir. Sessiz motor (50 dB altı).",
            fiyat: 79990,
            eskiFiyat: 99990,
            malzeme: "Vücuda uygun (body-safe) silikon ve ABS. Ftalat içermez.",
            kullanim:
              "Her kullanımdan önce ve sonra ılık su ve antibakteriyel temizleyici ile yıkayın. Yalnızca su bazlı kayganlaştırıcı kullanın — silikon bazlı ürünler yüzeye zarar verir. Kuru ve tozsuz ortamda saklayın.",
            agirlikGr: 180,
            oneCikan: true,
            varyantlar: [
              { olcu: "Tek beden", renk: "Pudra", stok: 25 },
              { olcu: "Tek beden", renk: "Siyah", stok: 30 },
              { olcu: "Tek beden", renk: "Mavi", stok: 18 },
            ],
          },
          {
            ad: "Hava Basınçlı Uyarıcı",
            kisaAciklama: "Temassız hava dalgası teknolojisi, 11 kademe.",
            aciklama:
              "Temas yerine hava basıncı dalgalarıyla çalışan uyarıcı. 11 yoğunluk kademesi, sessiz motor.\n\nUSB manyetik şarj, tam şarjda yaklaşık 60 dakika kullanım. IPX7 suya dayanıklıdır.",
            fiyat: 129990,
            malzeme: "Vücuda uygun silikon başlık, ABS gövde.",
            kullanim:
              "Başlığı her kullanımdan sonra ılık su ile temizleyin. Su bazlı kayganlaştırıcı kullanın.",
            agirlikGr: 160,
            yeni: true,
            varyantlar: [
              { olcu: "Tek beden", renk: "Pudra", stok: 15 },
              { olcu: "Tek beden", renk: "Bordo", stok: 12 },
            ],
          },
          {
            ad: "Mini Vibratör",
            kisaAciklama: "Avuç içi boyutunda, seyahat kilidi var.",
            aciklama:
              "Küçük boyutlu, tek tuşla kontrol edilen vibratör. 5 titreşim modu. Çantada yanlışlıkla çalışmaması için seyahat kilidi bulunur.\n\nUSB şarjlı, IPX6 suya dayanıklı.",
            fiyat: 44990,
            malzeme: "Vücuda uygun silikon. Ftalat içermez.",
            kullanim: "Ilık su ve antibakteriyel temizleyici ile yıkayın. Su bazlı jel kullanın.",
            agirlikGr: 90,
            varyantlar: [
              { olcu: "Tek beden", renk: "Pudra", stok: 40 },
              { olcu: "Tek beden", renk: "Yeşil", stok: 22 },
            ],
          },
        ],
      },
      {
        ad: "Telefon kontrollü ürünler",
        aciklama: "Uygulama üzerinden kontrol edilen ürünler.",
        urunler: [
          {
            ad: "Uygulama Kontrollü Vibratör",
            kisaAciklama: "Bluetooth bağlantı, uzaktan kontrol.",
            aciklama:
              "Telefon uygulaması üzerinden kontrol edilen vibratör. Bluetooth ile yakın mesafede, internet üzerinden uzak mesafeden kullanılabilir.\n\nUygulama üzerinden kendi titreşim desenlerinizi oluşturabilirsiniz. USB manyetik şarj, IPX7 suya dayanıklı.\n\nGİZLİLİK NOTU: Uygulama bir hesap açmanızı ister. Üretici gizlilik politikasını kurulum öncesinde incelemenizi öneririz.",
            fiyat: 149990,
            malzeme: "Vücuda uygun silikon, ABS.",
            kullanim:
              "Ilık su ile temizleyin, şarj noktasını ıslatmayın. Su bazlı kayganlaştırıcı kullanın.",
            agirlikGr: 140,
            oneCikan: true,
            varyantlar: [
              { olcu: "Tek beden", renk: "Pudra", stok: 14 },
              { olcu: "Tek beden", renk: "Siyah", stok: 16 },
            ],
          },
          {
            ad: "Uzaktan Kumandalı Giyilebilir Ürün",
            kisaAciklama: "Kumanda ve uygulama ile çift kontrol.",
            aciklama:
              "Hem kablosuz kumanda hem telefon uygulaması ile kontrol edilebilen giyilebilir ürün. 9 titreşim modu.\n\nUSB şarjlı, IPX6 suya dayanıklı. Kumanda menzili yaklaşık 10 metre.",
            fiyat: 109990,
            malzeme: "Vücuda uygun silikon.",
            kullanim: "Ilık su ile temizleyin. Su bazlı jel kullanın.",
            agirlikGr: 120,
            varyantlar: [{ olcu: "Tek beden", renk: "Pudra", stok: 20 }],
          },
        ],
      },
    ],
  },

  {
    ad: "Erkek oyuncakları",
    aciklama: "Mastürbatör ve bakım ürünleri.",
    altlar: [
      {
        ad: "Mastürbatör",
        aciklama: "Manuel ve otomatik modeller.",
        urunler: [
          {
            ad: "Kompakt Mastürbatör",
            kisaAciklama: "Yumuşak TPE iç yapı, kolay temizlenir.",
            aciklama:
              "Yumuşak TPE malzemeden üretilmiş iç yapı, sert dış kılıf. Kılıf sayesinde kolay tutulur ve saklanır.\n\nİç yapı çıkarılabilir; tamamen yıkanabilir ve kurutulabilir.",
            fiyat: 54990,
            malzeme: "TPE iç yapı, ABS dış kılıf. Ftalat içermez.",
            kullanim:
              "Her kullanımdan sonra ılık su ve özel temizleyici ile yıkayın, tamamen kurutun. Nemli saklamak malzemeyi bozar. Kurutulduktan sonra mısır nişastası ile pudralamak ömrünü uzatır. Yalnızca su bazlı kayganlaştırıcı kullanın.",
            agirlikGr: 320,
            varyantlar: [
              { olcu: "Tek beden", renk: "Krem", stok: 28 },
              { olcu: "Tek beden", renk: "Siyah", stok: 20 },
            ],
          },
          {
            ad: "Otomatik Emiş Mastürbatörü",
            kisaAciklama: "7 emiş modu, şarjlı, sessiz motor.",
            aciklama:
              "Motorlu emiş ve titreşim sağlayan model. 7 farklı mod, USB şarj ile yaklaşık 50 dakika kullanım.\n\nİç yapı çıkarılabilir ve yıkanabilir. Sessiz çalışma (55 dB altı).",
            fiyat: 139990,
            eskiFiyat: 169990,
            malzeme: "Vücuda uygun silikon iç yapı, ABS gövde.",
            kullanim:
              "İç yapıyı çıkarıp ılık su ile yıkayın, tamamen kurutun. Gövdeyi suya sokmayın, nemli bezle silin.",
            agirlikGr: 480,
            oneCikan: true,
            varyantlar: [{ olcu: "Tek beden", renk: "Siyah", stok: 12 }],
          },
          {
            ad: "Penis Halkası Seti",
            kisaAciklama: "Üç farklı ölçüde silikon halka.",
            aciklama:
              "Farklı çaplarda üç adet esnek silikon halkadan oluşan set. En geniş olandan başlayarak deneyin.\n\nGÜVENLİK UYARISI: 20 dakikadan uzun süre takılı bırakmayın. Uyuşma, renk değişimi veya ağrı olursa hemen çıkarın. Kan dolaşımı rahatsızlığı olanlar hekime danışmalıdır.",
            fiyat: 29990,
            malzeme: "Vücuda uygun silikon. Ftalat içermez.",
            kullanim:
              "Takmadan önce su bazlı kayganlaştırıcı uygulayın. Kullanım sonrası sabunlu su ile yıkayın.",
            agirlikGr: 60,
            varyantlar: [{ olcu: "3'lü set", renk: "Siyah", stok: 45 }],
          },
        ],
      },
    ],
  },

  {
    ad: "Çift ürünleri",
    aciklama: "Birlikte kullanım için tasarlanmış ürünler.",
    altlar: [
      {
        ad: "Çift oyuncakları",
        aciklama: "Çiftler için vibratör ve setler.",
        urunler: [
          {
            ad: "Çift Vibratörü",
            kisaAciklama: "Uygulama kontrollü, birlikte kullanım için.",
            aciklama:
              "Birlikte kullanım için tasarlanmış, esnek gövdeli çift vibratörü. İki ayrı motor bağımsız kontrol edilebilir.\n\nTelefon uygulaması ile uzaktan kontrol edilebilir. USB manyetik şarj, IPX7 suya dayanıklı.",
            fiyat: 169990,
            malzeme: "Vücuda uygun silikon. Ftalat içermez.",
            kullanim: "Ilık su ile temizleyin. Yalnızca su bazlı kayganlaştırıcı kullanın.",
            agirlikGr: 200,
            oneCikan: true,
            varyantlar: [
              { olcu: "Tek beden", renk: "Pudra", stok: 15 },
              { olcu: "Tek beden", renk: "Bordo", stok: 10 },
            ],
          },
          {
            ad: "Çift Titreşimli Halka",
            kisaAciklama: "Şarjlı, iki motorlu halka.",
            aciklama:
              "Esnek silikon halka üzerinde iki titreşim motoru. USB şarjlı, 10 mod.\n\nGÜVENLİK UYARISI: 20 dakikadan uzun süre takılı bırakmayın.",
            fiyat: 49990,
            malzeme: "Vücuda uygun silikon.",
            kullanim: "Kullanım öncesi su bazlı jel uygulayın. Sonrasında sabunlu su ile yıkayın.",
            agirlikGr: 70,
            varyantlar: [{ olcu: "Tek beden", renk: "Siyah", stok: 35 }],
          },
        ],
      },
    ],
  },

  {
    ad: "Anal ürünler",
    aciklama: "Başlangıç seviyesi ürünler ve setler.",
    altlar: [
      {
        ad: "Anal başlangıç",
        aciklama: "Küçük ölçülü, kademeli setler.",
        urunler: [
          {
            ad: "Kademeli Başlangıç Seti",
            kisaAciklama: "Üç farklı ölçü, geniş tabanlı güvenlik gövdesi.",
            aciklama:
              "Küçükten büyüğe üç parçadan oluşan silikon set. Her parçada geri alınabilmesi için geniş taban bulunur.\n\nGÜVENLİK: Geniş tabanlı olmayan ürünleri bu amaçla kullanmayın. Bol miktarda kayganlaştırıcı şarttır — bu bölge doğal kayganlık üretmez. Acı hissedilirse durun.",
            fiyat: 64990,
            malzeme: "Vücuda uygun silikon. Ftalat içermez.",
            kullanim:
              "Her kullanımdan önce ve sonra antibakteriyel temizleyici ile yıkayın. Su bazlı kayganlaştırıcıyı bol kullanın. Başka bir bölgeye geçmeden önce mutlaka yıkayın.",
            agirlikGr: 220,
            varyantlar: [
              { olcu: "3'lü set", renk: "Siyah", stok: 24 },
              { olcu: "3'lü set", renk: "Pudra", stok: 18 },
            ],
          },
          {
            ad: "Kalın Kıvamlı Kayganlaştırıcı",
            kisaAciklama: "Yoğun formül, uzun süre kalıcı.",
            aciklama:
              "Standart jellere göre daha yoğun kıvamlı, su bazlı kayganlaştırıcı. Daha uzun süre etkisini korur.\n\nLateks prezervatif ve silikon oyuncaklarla uyumludur.",
            fiyat: 19990,
            malzeme: "Su bazlı, yoğun kıvam. Paraben içermez.",
            kullanim: "Bol miktarda uygulayın. Serin ve kuru yerde saklayın.",
            agirlikGr: 130,
            varyantlar: [{ olcu: "100 ml", renk: "Standart", stok: 50 }],
          },
        ],
      },
    ],
  },

  {
    ad: "İç giyim",
    aciklama: "Gecelik, vücut çorabı, jartiyer ve kostümler.",
    altlar: [
      {
        ad: "Babydoll ve gecelik",
        aciklama: "Dantelli ve saten geceliker.",
        urunler: [
          {
            ad: "Dantel Detaylı Babydoll",
            kisaAciklama: "Ayarlanabilir askı, uyumlu külot dâhil.",
            aciklama:
              "Göğüs kısmı dantelli, bedeni şifon babydoll. Askılar ayarlanabilir. Takımda uyumlu külot bulunur.\n\nTürkiye'de üretilmiştir.",
            fiyat: 59990,
            eskiFiyat: 79990,
            malzeme: "%90 Polyester, %10 Elastan. Dantel: %100 Polyamid.",
            kullanim: "30°C'de elde veya file içinde yıkayın. Ütülemeyin, kuru temizleme yapmayın.",
            agirlikGr: 150,
            oneCikan: true,
            varyantlar: [
              { olcu: "S", renk: "Siyah", stok: 20 },
              { olcu: "M", renk: "Siyah", stok: 25 },
              { olcu: "L", renk: "Siyah", stok: 18 },
              { olcu: "S", renk: "Bordo", stok: 14 },
              { olcu: "M", renk: "Bordo", stok: 16 },
            ],
          },
          {
            ad: "Saten Gecelik",
            kisaAciklama: "Dökümlü saten, yanları yırtmaçlı.",
            aciklama:
              "Dökümlü saten kumaştan gecelik. V yaka, ince askı, yanlarda yırtmaç.\n\nTürkiye'de üretilmiştir.",
            fiyat: 69990,
            malzeme: "%95 Polyester, %5 Elastan.",
            kullanim: "30°C'de hassas programda yıkayın. Düşük ısıda ütüleyin.",
            agirlikGr: 180,
            varyantlar: [
              { olcu: "S", renk: "Bordo", stok: 15 },
              { olcu: "M", renk: "Bordo", stok: 20 },
              { olcu: "M", renk: "Siyah", stok: 22 },
              { olcu: "L", renk: "Siyah", stok: 12 },
            ],
          },
        ],
      },
      {
        ad: "Vücut çorabı",
        aciklama: "Tam boy ve açık model vücut çorapları.",
        urunler: [
          {
            ad: "Fileli Vücut Çorabı",
            kisaAciklama: "Esnek file örgü, tek beden (S-L).",
            aciklama:
              "Yüksek esnekliğe sahip file örgü vücut çorabı. Tek beden olarak S-L arası bedenlere uyar.\n\nTürkiye'de üretilmiştir.",
            fiyat: 39990,
            malzeme: "%92 Polyamid, %8 Elastan.",
            kullanim: "Elde, 30°C'de yıkayın. Ütülemeyin, kurutma makinesinde kurutmayın.",
            agirlikGr: 90,
            varyantlar: [
              { olcu: "S/M", renk: "Siyah", stok: 30 },
              { olcu: "L/XL", renk: "Siyah", stok: 24 },
            ],
          },
          {
            ad: "Desenli Vücut Çorabı",
            kisaAciklama: "Geometrik desen, dikişsiz gövde.",
            aciklama:
              "Geometrik desenli, dikişsiz örülmüş vücut çorabı. Vücudu sarar, iz bırakmaz.\n\nTürkiye'de üretilmiştir.",
            fiyat: 49990,
            malzeme: "%90 Polyamid, %10 Elastan.",
            kullanim: "Elde, 30°C'de yıkayın. Ütülemeyin.",
            agirlikGr: 95,
            yeni: true,
            varyantlar: [
              { olcu: "S/M", renk: "Siyah", stok: 18 },
              { olcu: "S/M", renk: "Bordo", stok: 12 },
            ],
          },
        ],
      },
      {
        ad: "Jartiyer ve kostüm",
        aciklama: "Jartiyer takımları ve kostümler.",
        urunler: [
          {
            ad: "Dantel Jartiyer Takımı",
            kisaAciklama: "Sütyen, külot, jartiyer kemeri ve çorap.",
            aciklama:
              "Dört parçadan oluşan dantel takım: sütyen, külot, jartiyer kemeri ve file çorap. Jartiyer kemeri arkadan ayarlanabilir.\n\nTürkiye'de üretilmiştir.",
            fiyat: 89990,
            eskiFiyat: 119990,
            malzeme: "%85 Polyamid, %15 Elastan. Dantel: %100 Polyamid.",
            kullanim: "Elde, 30°C'de yıkayın. Ütülemeyin, çamaşır suyu kullanmayın.",
            agirlikGr: 200,
            oneCikan: true,
            varyantlar: [
              { olcu: "S", renk: "Siyah", stok: 14 },
              { olcu: "M", renk: "Siyah", stok: 18 },
              { olcu: "L", renk: "Siyah", stok: 10 },
              { olcu: "M", renk: "Bordo", stok: 12 },
            ],
          },
          {
            ad: "Jartiyer Kemeri",
            kisaAciklama: "Ayrı satılan, dört askılı kemer.",
            aciklama:
              "Dört askılı, arkadan ayarlanabilir jartiyer kemeri. Mevcut takımlarınızla birlikte kullanılabilir.\n\nTürkiye'de üretilmiştir.",
            fiyat: 34990,
            malzeme: "%88 Polyamid, %12 Elastan.",
            kullanim: "Elde yıkayın. Ütülemeyin.",
            agirlikGr: 70,
            varyantlar: [
              { olcu: "S/M", renk: "Siyah", stok: 26 },
              { olcu: "L/XL", renk: "Siyah", stok: 16 },
            ],
          },
        ],
      },
    ],
  },

  {
    ad: "BDSM ve aksesuar",
    aciklama: "Başlangıç seviyesi setler ve aksesuarlar.",
    altlar: [
      {
        ad: "Başlangıç setleri",
        aciklama: "İlk kez deneyenler için hazırlanmış setler.",
        urunler: [
          {
            ad: "Başlangıç Seti",
            kisaAciklama: "Göz bandı, bileklik ve tüy — yumuşak malzeme.",
            aciklama:
              "İlk kez deneyenler için hazırlanmış set: saten göz bandı, yumuşak astarlı bileklik çifti ve tüy.\n\nGÜVENLİK: Bileklikler hızlı çözülebilir tokalıdır. Kullanım öncesinde bir durdurma sözü belirleyin. Bağlı kişiyi asla yalnız bırakmayın. Uyuşma veya renk değişimi olursa hemen çözün.",
            fiyat: 59990,
            malzeme: "Saten, suni deri ve yumuşak astar.",
            kullanim: "Nemli bezle silin. Suya sokmayın. Kuru yerde saklayın.",
            agirlikGr: 250,
            oneCikan: true,
            varyantlar: [
              { olcu: "Tek beden", renk: "Siyah", stok: 22 },
              { olcu: "Tek beden", renk: "Bordo", stok: 14 },
            ],
          },
          {
            ad: "Saten Göz Bandı",
            kisaAciklama: "Ayarlanabilir lastik, yumuşak astar.",
            aciklama:
              "Yumuşak astarlı saten göz bandı. Arkadan ayarlanabilir lastik bant.",
            fiyat: 19990,
            malzeme: "Saten dış yüzey, yumuşak iç astar.",
            kullanim: "Elde yıkayın, gölgede kurutun.",
            agirlikGr: 40,
            varyantlar: [{ olcu: "Tek beden", renk: "Siyah", stok: 40 }],
          },
        ],
      },
    ],
  },

  {
    ad: "Hijyen",
    aciklama: "Ürün temizliği ve bakımı.",
    altlar: [
      {
        ad: "Oyuncak bakım",
        aciklama: "Temizleyici sprey, mendil ve saklama ürünleri.",
        urunler: [
          {
            ad: "Antibakteriyel Temizleyici Sprey",
            kisaAciklama: "Silikon ve TPE yüzeyler için, durulama gerektirmez.",
            aciklama:
              "Silikon, TPE, ABS ve cam yüzeyler için geliştirilmiş antibakteriyel temizleyici. Alkol içermez, malzemeyi kurutmaz.\n\nDurulama gerektirmez; püskürtüp bekletin ve temiz bezle silin.",
            fiyat: 16990,
            malzeme: "Alkolsüz antibakteriyel çözelti.",
            kullanim:
              "Her kullanımdan önce ve sonra uygulayın. Elektronik ürünlerde şarj noktasına püskürtmeyin.",
            agirlikGr: 120,
            oneCikan: true,
            varyantlar: [{ olcu: "100 ml", renk: "Standart", stok: 70 }],
          },
          {
            ad: "Temizleme Mendili",
            kisaAciklama: "Tek kullanımlık, seyahat için pratik.",
            aciklama:
              "Tek tek paketlenmiş antibakteriyel temizleme mendilleri. Seyahatte pratik kullanım sağlar.",
            fiyat: 9990,
            malzeme: "Alkolsüz antibakteriyel solüsyon emdirilmiş mendil.",
            kullanim: "Tek kullanımlıktır. Tuvalete atmayın.",
            agirlikGr: 60,
            varyantlar: [{ olcu: "20'li", renk: "Standart", stok: 80 }],
          },
          {
            ad: "Saklama Kesesi",
            kisaAciklama: "Nefes alan kadife kese, büzgü bağcıklı.",
            aciklama:
              "Ürünlerinizi tozdan koruyan, nefes alabilen kadife kese. Büzgü bağcıklı.\n\nSilikon ürünlerin birbirine temas etmeden saklanması malzeme ömrünü uzatır.",
            fiyat: 12990,
            malzeme: "Kadife dış yüzey, pamuk astar.",
            kullanim: "Ürünü tamamen kuruttuktan sonra kesede saklayın.",
            agirlikGr: 50,
            varyantlar: [
              { olcu: "Orta", renk: "Siyah", stok: 45 },
              { olcu: "Büyük", renk: "Bordo", stok: 30 },
            ],
          },
        ],
      },
    ],
  },

  {
    ad: "Premium",
    aciklama: "Üst segment ürünler.",
    altlar: [
      {
        ad: "Seks makineleri",
        aciklama: "Ayarlanabilir hız ve konumlu motorlu ürünler.",
        urunler: [
          {
            ad: "Ayarlanabilir Tabanlı Makine",
            kisaAciklama: "Kademeli hız, uzaktan kumanda, sessiz motor.",
            aciklama:
              "Açısı ve yüksekliği ayarlanabilir tabanlı motorlu ürün. Kademesiz hız ayarı ve kablosuz kumanda.\n\nSessiz motor (60 dB altı). Standart bağlantı ucu ile uyumlu ek parçalar kullanılabilir.\n\nGÜVENLİK: En düşük hızda başlayın. Kullanım sırasında acil durdurma tuşunu elinizin altında tutun.",
            fiyat: 599990,
            malzeme: "Metal gövde, vücuda uygun silikon ek parça.",
            kullanim:
              "Silikon parçaları ılık su ve antibakteriyel temizleyici ile yıkayın. Motor gövdesini suya sokmayın.",
            agirlikGr: 4200,
            oneCikan: true,
            varyantlar: [{ olcu: "Tek beden", renk: "Siyah", stok: 5 }],
          },
          {
            ad: "Kompakt Taşınabilir Makine",
            kisaAciklama: "Şarjlı, çantaya sığan boyut.",
            aciklama:
              "Taşınabilir boyutta, şarjlı motorlu ürün. Kademeli hız ayarı, tam şarjda yaklaşık 70 dakika kullanım.\n\nStandart bağlantı ucu ile uyumludur.",
            fiyat: 349990,
            eskiFiyat: 429990,
            malzeme: "ABS gövde, vücuda uygun silikon ek parça.",
            kullanim: "Silikon parçaları yıkayın, gövdeyi nemli bezle silin.",
            agirlikGr: 1800,
            yeni: true,
            varyantlar: [{ olcu: "Tek beden", renk: "Siyah", stok: 8 }],
          },
        ],
      },
    ],
  },
];
