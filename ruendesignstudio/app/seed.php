<?php
/**
 * Demo içerik. Şema v2 kurulurken bir kez çalışır. Tüm metinler ve görseller
 * panelden değiştirilmek üzere eklenmiştir (görseller: assets/demo, Unsplash).
 */
declare(strict_types=1);

function demo(string $name): string
{
    return 'assets/demo/' . $name . '.webp';
}

function seed_database(): void
{
    $pdo = db();
    $pdo->beginTransaction();

    /* ---------- Ayarlar ---------- */
    $force = [
        'logo_left' => 'RUEN',
        'logo_mid' => 'Design',
        'logo_right' => 'STUDIO',
        'announce_title' => 'Sükûnet',
        'announce_text' => 'Ruen × Taş Atölyesi',
        'announce_link' => '/gunce/sukunet-yeni-koleksiyon',
        'hero_image' => demo('salon-genis'),
        'hero_video' => '',
        'hero_title' => 'Sükûnet',
        'hero_subtitle' => 'Ruen Design Studio × Taş Atölyesi',
        'hero_link' => '/gunce/sukunet-yeni-koleksiyon',
        'home_intro' => "Ruen Design Studio bir iç mimarlık stüdyosudur; yazısı iki elden çıkan tekil bir dile dayanır: Anadolu'nun zanaat mirası ile çağdaş bir mekân anlayışı arasında yaratıcı bir karşıtlık. Mekânlar, mobilya ve aksesuarlar tek bir hareketle düşünülür; kültür, malzeme ve anlamla beslenerek kalıcı ve derinden yaşanan ortamlar kurulur.",
        'home_intro_link' => 'Evreni keşfedin',
        'home_projects_title' => 'Projeler',
        'home_projects_text' => "On yılı aşkın süredir Ruen Design Studio; özel konutlar, oteller, restoranlar, yatlar ve kurumsal mekânlar için içten dışa düşünülmüş projeler tasarlıyor. Her proje, yerin hikâyesi ve onu yaşayacak insanların gündelik ritmiyle yankılanır.",
        'home_collection_title' => 'Ev Koleksiyonu',
        'home_collection_text' => "Ruen imzalı Ev Koleksiyonu iç mimarinin bir uzantısıdır.\n\nMobilya, oturma grupları, aydınlatma ve aksesuarlar: her parça stüdyoda çizilir, düşünülür ve sınırlı sayıda üretilir.\n\nMekânın parçaları olarak tasarlanan bu eserler; çizgide, oranda ve malzemede aynı titizliği taşır.\n\nOyulmuş ahşap, damarlı mermer, patinalı bronz, dokulu sıva, üflenmiş cam: usta ellerin hareketi tasarımın kesinliğini ortaya çıkarır.\n\nMekânın ruhu, nesnenin ölçeğinde.",
        'home_collection_image' => demo('kanepe-bej'),
        'home_collection_image2' => demo('sarkit-pirinc'),
        'home_collection_image3' => demo('tabure'),
        'home_addresses_title' => 'Adreslerimiz',
        'home_addresses_text' => "Nişantaşı'ndaki tasarım ofisinden İstanbul ve Bodrum'daki showroom-dairelerine kadar Ruen Design Studio bütüncül bir vizyon sunar: mekânı bütünüyle düşünmek, ardından yazısını mobilya ve aksesuar tasarımıyla sürdürmek.",
        'home_meet_title' => 'Bizimle Tanışın',
        'home_meet_text' => 'İç mimarlık projeleriniz, koleksiyonlarımız, hizmetlerimiz ya da aklınızdaki her türlü soru için bize bilgilerinizi bırakın. Ekibimiz en kısa sürede size dönüş yapacaktır.',
        'univers_menu_text' => "On yılı aşkın süre önce kurulan Ruen Design Studio, Türk iç mimarlık ve tasarım stüdyosudur.\n\nİki elden çıkan tekil yazısı yaratıcı bir karşıtlığa dayanır: zanaat mirası ile çağdaş dil arasında. Mekânlar, mobilya ve aksesuarlar tek bir hareketle düşünülür.",
        'univers_menu_image' => demo('salon-krem'),
        'collection_menu_image' => demo('salon-bitki'),
        'shop_menu_image' => demo('yemek-odasi'),
        'collections_hero' => demo('beyaz-kose'),
        'collections_intro' => "Malzemeler, hareketler ve hayaller arasında diyaloglar olarak düşünülen Ruen koleksiyonları; sanatçılar ve usta atölyelerle iş birliği içinde olağanüstü zanaatı kutlar.\n\nHer koleksiyon güzelin hassas bir keşfidir; mekânları doğrulukla ve karakterle yaşamak için düşünülmüştür.",
        'mobilya_hero' => demo('salon-modern'),
        'chronicles_intro' => "Her yazı bir niyeti ortaya koyar, bir ayrıntıyı aydınlatır, bir gerilimi vurgular. Mekânlar anlatılır, nesneler mimariyi sürdürür, miras bugünle konuşur, karşıtlar uzlaşır. Bu parçalar aracılığıyla — malzeme, projeler, sohbetler, yerleştirmeler — bir vizyon belirir: Ruen'in zamansız imzasına biçim veren, hareket hâlinde bir düşünce.",
        'chronicles_marquee' => 'bir hikâyeler defteri',
        'design_steps' => "Tanışma | Dinlemek, anlamak, paylaşmak. Her proje Nişantaşı'ndaki ofisimizde ya da showroom'larımızda bir buluşmayla başlar; arzuları, yaşam biçimini ve ihtiyaçları kavramak için.\nTasarım | Planlar, malzeme panoları ve üç boyutlu görseller: mekânın yeni yazısı adım adım biçimlenir.\nUygulama | Usta ekiplerimiz ve güvendiğimiz atölyelerle şantiyenin her aşamasını yönetiriz.\nİmza | Mobilya, aydınlatma, sanat ve aksesuar seçkisiyle mekân son hâlini alır.",
        'site_name' => 'Ruen Design Studio',
        'seo_title' => 'Ruen Design Studio — İç Mimarlık, Mobilya ve Ev Koleksiyonu',
        'seo_description' => 'Ruen Design Studio; özel konutlar, oteller, restoranlar ve yatlar için iç mimarlık, mobilya ve ev koleksiyonu tasarlayan bir stüdyodur.',
    ];
    $keep = [
        'contact_email' => 'info@ruendesignstudio.com',
        'contact_phone' => '+90 212 000 00 00',
        'notify_email' => 'info@ruendesignstudio.com',
        'instagram' => 'https://instagram.com/',
        'pinterest' => 'https://pinterest.com/',
        'linkedin' => 'https://linkedin.com/',
    ];
    $up = $pdo->prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    foreach ($force as $k => $v) $up->execute([$k, $v]);
    $ins = $pdo->prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = CASE WHEN settings.value = \'\' THEN excluded.value ELSE settings.value END');
    foreach ($keep as $k => $v) $ins->execute([$k, $v]);

    $hash = (string) cfg('admin_password_hash', '');
    if ($hash !== '') {
        $pdo->prepare('INSERT OR IGNORE INTO users(email, name, password_hash) VALUES(?,?,?)')
            ->execute([strtolower((string) cfg('admin_email')), (string) cfg('admin_name', 'Yönetici'), $hash]);
    }

    $gal = $pdo->prepare('INSERT INTO gallery(owner, owner_id, path, caption, sort) VALUES(?,?,?,?,?)');
    $addGallery = function (string $owner, int $id, array $imgs) use ($gal) {
        foreach ($imgs as $i => $img) $gal->execute([$owner, $id, demo($img), '', $i]);
    };

    /* ---------- Proje kategorileri ve projeler ---------- */
    $cats = [
        ['Konutlar', 'salon-galeri', 'Bir ev, sahibinin hikâyesini taşıyan en kişisel mekândır. Ruen Design Studio her konut projesinde önce dinler: aile, alışkanlıklar, koleksiyonlar, ışığın günün saatlerine göre değişimi. Ardından mimariyi, malzemeyi ve mobilyayı tek bir dil hâlinde örer. Sonuç; gösterişten uzak, her ayrıntısı düşünülmüş, yıllar geçtikçe değer kazanan iç mekânlardır.'],
        ['Oteller', 'otel-resort', 'Bir otel, misafirlerin hareket hâlindeki bir dekorun oyuncularına dönüştüğü kalıcı bir tiyatrodur. Ruen Design Studio burada sahneleme sanatını uygular: bağlamı kavramak, bir ülkenin ruhunu yakalamak, misafiri hayal etmek ve insanı tüm nüanslarıyla yorumlamak. Hacimler, malzemeler, ışık ve dolaşım canlı bir senaryoya dönüşür.'],
        ['Restoranlar', 'restoran-salon', 'Bir restoran önce bir atmosferdir. Işığın masaya düşüşü, sesin yumuşaklığı, malzemelerin dokunuşu: her ayrıntı sofradaki deneyimin bir parçası olarak tasarlanır.'],
        ['Yat', 'yat', 'Denizde her şey özüne iner. Ruen Design Studio için bir yat, hareket hâlindeki bir anlatıdır: sınırlı hacimde ferahlık, rüzgâra ve tuza dayanan malzemeler, ufka açılan bakışlar.'],
        ['Rezidanslar', 'salon-yesil', 'Otel hizmetinin konforunu evin sıcaklığıyla buluşturan rezidans projeleri; uzun soluklu yaşam için tasarlanmış, ölçülü ve zamansız iç mekânlar.'],
        ['Kurumsal', 'ofis-ortak', 'Çalışma mekânları bir kurumun kimliğini en doğrudan anlatan yerlerdir. Galeri sakinliğinde, akustiği ve ışığı özenle kurgulanmış ofisler tasarlıyoruz.'],
        ['Mağazalar', 'magaza', 'Bir mağaza, markanın üç boyutlu bir manifestosudur. Ürünü bir eser gibi sunan, ziyaretçiyi yavaşlatan ve davet eden mekânlar kurguluyoruz.'],
    ];
    $catIds = [];
    $st = $pdo->prepare('INSERT INTO project_categories(name, slug, intro, image, sort) VALUES(?,?,?,?,?)');
    foreach ($cats as $i => [$n, $img, $intro]) {
        $st->execute([$n, slugify($n), $intro, demo($img), $i]);
        $catIds[$n] = (int) $pdo->lastInsertId();
    }

    $projects = [
        ['Konutlar', 'Boğaz Yalısı', 'Bebek, İstanbul', ['salon-galeri', 'salon-genis', 'yemek-odasi', 'yatak-klasik', 'antre', 'banyo', 'calisma-odasi']],
        ['Konutlar', 'Nişantaşı Dairesi', 'Nişantaşı, İstanbul', ['salon-krem', 'salon-modern', 'mutfak', 'yatak-beyaz', 'beyaz-kose']],
        ['Konutlar', 'Yalıkavak Villası', 'Bodrum, Muğla', ['villa-gece', 'villa-cephe', 'villa-yatak', 'salon-sade', 'plaj-teras']],
        ['Oteller', 'Kaya Otel Kapadokya', 'Ürgüp, Nevşehir', ['otel-resort', 'otel-oda-ahsap', 'dag-evi', 'otel-havuz', 'yatak-klasik']],
        ['Oteller', 'Ege Kıyı Oteli', 'Alaçatı, İzmir', ['otel-sonsuzluk', 'otel-oda-modern', 'plaj-teras', 'restoran-teras']],
        ['Oteller', 'Lune Hotel Galata', 'Galata, İstanbul', ['otel-oda-klasik', 'otel-oda-turuncu', 'salon-bohem', 'banyo']],
        ['Restoranlar', 'Mavi Teras', 'Göcek, Muğla', ['restoran-teras', 'restoran-masa', 'kafe']],
        ['Restoranlar', 'Atölye Karaköy', 'Karaköy, İstanbul', ['restoran-salon', 'kafe', 'restoran-masa']],
        ['Yat', 'M/Y Selene', 'Akdeniz', ['yat', 'plaj-teras', 'otel-oda-modern', 'beyaz-kose']],
        ['Rezidanslar', 'Levent Rezidans', 'Levent, İstanbul', ['salon-yesil', 'yatak-yesil', 'salon-bitki', 'mutfak']],
        ['Kurumsal', 'Galeri Ofis Maslak', 'Maslak, İstanbul', ['ofis-ortak', 'ofis-koridor', 'loft-oturma', 'calisma-odasi']],
        ['Mağazalar', 'Nişantaşı Butik', 'Nişantaşı, İstanbul', ['magaza', 'beyaz-kose', 'bitki-kose']],
        ['Konutlar', 'Moda Evi', 'Moda, İstanbul', ['salon-mavi', 'salon-gri', 'berjer-sari', 'yatak-beyaz']],
    ];
    $st = $pdo->prepare('INSERT INTO projects(category_id, title, slug, location, intro, body, quote, quote_author, cover, sort) VALUES(?,?,?,?,?,?,?,?,?,?)');
    foreach ($projects as $i => [$cat, $title, $loc, $imgs]) {
        $intro = "$loc'da Ruen Design Studio, mekânın tarihini ve ışığını yeniden yorumluyor. Doğal malzemeler, ölçülü renkler ve stüdyoda tasarlanan mobilyalarla proje; var olanın özgünlüğünü çağdaş bir yaşam sanatıyla buluşturuyor.";
        $body = "Proje, mekânın derin bir saygıyla ele alınmasıyla başladı. Korunan özgün detaylar, restore edilen tavanlar ve yeniden ortaya çıkarılan malzemeler; yapının asaletini görünür kılıyor. Bu alçakgönüllü ve ölçülü yaklaşım, eski ile yeninin çağdaş bir yazıyla diyaloğa girmesine olanak tanıyor.\n\nMobilyalar yerel kodlardan ilham alıyor ancak daha sade çizgilerle yeniden yorumlanıyor; sahiplerinin ve stüdyonun seçtiği sanat eserleri ve antika parçalarla yan yana duruyor. Bu kompozisyondan hem zengin hem de yaşanmış bir atmosfer doğuyor; her nesne zaman içinde yerini bulmuş gibi.";
        $st->execute([$catIds[$cat], $title, slugify($title), $loc, $intro, $body,
            'Bu projede tercihimiz, neredeyse sessizliğe varan bir ölçülülük oldu. Bilerek sade bir yazı seçtik; mekâna olabildiğince ışık getirirken onun ruhunu korumak istedik.',
            'Ruen Design Studio', demo($imgs[0]), $i]);
        $addGallery('project', (int) $pdo->lastInsertId(), array_slice($imgs, 1));
    }

    /* ---------- Koleksiyonlar, ürün grupları, ürünler ---------- */
    $collections = [
        ['Sükûnet', 'Yeni koleksiyon', "Sükûnet, zamanın yavaşladığı anlara bir saygı duruşudur. Antik taş ocaklarının sessizliği, el ile yontulmuş traverten ve füme meşe bu koleksiyonda bir araya geliyor.\n\nYavaş yaşamanın nesneleri: dokunulmak, kullanılmak, kuşaktan kuşağa aktarılmak için.", 'kanepe-bej'],
        ['Ege Işığı', 'Yeni koleksiyon', "Ege'nin beyaz ışığından ilham alan üflenmiş cam ve pirinç aydınlatmalar. Her parça ustaların nefesiyle biçimlenir; ışık ve renk sofraya parıldayan bir dokunuş katar.", 'sarkit-pirinc'],
        ['Taş & Meşe', 'Koleksiyon', "Kayalıklar, dalgaların dövdüğü kıyılar, yüzyılların yonttuğu taşlar. Bu koleksiyonun her parçası zamanla biçimlenen manzaralardan ilham alır; mineral bir estetikle hacimlerin saflığını malzemenin yoğunluğuyla buluşturur.", 'tabure'],
    ];
    $colIds = [];
    $st = $pdo->prepare('INSERT INTO collections(name, slug, label, description, image, sort) VALUES(?,?,?,?,?,?)');
    foreach ($collections as $i => [$n, $l, $d, $img]) {
        $st->execute([$n, slugify($n), $l, $d, demo($img), $i]);
        $colIds[$n] = (int) $pdo->lastInsertId();
    }

    $types = [
        // bölüm, grup, ad, görsel
        ['mobilya', 'Mobilya', 'Sehpalar', 'salon-sade'],
        ['mobilya', 'Mobilya', 'Konsollar', 'antre'],
        ['mobilya', 'Mobilya', 'Yemek Masaları', 'yemek-odasi'],
        ['mobilya', 'Mobilya', 'Kitaplıklar', 'salon-galeri'],
        ['mobilya', 'Oturma', 'Kanepeler', 'kanepe-yesil'],
        ['mobilya', 'Oturma', 'Berjerler', 'berjer-sari'],
        ['mobilya', 'Oturma', 'Sandalyeler', 'sandalye-beyaz'],
        ['mobilya', 'Oturma', 'Tabureler', 'tabure'],
        ['mobilya', 'Aydınlatma', 'Sarkıtlar', 'sarkit-pirinc'],
        ['mobilya', 'Aydınlatma', 'Lambaderler', 'sarkit-lamba'],
        ['butik', 'Aksesuarlar', 'Vazolar', 'bitki-kose'],
        ['butik', 'Aksesuarlar', 'Mumluklar', 'beyaz-kose'],
        ['butik', 'Aksesuarlar', 'Yastıklar', 'kanepe-turuncu'],
        ['butik', 'Sofra', 'Karaflar', 'kafe'],
        ['butik', 'Sofra', 'Tepsiler', 'restoran-masa'],
        ['butik', 'Aydınlatma', 'Masa Lambaları', 'sarkit-lamba'],
    ];
    $typeIds = [];
    $st = $pdo->prepare('INSERT INTO product_types(section, group_name, name, slug, intro, image, sort) VALUES(?,?,?,?,?,?,?)');
    foreach ($types as $i => [$sec, $grp, $n, $img]) {
        $intro = "Ruen imzalı " . mb_strtolower($n) . "; mekâna malzeme ve şiir katar. Doğal taş, masif ahşap ve el işçiliğiyle biçimlenen her parça, güç ile incelik arasında heykelsi bir varlık ortaya koyar — yaşanmış bir iç mekânda zarif bir vurgu.";
        $st->execute([$sec, $grp, $n, slugify($n), $intro, demo($img), $i]);
        $typeIds[$n] = (int) $pdo->lastInsertId();
    }

    $products = [
        ['Ada', 'Sehpalar', 'Taş & Meşe', '68.000 ₺', 'salon-sade', '120 × 70 × H 32 cm', 'Traverten, füme meşe'],
        ['Pera', 'Konsollar', 'Sükûnet', '84.000 ₺', 'antre', '160 × 40 × H 80 cm', 'Masif ceviz, pirinç'],
        ['Bora', 'Yemek Masaları', 'Taş & Meşe', '142.000 ₺', 'yemek-odasi', '240 × 105 × H 75 cm', 'Füme meşe, Afyon mermeri'],
        ['Lune', 'Kanepeler', 'Sükûnet', '196.000 ₺', 'kanepe-bej', '260 × 98 × H 72 cm', 'Keten bouclé — kum, kireç, toprak'],
        ['Deniz', 'Kanepeler', '', '172.000 ₺', 'kanepe-yesil', '220 × 92 × H 78 cm', 'Kadife — zümrüt, gece mavisi'],
        ['Mira', 'Berjerler', 'Sükûnet', '58.000 ₺', 'berjer-sari', '78 × 82 × H 80 cm', 'Yün — safran, krem'],
        ['Selin', 'Sandalyeler', '', '24.000 ₺', 'sandalye-beyaz', '52 × 56 × H 86 cm', 'Kapitone keten, beyaz lake'],
        ['Kara', 'Sandalyeler', '', '19.500 ₺', 'sandalye-siyah', '48 × 54 × H 82 cm', 'Siyah kabuk, meşe ayak'],
        ['Kum', 'Tabureler', 'Taş & Meşe', '16.000 ₺', 'tabure', 'Ø 38 × H 65 cm', 'Kireçlenmiş meşe'],
        ['Ece', 'Sarkıtlar', 'Ege Işığı', '46.000 ₺', 'sarkit-pirinc', 'Ø 32 × H 40 cm', 'Fırçalanmış pirinç'],
        ['Defne', 'Lambaderler', 'Ege Işığı', '38.000 ₺', 'sarkit-lamba', 'Ø 45 × H 160 cm', 'Lake metal, opal cam'],
        ['Taşlık', 'Vazolar', 'Taş & Meşe', '9.800 ₺', 'bitki-kose', 'Ø 22 × H 43 cm', 'Ham seramik, sırlı seramik'],
        ['Antik', 'Vazolar', 'Sükûnet', '12.400 ₺', 'beyaz-kose', 'Ø 18 × H 36 cm', 'Üflenmiş cam — beyaz, seladon'],
        ['Ege', 'Mumluklar', 'Ege Işığı', '4.200 ₺', 'beyaz-kose', 'Ø 9 × H 24 cm', 'Bronz, mermer kaide'],
        ['Keten', 'Yastıklar', '', '3.600 ₺', 'kanepe-turuncu', '50 × 50 cm', 'Yıkanmış keten — kiremit, kum'],
        ['Damla', 'Karaflar', 'Ege Işığı', '5.900 ₺', 'kafe', '1 L', 'Üflenmiş cam — amber, şeffaf'],
        ['Lif', 'Tepsiler', 'Taş & Meşe', '7.400 ₺', 'restoran-masa', '45 × 30 cm', 'Oyulmuş ceviz'],
        ['Hilal', 'Masa Lambaları', 'Ege Işığı', '21.000 ₺', 'sarkit-lamba', 'Ø 30 × H 55 cm', 'Traverten gövde, keten abajur'],
    ];
    $st = $pdo->prepare('INSERT INTO products(type_id, collection_id, name, slug, price, description, dimensions, finishes, craft, making, cover, sort) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
    foreach ($products as $i => [$n, $type, $col, $price, $img, $dim, $fin]) {
        $desc = "Yumuşak hatları ve heykelsi duruşuyla $n, zamansız parçaların zarafetini çağdaş bir incelikle yeniden yorumluyor. Ruen Design Studio tarafından tasarlanan parça, titiz bir zanaat bilgisiyle elde üretilir. Her detay ayrı ayrı işlenir ve özenle birleştirilir; böylece her parça kendine özgü bir karakter kazanır.";
        $st->execute([$typeIds[$type], $col ? $colIds[$col] : null, $n, slugify($n . ' ' . $type), $price, $desc, $dim, $fin,
            'Parça, kuşaklar boyu aktarılan el işçiliği bilgisine sahip atölyelerimizde üretilir. Her aşamada ustanın eli, malzemenin doğal karakterini ortaya çıkarır.',
            'Türkiye\'de, siparişe özel olarak üretilir. Teslim süresi 8 – 12 haftadır.',
            demo($img), $i]);
    }

    /* ---------- Günce ---------- */
    $chron = [
        ['Sükûnet: yeni koleksiyon', 'Ruen × Taş Atölyesi', 'Sükûnet koleksiyonu; traverten, meşe ve keteni yavaş yaşamın nesnelerinde buluşturuyor.', 'kanepe-bej', 0],
        ['Yeni sahneleme: İstanbul showroom', 'Showroom', "Ruen Design Studio, Bebek'teki showroom-dairesinin yeni sahnelemesini tanıtıyor.", 'salon-galeri', 1],
        ['Denizde yaşamak', 'Yat: okyanusu yaşamak', 'Denizde her şey özüne iner. Ruen için bir yat, hareket hâlinde bir anlatıdır.', 'yat', 1],
        ['Taşın sabrı', 'Atölye ziyareti', 'Afyon ocaklarından atölyeye: bir sehpanın doğuşuna tanıklık ettik.', 'tabure', 0],
        ['Lune Hotel Galata açıldı', 'Oteller', "Galata'nın tarihi dokusunda otuz iki odalı yeni bir otel.", 'otel-oda-klasik', 0],
        ['Ege ışığında bir sofra', 'Ruen × Sofra', 'Ege Işığı koleksiyonu için hazırlanan sofra sahnelemesinin perde arkası.', 'restoran-teras', 1],
    ];
    $st = $pdo->prepare('INSERT INTO chronicles(title, slug, label, excerpt, body, image, wide, sort) VALUES(?,?,?,?,?,?,?,?)');
    foreach ($chron as $i => [$t, $l, $ex, $img, $wide]) {
        $st->execute([$t, slugify($t), $l, $ex,
            "$ex\n\nHer proje bir diyalogla başlar: malzemeyle, mekânla ve onu yaşayacak insanlarla. Bu yazıda, sürecin perde arkasını ve bizi bu sonuca götüren seçimleri paylaşıyoruz.\n\nMalzeme seçimi, ışığın kurgusu ve zanaatkârlarla kurulan uzun soluklu iş birlikleri; Ruen imzasının görünmeyen ama hissedilen katmanlarıdır.",
            demo($img), $wide, $i]);
    }

    /* ---------- Showroomlar ---------- */
    $show = [
        ['Tasarım Ofisi', 'Nişantaşı, İstanbul', "Teşvikiye Cad. No: 00\nNişantaşı, İstanbul", 'calisma-odasi'],
        ['Showroom İstanbul', 'Bebek, İstanbul', "Cevdet Paşa Cad. No: 00\nBebek, İstanbul", 'salon-galeri'],
        ['Showroom Bodrum', 'Yalıkavak, Bodrum', "Yalıkavak Marina\nBodrum, Muğla", 'villa-gece'],
    ];
    $st = $pdo->prepare('INSERT INTO showrooms(name, slug, short, address, phone, hours, intro, body, image, sort) VALUES(?,?,?,?,?,?,?,?,?,?)');
    foreach ($show as $i => [$n, $short, $addr, $img]) {
        $st->execute([$n, slugify($n), $short, $addr, '+90 212 000 00 0' . $i, 'Pazartesi – Cuma, 10.00 – 19.00 · yalnızca randevuyla',
            "Buraya bir eve girer gibi girilir: bir yatak odası, salonlar, bir çalışma odası; her odada Ruen'in yaşam sanatı malzemelerin, hacimlerin ve ışığın uyumu içinde açılır.\n\nArdından galeri gelir; beklenmeyene ve aykırıya izin verdiğimiz deney alanımız. Burada sezgilerimizi konuşturur, dener, test eder, cesaret ederiz.",
            "Bu adresten Ruen Design Studio, özel bir ekiple dekorasyon ve mobilya projelerine eşlik eder. Mekânın vizyonu, mevcut alanlara uygulanır: duvar kâğıtları, boyalar ve malzemelerle yeni bir dekoratif kabuk.\n\nEkip; arşiv görüntülerine, Ruen koleksiyonuna ve özenle seçilmiş sanat eserlerine dayanarak kişiye özel sahnelemeler kurar.",
            demo($img), $i]);
    }

    /* ---------- Evren slaytları ---------- */
    $st = $pdo->prepare('INSERT INTO slides(place, image, title, sort) VALUES(?,?,?,?)');
    foreach ([['salon-krem', 'Ruen Design Studio'], ['calisma-odasi', 'Stüdyoda bir gün'], ['salon-galeri', 'Malzemenin sessizliği']] as $i => [$img, $t]) {
        $st->execute(['evren', demo($img), $t, $i]);
    }
    foreach ([['salon-bohem', 'Ruen ve sanat'], ['yatak-klasik', 'Zanaat'], ['otel-oda-ahsap', 'Işık']] as $i => [$img, $t]) {
        $st->execute(['evren-sanat', demo($img), $t, $i]);
    }

    /* ---------- Sayfalar ---------- */
    $pages = [
        ['evren', 'Evren', 'Ruen Design Studio', "Birbirini tamamlayan iki bakış: biri mimarinin kesin çizgisine, diğeri rengin ve dokunun özgürlüğüne inanır. Birbirine karşı koyar, birbirini çeker; uzlaşmak için ayrışır.\n\nBu tartışmalardan zengin ve ilham dolu bir yaratıcı diyalog doğar: zihinsel bir masa tenisi içinde ekip fikirlerine biçim verir. Asil ağaç türleri ve yalın çizgiler stüdyonun grameriyse, renk, mekânsal akışkanlık ve doğal bir zarafet de hacimleri canlandırır.\n\n*Birlikte, herkesin kendi rolünü ve üslubunu taşıdığı bir partisyon yazarlar; bir bütün oluşturmak için.*", demo('calisma-odasi')],
        ['tasarim-hizmeti', 'Tasarım Hizmeti', 'Kişiye özel iç dekorasyon', "İstanbul ve Bodrum'daki showroom'larından Ruen Design Studio, **Tasarım Hizmeti** aracılığıyla bir mekâna dair vizyonunu sunar. Yeniden yorumlamak, yeni bir dekoratif kabukla kaplamak istediğiniz bir daire ya da ev.\n\nBoyalardan duvar kaplamalarına, süslü tavanlardan giydirilmiş pencerelere: Ruen, mevcut mekânı dekoratif kurgularla dönüştürür.\n\nBu dekoratif yazıya, on yılı aşkın sürede çizilen ve Türkiye'de üretilen özgün mobilyaların deneyimi eklenir. Ruen'in tasarladığı ve ürettiği mobilya ve objeler, seçilmiş sanat eserleriyle birlikte asli bir yer tutar.", demo('salon-krem')],
        ['iletisim', 'Bize Ulaşın', 'Bizi bulun', "İç mimarlık projeniz, koleksiyonlarımız, hizmetlerimiz ya da aklınızdaki her türlü soru için bilgilerinizi bırakın. Ekibimiz en kısa sürede size dönüş yapacaktır.", demo('antre')],
        ['basin', 'Basın', '', "Ruen Design Studio projeleri ulusal ve uluslararası mimarlık ve dekorasyon yayınlarında yer almaktadır.\n\nBasın talepleriniz ve görsel istekleriniz için: basin@ruendesignstudio.com", ''],
        ['oduller', 'Ödüller', '', "## 2026\n\nYılın İç Mimarlık Stüdyosu — demo ödül\n\n## 2025\n\nEn İyi Otel İç Mekânı — demo ödül\n\n## 2024\n\nTasarım Mükemmellik Ödülü, Mobilya — demo ödül", ''],
        ['kariyer', 'Kariyer', '', "Ruen Design Studio; iç mimar, proje yöneticisi ve tasarımcılardan oluşan bir ekiple çalışır. Ekibimize katılmak istiyorsanız özgeçmişinizi ve portfolyonuzu kariyer@ruendesignstudio.com adresine gönderebilirsiniz.", ''],
        ['kvkk', 'KVKK Aydınlatma Metni', '', "Formlar aracılığıyla paylaştığınız ad, e-posta, telefon ve mesaj bilgileri yalnızca talebinize yanıt vermek amacıyla işlenir ve üçüncü kişilerle paylaşılmaz.\n\n6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamındaki haklarınız için bize e-posta yoluyla ulaşabilirsiniz.", ''],
        ['yasal-bildirim', 'Yasal Bildirim', '', "Bu site Ruen Design Studio tarafından yayınlanmaktadır.\n\nSitede yer alan metin ve görsellerin izinsiz kullanılması yasaktır.", ''],
        ['satis-kosullari', 'Satış Koşulları', '', "Ruen koleksiyonundaki parçalar siparişe özel üretilir. Fiyat, teslim süresi ve ödeme koşulları için ekibimizle iletişime geçiniz.", ''],
        ['cerez-politikasi', 'Çerez Politikası', '', "Bu site yalnızca çalışması için gerekli olan teknik çerezleri kullanır. Reklam veya izleme çerezi kullanılmaz.", ''],
    ];
    $st = $pdo->prepare('INSERT INTO pages(slug, title, subtitle, body, image) VALUES(?,?,?,?,?)');
    foreach ($pages as $p) $st->execute($p);

    $pdo->commit();
}
