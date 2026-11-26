/**
 * KURUMSAL VE YASAL SAYFALAR — hazır metinler
 *
 * Veritabanında bu adreste bir sayfa YOKSA ya da sayfa hâlâ kurulumdaki
 * örnek metni taşıyorsa (bkz. isPlaceholderContent) buradaki metin
 * gösterilir. Panelden kendi metnini kaydettiğin anda o geçerli olur.
 *
 * {{...}} alanları Ayarlar → Satıcı Bilgileri ve İletişim bölümünden
 * doldurulur; boş bırakılan bilgi metinde hiç geçmez.
 *
 * Dayanak: 6502 sayılı Tüketicinin Korunması Hakkında Kanun, Mesafeli
 * Sözleşmeler Yönetmeliği (RG 27.11.2014/29188), 6563 sayılı Elektronik
 * Ticaretin Düzenlenmesi Hakkında Kanun, 6698 sayılı KVKK.
 * Bu metinler genel bir çerçevedir; yayına almadan önce kendi işletmen için
 * bir hukukçuya kontrol ettirmen önerilir.
 *
 * Biçim: "## " başlık, "- " madde, boş satır paragraf ayırır.
 */

import { companyBlock, companyInfo } from "@/lib/company";
import { formatPrice } from "@/lib/money";

export type LegalPage = { title: string; body: string };

/** Metinlerin en son gözden geçirildiği tarih — "Son güncelleme" satırı */
export const LEGAL_UPDATED_AT = new Date("2026-11-26T00:00:00Z");

const PAGES: Record<string, LegalPage> = {
  "mesafeli-satis": {
    title: "Mesafeli Satış Sözleşmesi",
    body: `## Madde 1 — Taraflar
Bu sözleşme, aşağıda bilgileri yer alan SATICI ile {{SITE}} üzerinden sipariş veren ALICI arasında, ALICI'nın siparişi elektronik ortamda onaylamasıyla kurulmuştur.

## Satıcı bilgileri
{{SATICI_BILGILERI}}

## Alıcı bilgileri
Alıcı; sipariş sırasında beyan ettiği ad-soyad, teslimat ve fatura adresi, telefon ve e-posta bilgileriyle tanımlanan kişidir. Bu bilgiler sipariş özetinde ve ALICI'ya gönderilen sipariş onay e-postasında yer alır.

## Madde 2 — Konu
Sözleşmenin konusu, ALICI'nın {{SITE}} üzerinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürünün satışı ve teslimidir. Taraflar, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine tabidir.

## Madde 3 — Ürün, fiyat ve ödeme
- Ürünün türü, adedi, rengi/ölçüsü, KDV dahil satış fiyatı ve kargo bedeli sipariş özetinde ve ödeme sayfasında gösterilir.
- Sitedeki fiyatlar KDV dahildir. Kargo bedeli sipariş tutarına göre ödeme sayfasında ayrıca belirtilir; {{UCRETSIZ_KARGO}}
- Ödeme; sitede o an açık olan yöntemlerle (kredi/banka kartı, havale/EFT veya kapıda ödeme) yapılır. Kartla ödemede kart bilgileri SATICI tarafından görülmez ve saklanmaz; doğrudan lisanslı ödeme kuruluşuna iletilir.
- Taksitli ödemelerde vade farkı, kartı veren bankanın koşullarına göre uygulanır.

## Madde 4 — Teslimat
- Ürün, ALICI'nın sipariş sırasında belirttiği teslimat adresine kargo ile gönderilir. Teslimat, siparişin onaylanmasından itibaren yasal üst sınır olan 30 gün içinde yapılır; ürünler genellikle 1–3 iş günü içinde kargoya verilir.
- Tüm gönderiler, içeriği belli olmayan düz kolide ve gönderici kısmında ürün içeriğini belirtmeyen bir ifadeyle paketlenir. Kargo fişinde ürün adı yazmaz.
- Teslimat sırasında paketin hasarlı olduğu görülürse ALICI, kargo görevlisine tutanak tutturarak paketi teslim almamalıdır.
- Ürün, ALICI'dan başka birine teslim edilecekse SATICI, bu kişinin teslimi kabul etmemesinden sorumlu tutulamaz.

## Madde 5 — Cayma hakkı
- ALICI, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayabilir.
- Cayma bildirimi; {{ILETISIM}} yoluyla, sipariş numarası belirtilerek SATICI'ya yapılır.
- Cayma hakkı kullanılan ürün, bildirimden itibaren 10 gün içinde SATICI'ya geri gönderilir. SATICI, ürünün kendisine ulaşmasından ve cayma şartlarının sağlandığının görülmesinden sonra en geç 14 gün içinde ödemeyi, ödemenin yapıldığı yöntemle iade eder.

## Madde 6 — Cayma hakkının kullanılamayacağı durumlar
Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca; tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan ve iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde cayma hakkı kullanılamaz. Sitedeki cinsel sağlık ürünleri, vücutla doğrudan temas eden oyuncaklar, kayganlaştırıcılar, prezervatifler ve iç giyim ürünleri bu kapsamdadır. Bu ürünlerde cayma hakkı, ambalajı açılmamış ve koruyucu bandı/mührü bozulmamış olmak koşuluyla kullanılabilir.

## Madde 7 — Ayıplı ürün
Ürün ayıplı (kusurlu, hasarlı, eksik ya da siparişten farklı) çıkarsa ALICI, 6502 sayılı Kanun'un 11. maddesindeki seçimlik haklarını (sözleşmeden dönme, bedel indirimi, ücretsiz onarım veya ayıpsız misliyle değiştirme) kullanabilir. Ayıplı ürünün iade kargo bedeli SATICI'ya aittir. Ambalaj açılmış olsa da ayıplı ürün için bu haklar geçerlidir.

## Madde 8 — Yaş sınırı
Sitedeki ürünler yalnızca 18 yaşını doldurmuş kişilere satılır. ALICI, sipariş vererek 18 yaşından büyük olduğunu beyan eder.

## Madde 9 — Uyuşmazlıklar
Uyuşmazlıklarda, Ticaret Bakanlığı'nca her yıl ilan edilen parasal sınırlar dahilinde ALICI'nın yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetleri, bu sınırları aşan durumlarda Tüketici Mahkemeleri yetkilidir.

## Madde 10 — Yürürlük
ALICI, ödeme sayfasında bu sözleşmeyi ve Ön Bilgilendirme Formu'nu okuyup onayladığında sözleşme kurulmuş olur. Sözleşmenin bir kopyası sipariş onay e-postasıyla ALICI'ya iletilir ve SATICI tarafından saklanır.`,
  },

  "on-bilgilendirme": {
    title: "Ön Bilgilendirme Formu",
    body: `Bu form, Mesafeli Sözleşmeler Yönetmeliği'nin 5. maddesi uyarınca sözleşme kurulmadan önce ALICI'yı bilgilendirmek amacıyla hazırlanmıştır.

## Satıcı
{{SATICI_BILGILERI}}

## Ürünün temel nitelikleri ve fiyatı
Siparişe konu ürünün adı, adedi, varyantı (renk, ölçü vb.), KDV dahil birim ve toplam fiyatı ile kargo bedeli ödeme sayfasındaki sipariş özetinde gösterilir. Gösterilen fiyatlar, sipariş tamamlanana kadar geçerlidir.

## Ödeme ve teslimat
- Ödeme yöntemleri: sitede o an açık olan kredi/banka kartı, havale/EFT ve kapıda ödeme seçenekleri.
- Teslimat: ALICI'nın belirttiği adrese kargo ile, siparişten itibaren en geç 30 gün içinde. Ürünler genellikle 1–3 iş günü içinde kargoya verilir.
- Paketleme: İçeriği belli olmayan düz koli, ürün adı yazmayan kargo fişi.
- {{UCRETSIZ_KARGO}}

## Cayma hakkı
ALICI, teslimden itibaren 14 gün içinde cayma hakkına sahiptir. Ancak ambalajı, bandı veya mührü açılmış olan ve sağlık/hijyen açısından iadesi uygun olmayan ürünlerde (cinsel sağlık ürünleri, vücutla temas eden oyuncaklar, kayganlaştırıcı, prezervatif, iç giyim) cayma hakkı kullanılamaz. Ayrıntılar: İade ve Değişim sayfası.

## Şikâyet ve itiraz
Talep ve şikâyetler {{ILETISIM}} yoluyla iletilebilir. Uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.`,
  },

  "iade-degisim": {
    title: "İade ve Değişim Koşulları",
    body: `## Kısaca
- Ambalajı açılmamış ürünü, teslimden itibaren 14 gün içinde gerekçe göstermeden iade edebilirsin.
- Hijyen gereği, ambalajı ya da koruyucu bandı açılmış cinsel sağlık ürünleri ve vücutla temas eden ürünler iade alınamaz.
- Kusurlu, hasarlı ya da yanlış gönderilen ürünlerde ambalaj açılmış olsa bile değişim veya iade yapılır; kargo ücreti bizdendir.

## İade alınabilen ürünler
Koruyucu ambalajı, bandı veya mührü açılmamış; kullanılmamış, eksiksiz ve yeniden satılabilir durumdaki ürünler. Bu durumda cayma hakkı 6502 sayılı Kanun kapsamında tam olarak geçerlidir.

## İade alınamayan ürünler
Mesafeli Sözleşmeler Yönetmeliği'nin 15/1-c maddesi uyarınca, ambalajı açılmış olup iadesi sağlık ve hijyen açısından uygun olmayan ürünler:
- Vibratör, dildo, plug, mastürbatör ve benzeri vücutla doğrudan temas eden ürünler
- Kayganlaştırıcı, masaj yağı, sprey ve krem gibi açılmış sıvı ürünler
- Prezervatif
- İç giyim ve fantezi giyim (hijyen bandı çıkarılmışsa)

## Kusurlu veya yanlış ürün
Ürün çalışmıyor, hasarlı, eksik ya da siparişinden farklıysa; teslimden sonra en kısa sürede fotoğraf/video ile birlikte bize ulaş. Ürünü inceleyip değişim, onarım, bedel indirimi veya ücret iadesi seçeneklerinden tercih ettiğini uygularız. Bu durumda gönderim ücreti tamamen bize aittir.

## İade nasıl yapılır?
- {{ILETISIM}} yoluyla sipariş numaranı belirterek iade talebini ilet.
- Sana bildirdiğimiz anlaşmalı kargo koduyla ürünü, orijinal ambalajı ve faturasıyla birlikte gönder.
- Ürün bize ulaşıp kontrol edildikten sonra en geç 14 gün içinde ödemen, yaptığın ödeme yöntemiyle iade edilir. Kartla yapılan ödemelerde tutarın hesabına yansıma süresi bankana bağlıdır.

## Gizlilik
İade gönderilerinde de ürün adı geçmesine gerek yoktur; kargo fişinde yalnızca sipariş numaranı yazman yeterlidir.`,
  },

  "kargo-teslimat": {
    title: "Kargo ve Teslimat",
    body: `## Gizli paketleme
Tüm siparişler içeriği belli olmayan, logosuz düz kolide gönderilir. Kargo fişinde ürün adı ya da mağaza içeriğini belli eden bir ifade yer almaz. Faturan paketin içinde, kapalı zarfta bulunur.

## Gönderim süresi
- Hafta içi saat 15:00'e kadar verilen siparişler genellikle aynı gün, en geç 1–3 iş günü içinde kargoya verilir.
- Kargoya verilen siparişlerin teslimatı bulunduğun bölgeye göre genellikle 1–3 iş günü sürer.
- Yasal teslim süresi, sipariş tarihinden itibaren en fazla 30 gündür.

## Kargo ücreti
- {{UCRETSIZ_KARGO}}
- Kapıda ödeme seçeneğinde ek hizmet bedeli ödeme sayfasında ayrıca gösterilir.

## Takip
Siparişin kargoya verildiğinde takip numarası e-posta adresine gönderilir. Siparişlerini Hesabım → Siparişlerim bölümünden de izleyebilirsin.

## Teslim alırken
Paket hasarlı görünüyorsa kargo görevlisine tutanak tutturarak teslim almamanı öneririz. Tutanaklı iadelerde ürün yeniden gönderilir.`,
  },

  "gizlilik-politikasi": {
    title: "KVKK Aydınlatma Metni ve Gizlilik Politikası",
    body: `Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 10. maddesi uyarınca, veri sorumlusu sıfatıyla aşağıda bilgileri yer alan işletme tarafından hazırlanmıştır.

## Veri sorumlusu
{{SATICI_BILGILERI}}

## İşlenen kişisel veriler
- Kimlik ve iletişim: ad-soyad, e-posta, telefon
- Teslimat ve fatura: adres; kurumsal faturada unvan, vergi dairesi ve numarası
- Müşteri işlem: sipariş geçmişi, sepet ve favoriler, iade talepleri
- İşlem güvenliği: IP adresi, tarayıcı bilgisi, giriş kayıtları
- Kart bilgileri sitemizde işlenmez ve saklanmaz; ödeme, lisanslı ödeme kuruluşunun altyapısında 3D Secure ile gerçekleşir.

## İşleme amaçları ve hukuki sebepler
- Siparişin alınması, ödemenin tahsili, teslimat ve iade süreçleri — sözleşmenin kurulması ve ifası (KVKK m.5/2-c)
- Fatura düzenlenmesi ve yasal saklama yükümlülükleri — kanuni yükümlülük (m.5/2-ç)
- Hesap güvenliği, dolandırıcılığın önlenmesi — meşru menfaat (m.5/2-f)
- Kampanya ve bülten gönderimi — yalnızca açık rızan varsa (m.5/1); dilediğin an vazgeçebilirsin.

## Aktarım
Kişisel verilerin yalnızca bu amaçlarla sınırlı olarak; kargo firmalarına (teslimat için), ödeme kuruluşuna (tahsilat için), muhasebe/e-fatura hizmet sağlayıcısına ve talep hâlinde yetkili kamu kurumlarına aktarılır. Verilerin pazarlama amacıyla üçüncü kişilere satılmaz veya kiralanmaz.

## Gizlilik
Sipariş içeriğin hiçbir zaman kargo etiketinde, banka ekstresinde ürün adı olarak ya da üçüncü kişilerle paylaşılan herhangi bir belgede yer almaz.

## Saklama süresi
Sipariş ve fatura kayıtları ilgili mevzuatın öngördüğü süre boyunca (Vergi Usul Kanunu ve Türk Ticaret Kanunu uyarınca 10 yıl), diğer veriler işleme amacının gerektirdiği süre boyunca saklanır ve sürenin sonunda silinir, yok edilir veya anonimleştirilir.

## Haklarınız
KVKK m.11 uyarınca; verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı kişileri bilme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsin. Başvurularını {{ILETISIM}} yoluyla iletebilirsin; en geç 30 gün içinde ücretsiz olarak yanıtlanır.

## Çerezler
Sitenin çalışması için zorunlu çerezler (oturum, sepet, güvenlik) kullanılır. Ölçümleme ve pazarlama çerezleri yalnızca onay verirsen etkinleşir; tercihini sayfanın altındaki "Çerez tercihleri" bağlantısından değiştirebilirsin.`,
  },

  "kullanim-kosullari": {
    title: "Üyelik ve Kullanım Koşulları",
    body: `## Yaş sınırı
{{SITE}} yalnızca 18 yaşını doldurmuş kişilerin kullanımına yöneliktir. Siteye girerek ve üye olarak 18 yaşından büyük olduğunu beyan edersin.

## Üyelik
- Üyelik ücretsizdir. Verdiğin bilgilerin doğru ve güncel olmasından sen sorumlusun.
- Şifreni kimseyle paylaşma. Hesabında yetkisiz bir işlem fark edersen şifreni hemen değiştir ve bize bildir.
- Kurallara aykırı kullanım, sahte sipariş veya kötüye kullanım tespit edilen hesaplar kapatılabilir.

## Fiyat ve stok
Sitedeki fiyatlar KDV dahildir. Açık bir yazım veya sistem hatasından kaynaklanan fiyatlarda, sipariş öncesinde ya da en kısa sürede bilgilendirilerek sipariş iptal edilebilir ve ödeme tam olarak iade edilir.

## Fikri haklar
Sitedeki tasarım, metin ve görsellerin izinsiz kopyalanması ve ticari amaçla kullanılması yasaktır.

## İletişim
Soruların için: {{ILETISIM}}.`,
  },

  hakkimizda: {
    title: "Hakkımızda",
    body: `{{SITE_ADI}}, cinsel sağlık ve yetişkin ürünlerini utanmadan, güvenle ve gizlilik içinde alabilmen için kurulmuş bir çevrim içi mağazadır.

## Neye önem veriyoruz?
- Orijinal ürün: Ürünlerimizi ithalatçı firmalardan faturalı olarak temin ediyoruz. Her ürün sayfasında malzeme, ölçü ve kullanım bilgisi yer alır.
- Gizlilik: Siparişlerin içeriği belli olmayan düz kolide, ürün adı yazmayan bir kargo fişiyle gönderilir. Sipariş bilgilerin üçüncü kişilerle paylaşılmaz.
- Doğru bilgi: Gövde malzemesi, su geçirmezlik, şarj tipi ve uyumlu kayganlaştırıcı gibi bilgileri açıkça yazıyoruz; karar vermeden önce sormak istediğin her şeyi bize iletebilirsin.

## Bize ulaş
{{ILETISIM}}

## Satıcı bilgileri
{{SATICI_BILGILERI}}`,
  },

  sss: {
    title: "Sık Sorulan Sorular",
    body: `## Paketin içeriği belli oluyor mu?
Hayır. Tüm siparişler logosuz, düz kolide gönderilir; kargo fişinde ürün adı ya da içeriği belli eden bir ifade yazmaz.

## Banka ekstremde ne yazıyor?
Ekstrede ürün adı yer almaz; işlem, satıcı unvanı veya ödeme kuruluşunun adıyla görünür.

## Ürünler orijinal mi?
Evet. Ürünlerimizi ithalatçı firmalardan faturalı olarak temin ediyoruz.

## Ne zaman kargoya verilir?
Hafta içi 15:00'e kadar verilen siparişler genellikle aynı gün, en geç 1–3 iş günü içinde kargoya verilir.

## İade edebilir miyim?
Ambalajı açılmamış ürünleri 14 gün içinde iade edebilirsin. Hijyen gereği, ambalajı açılmış cinsel sağlık ürünleri iade alınamaz. Kusurlu ya da yanlış ürünlerde ambalaj açılmış olsa da değişim veya iade yapılır.

## Hangi kayganlaştırıcıyı kullanmalıyım?
Silikon gövdeli oyuncaklarda yalnızca su bazlı kayganlaştırıcı kullan; silikon bazlı jel, silikon yüzeye zarar verebilir. Prezervatifle birlikte yağ bazlı ürün kullanma.

## Sipariş vermeden önce soru sorabilir miyim?
Elbette. {{ILETISIM}} yoluyla bize ulaşabilirsin.`,
  },
};

// Eski bağlantılar da çalışsın
PAGES.gizlilik = PAGES["gizlilik-politikasi"];
PAGES["iade-kosullari"] = PAGES["iade-degisim"];
PAGES["mesafeli-satis-sozlesmesi"] = PAGES["mesafeli-satis"];
PAGES["iade-ve-degisim"] = PAGES["iade-degisim"];
PAGES["teslimat-ve-kargo"] = PAGES["kargo-teslimat"];

/**
 * Veritabanındaki sayfa, kurulumdan kalma örnek metin mi?
 * Öyleyse yerine hazır metin gösterilir.
 */
export function isPlaceholderContent(content: string): boolean {
  return (
    /örnek şablondur|avukata kontrol ettirmeniz|atölyemizde|her bedene ve her tene|alenora|mayo ve bikini|Kargo süresi Türkiye içinde ortalama 1-3 iş günüdür/i.test(content) ||
    /\[[A-ZÇĞİÖŞÜ _]{4,}\]|…{2,}|\.{6,}/.test(content)
  );
}

export function getLegalPage(slug: string, settings: Record<string, string>): LegalPage | null {
  const page = PAGES[slug];
  if (!page) return null;
  return { title: page.title, body: fillTokens(page.body, settings) };
}

export function fillTokens(text: string, settings: Record<string, string>): string {
  const c = companyInfo(settings);
  const contact = [
    c.email ? `${c.email} e-posta adresi` : "",
    c.phone ? `${c.phone} numaralı telefon` : "",
    "sitedeki İletişim formu",
  ].filter(Boolean);
  const contactText =
    contact.length > 1
      ? `${contact.slice(0, -1).join(", ")} veya ${contact[contact.length - 1]}`
      : contact[0];

  const threshold = Number(settings.free_shipping_threshold) || 0;
  const fee = Number(settings.shipping_fee) || 0;
  const shippingText =
    threshold > 0
      ? `${formatPrice(threshold)} ve üzeri siparişlerde kargo ücretsizdir; altındaki siparişlerde kargo bedeli ${formatPrice(fee)}'dir.`
      : fee > 0
        ? `Kargo bedeli ${formatPrice(fee)}'dir.`
        : "Kargo ücretsizdir.";

  return text
    .replace(/\{\{SATICI_BILGILERI\}\}/g, companyBlock(settings).map((line) => `- ${line}`).join("\n"))
    .replace(/\{\{ILETISIM\}\}/g, contactText)
    .replace(/\{\{UCRETSIZ_KARGO\}\}/g, shippingText)
    .replace(/\{\{SITE_ADI\}\}/g, settings.site_name || c.title)
    .replace(/\{\{SITE\}\}/g, c.site || settings.site_name || "bu site")
    .replace(/\{\{UNVAN\}\}/g, c.title);
}
