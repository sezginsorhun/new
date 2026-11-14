<?php
/**
 * İlk kurulum verisi. Yalnızca veritabanı ilk oluşturulurken bir kez çalışır.
 * Örnek projeler panelden düzenlenmek / silinmek üzere eklenir.
 */
declare(strict_types=1);

function seed_database(): void
{
    $pdo = db();
    $pdo->beginTransaction();

    $settings = [
        'site_name' => 'Ruen Design Studio',
        'logo_line1' => 'RUEN',
        'logo_line2' => 'DESIGN STUDIO',
        'tagline' => 'İç mimarlık ve mekân tasarımı',
        'intro_title' => 'Sessiz, zamansız ve kişiye özel mekânlar.',
        'intro_text' => "Ruen Design Studio; konut, otel, restoran ve ticari mekânlar için iç mimarlık, mobilya ve obje tasarımı yapan bir stüdyodur.\n\nHer projeye mekânın ışığını, malzemesini ve onu kullanacak insanların gündelik ritmini dinleyerek başlarız. Amacımız moda olanı değil, yıllar geçtikçe değer kazanan sakin ve rafine iç mekânlar kurmaktır.",
        'contact_email' => 'info@ruendesignstudio.com',
        'contact_phone' => '',
        'contact_address' => 'İstanbul, Türkiye',
        'contact_hours' => 'Pazartesi – Cuma, 09.30 – 18.30',
        'map_url' => '',
        'instagram' => '',
        'linkedin' => '',
        'pinterest' => '',
        'notify_email' => 'info@ruendesignstudio.com',
        'seo_title' => 'Ruen Design Studio — İç Mimarlık ve Mekân Tasarımı',
        'seo_description' => 'Ruen Design Studio; konut, otel, restoran ve ticari mekânlar için iç mimarlık, mobilya ve obje tasarımı yapan bir tasarım stüdyosudur.',
        'footer_note' => 'İç mimarlık · Mobilya · Obje',
        'home_featured_title' => 'Seçili Projeler',
        'slide_interval' => '6',
    ];
    $st = $pdo->prepare('INSERT OR IGNORE INTO settings(key, value) VALUES(?, ?)');
    foreach ($settings as $k => $v) $st->execute([$k, $v]);

    $hash = (string) cfg('admin_password_hash', '');
    if ($hash !== '') {
        $pdo->prepare('INSERT OR IGNORE INTO users(email, name, password_hash) VALUES(?,?,?)')
            ->execute([strtolower((string) cfg('admin_email')), (string) cfg('admin_name', 'Yönetici'), $hash]);
    }

    $cats = ['Konut', 'Otel', 'Restoran', 'Ofis', 'Mağaza', 'Mobilya'];
    $catIds = [];
    foreach ($cats as $i => $c) {
        $pdo->prepare('INSERT INTO categories(name, slug, sort) VALUES(?,?,?)')->execute([$c, slugify($c), $i]);
        $catIds[$c] = (int) $pdo->lastInsertId();
    }

    $projects = [
        ['Boğaz Dairesi', 'Konut', 'İstanbul, Bebek', '2025', '240 m²',
            'Boğaz manzarasına açılan bir apartman katının, taş, meşe ve keten ile yeniden kurgulanması.',
            "Mevcut planın bölünmüş odaları kaldırılarak manzarayı bütün gün içeri alan tek ve akışkan bir yaşam alanı oluşturuldu.\n\nZeminde açık tonlu traverten, duvarlarda kireç bazlı sıva, mobilyalarda füme meşe kullanıldı. Aydınlatma tavanda saklanarak yalnızca ışığın kendisi bırakıldı.\n\n## Malzeme\n\nTraverten, füme meşe, keten, el yapımı seramik, pirinç detaylar."],
        ['Ege Evi', 'Konut', 'Muğla, Bodrum', '2024', '410 m²',
            'Zeytinlikler arasında, yerel taş ve beyaz badananın sade dilini sürdüren bir yazlık ev.',
            "Ev, arazinin eğimine yerleşen üç kütleden oluşuyor. İç mekânda yerel taş, ham keten ve el örgüsü hasır bir arada kullanıldı.\n\nMobilyaların büyük bölümü stüdyoda tasarlanıp bölge ustaları tarafından üretildi."],
        ['Kıyı Oteli', 'Otel', 'İzmir, Alaçatı', '2025', '32 oda',
            'Taş bir yapının otuz iki odalı butik otele dönüştürülmesi.',
            "Lobi, restoran ve odalarda ortak bir malzeme paleti kuruldu: kum rengi sıva, doğal meşe ve el dokuması kumaşlar.\n\nHer oda için ayrı bir sanat seçkisi hazırlandı."],
        ['Atölye Restoran', 'Restoran', 'İstanbul, Karaköy', '2024', '180 m²',
            'Eski bir matbaa atölyesinde, açık mutfağın etrafında kurgulanan restoran.',
            "Yapının endüstriyel izleri korunarak sıcak bir yemek salonuna dönüştürüldü. Uzun ortak masa ve ceviz bar tezgâhı mekânın merkezini oluşturuyor."],
        ['Galeri Ofis', 'Ofis', 'İstanbul, Levent', '2023', '650 m²',
            'Bir yatırım şirketi için galeri sakinliğinde çalışma ortamı.',
            "Açık çalışma alanları, toplantı odaları ve bir kütüphane; akustik ahşap paneller ve yumuşak tekstillerle dengelendi."],
        ['Moda Butiği', 'Mağaza', 'İstanbul, Nişantaşı', '2023', '120 m²',
            'Bir moda markası için heykelsi raflar ve doğal ışıkla kurgulanan mağaza.',
            "Ürünleri bir sergi gibi sunan, tek parça mermer bloklar ve pirinç askılardan oluşan bir düzen tasarlandı."],
        ['Lune Sehpa', 'Mobilya', 'Stüdyo koleksiyonu', '2025', '',
            'Masif traverten ve füme meşeden, sınırlı sayıda üretilen sehpa.',
            "Lune; iki farklı malzemenin tek bir hat üzerinde buluştuğu, el işçiliğiyle üretilen bir sehpa ailesidir."],
    ];
    $ins = $pdo->prepare('INSERT INTO projects(title, slug, category_id, location, year, area, summary, body, featured, published, sort) VALUES(?,?,?,?,?,?,?,?,?,1,?)');
    foreach ($projects as $i => [$t, $c, $loc, $y, $area, $sum, $body]) {
        $ins->execute([$t, slugify($t), $catIds[$c], $loc, $y, $area, $sum, $body, $i < 4 ? 1 : 0, $i]);
    }

    $slides = [
        ['Boğaz Dairesi', 'İstanbul', '/projeler/bogaz-dairesi'],
        ['Kıyı Oteli', 'Alaçatı', '/projeler/kiyi-oteli'],
        ['Ege Evi', 'Bodrum', '/projeler/ege-evi'],
    ];
    $ins = $pdo->prepare('INSERT INTO slides(image, title, subtitle, link, sort) VALUES(?,?,?,?,?)');
    foreach ($slides as $i => [$t, $s, $l]) $ins->execute(['', $t, $s, $l, $i]);

    $pdo->prepare('INSERT INTO pages(slug, title, body) VALUES(?,?,?)')->execute(['studyo', 'Stüdyo',
        "Ruen Design Studio, iç mimarlık, mobilya ve obje tasarımını tek bir bütün olarak ele alan bir tasarım stüdyosudur.\n\nKonuttan otele, restorandan ticari mekânlara kadar her ölçekte; mekânın mimarisini, ışığını ve malzemesini en baştan birlikte düşünürüz. Projelerimizin büyük bölümünde mobilyaları ve özel parçaları stüdyoda tasarlayıp güvendiğimiz ustalarla üretiriz.\n\n## Yaklaşımımız\n\nSadelik, malzemeye saygı ve zamansızlık. Her projeye, onu kullanacak kişilerin yaşam biçimini anlamakla başlarız.\n\n## Hizmetler\n\nİç mimari proje · Uygulama yönetimi · Mobilya ve obje tasarımı · Aydınlatma kurgusu · Sanat ve aksesuar seçkisi"]);
    $pdo->prepare('INSERT INTO pages(slug, title, body) VALUES(?,?,?)')->execute(['kvkk', 'KVKK Aydınlatma Metni',
        "İletişim formu aracılığıyla paylaştığınız ad, e-posta, telefon ve mesaj bilgileri yalnızca talebinize yanıt vermek amacıyla işlenir ve üçüncü kişilerle paylaşılmaz.\n\n6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamındaki haklarınız için bize e-posta yoluyla ulaşabilirsiniz."]);

    $pdo->commit();
}
