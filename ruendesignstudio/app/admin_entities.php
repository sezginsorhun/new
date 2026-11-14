<?php
/**
 * Panelde düzenlenen içerik türlerinin tanımları. Her tür için liste ve
 * düzenleme ekranı bu tanımlardan otomatik oluşur (admin.php → admin_crud).
 *
 * Alan türleri: text, textarea, richtext (uzun metin), number, check,
 * select (options veya rel), image, gallery, slug.
 */
declare(strict_types=1);

function entity_defs(): array
{
    $pub = ['published' => ['type' => 'check', 'label' => 'Sitede yayında', 'default' => 1, 'side' => true]];
    $sort = ['sort' => ['type' => 'number', 'label' => 'Sıra', 'default' => 0, 'side' => true, 'help' => 'Küçük olan önce görünür.']];

    return [
        'projeler' => [
            'table' => 'projects', 'title' => 'Projeler', 'single' => 'Proje', 'label' => 'title',
            'url' => '/proje/{slug}', 'gallery' => 'project', 'order' => 'sort, id',
            'list' => ['cover' => '', 'title' => 'Proje', 'category_id' => 'Kategori', 'location' => 'Konum', 'published' => 'Durum'],
            'filter' => 'category_id',
            'fields' => [
                'title' => ['type' => 'text', 'label' => 'Proje adı', 'required' => true],
                'category_id' => ['type' => 'select', 'label' => 'Kategori', 'rel' => ['project_categories', 'name']],
                'location' => ['type' => 'text', 'label' => 'Konum', 'help' => 'Örn. Bebek, İstanbul'],
                'intro' => ['type' => 'textarea', 'label' => 'Giriş metni', 'rows' => 4, 'help' => 'Başlığın sağında görünen kısa metin.'],
                'body' => ['type' => 'richtext', 'label' => 'Proje metni', 'rows' => 10, 'help' => 'Paragraflar galerinin arasına yerleşir. Paragrafları boş satırla ayırın.'],
                'quote' => ['type' => 'textarea', 'label' => 'Alıntı', 'rows' => 3],
                'quote_author' => ['type' => 'text', 'label' => 'Alıntı sahibi'],
                'slug' => ['type' => 'slug', 'label' => 'Adres', 'prefix' => '/proje/'],
                'seo_title' => ['type' => 'text', 'label' => 'SEO başlığı'],
                'seo_description' => ['type' => 'textarea', 'label' => 'SEO açıklaması', 'rows' => 2],
                'cover' => ['type' => 'image', 'label' => 'Kapak görseli', 'side' => true, 'help' => 'Yatay, en az 2000 px.'],
                'gallery' => ['type' => 'gallery', 'label' => 'Galeri', 'help' => 'Görseller kolaj düzeninde, sırayla yerleşir.'],
            ] + $pub + $sort,
        ],
        'proje-kategorileri' => [
            'table' => 'project_categories', 'title' => 'Proje Kategorileri', 'single' => 'Kategori', 'label' => 'name',
            'url' => '/projeler/{slug}', 'order' => 'sort, id',
            'list' => ['image' => '', 'name' => 'Kategori', 'published' => 'Durum', 'sort' => 'Sıra'],
            'fields' => [
                'name' => ['type' => 'text', 'label' => 'Ad', 'required' => true],
                'intro' => ['type' => 'textarea', 'label' => 'Tanıtım metni', 'rows' => 6],
                'slug' => ['type' => 'slug', 'label' => 'Adres', 'prefix' => '/projeler/'],
                'image' => ['type' => 'image', 'label' => 'Görsel', 'side' => true, 'help' => 'Projeler sayfasında tam ekran ve menüde küçük görünür.'],
            ] + $pub + $sort,
        ],
        'urunler' => [
            'table' => 'products', 'title' => 'Ürünler', 'single' => 'Ürün', 'label' => 'name',
            'url' => '/urun/{slug}', 'gallery' => 'product', 'order' => 'sort, id',
            'list' => ['cover' => '', 'name' => 'Ürün', 'type_id' => 'Grup', 'collection_id' => 'Koleksiyon', 'price' => 'Fiyat', 'published' => 'Durum'],
            'filter' => 'type_id',
            'fields' => [
                'name' => ['type' => 'text', 'label' => 'Ürün adı', 'required' => true],
                'type_id' => ['type' => 'select', 'label' => 'Ürün grubu', 'rel' => ['product_types', 'name']],
                'collection_id' => ['type' => 'select', 'label' => 'Koleksiyon', 'rel' => ['collections', 'name']],
                'price' => ['type' => 'text', 'label' => 'Fiyat', 'help' => 'Örn. 48.000 ₺ — boş bırakılabilir.'],
                'description' => ['type' => 'richtext', 'label' => 'Açıklama', 'rows' => 6],
                'dimensions' => ['type' => 'text', 'label' => 'Ölçüler'],
                'finishes' => ['type' => 'text', 'label' => 'Bitişler / renkler'],
                'craft' => ['type' => 'textarea', 'label' => 'Zanaat sekmesi', 'rows' => 3],
                'making' => ['type' => 'textarea', 'label' => 'Üretim sekmesi', 'rows' => 3],
                'slug' => ['type' => 'slug', 'label' => 'Adres', 'prefix' => '/urun/'],
                'cover' => ['type' => 'image', 'label' => 'Ana görsel', 'side' => true],
                'gallery' => ['type' => 'gallery', 'label' => 'Ek görseller'],
            ] + $pub + $sort,
        ],
        'urun-gruplari' => [
            'table' => 'product_types', 'title' => 'Ürün Grupları', 'single' => 'Ürün grubu', 'label' => 'name',
            'url' => '/urunler/{slug}', 'order' => 'section, sort, id',
            'list' => ['image' => '', 'name' => 'Grup', 'section' => 'Bölüm', 'group_name' => 'Menü sütunu', 'published' => 'Durum', 'sort' => 'Sıra'],
            'fields' => [
                'name' => ['type' => 'text', 'label' => 'Ad', 'required' => true],
                'section' => ['type' => 'select', 'label' => 'Bölüm', 'options' => ['mobilya' => 'Koleksiyon (mobilya)', 'butik' => 'Butik (aksesuar)'], 'required' => true],
                'group_name' => ['type' => 'text', 'label' => 'Menü sütunu', 'help' => 'Açılır menüde altında listelendiği başlık. Örn. Oturma, Aydınlatma.'],
                'intro' => ['type' => 'textarea', 'label' => 'Tanıtım metni', 'rows' => 5],
                'slug' => ['type' => 'slug', 'label' => 'Adres', 'prefix' => '/urunler/'],
                'image' => ['type' => 'image', 'label' => 'Görsel', 'side' => true],
            ] + $pub + $sort,
        ],
        'koleksiyonlar' => [
            'table' => 'collections', 'title' => 'Koleksiyonlar', 'single' => 'Koleksiyon', 'label' => 'name',
            'url' => '/koleksiyon/{slug}', 'order' => 'sort, id',
            'list' => ['image' => '', 'name' => 'Koleksiyon', 'label' => 'Etiket', 'published' => 'Durum', 'sort' => 'Sıra'],
            'fields' => [
                'name' => ['type' => 'text', 'label' => 'Ad', 'required' => true],
                'label' => ['type' => 'text', 'label' => 'Üst etiket', 'help' => 'Örn. Yeni koleksiyon'],
                'description' => ['type' => 'textarea', 'label' => 'Açıklama', 'rows' => 6],
                'slug' => ['type' => 'slug', 'label' => 'Adres', 'prefix' => '/koleksiyon/'],
                'image' => ['type' => 'image', 'label' => 'Görsel', 'side' => true],
            ] + $pub + $sort,
        ],
        'gunce' => [
            'table' => 'chronicles', 'title' => 'Günce', 'single' => 'Yazı', 'label' => 'title',
            'url' => '/gunce/{slug}', 'gallery' => 'chronicle', 'order' => 'sort, id DESC',
            'list' => ['image' => '', 'title' => 'Yazı', 'label' => 'Etiket', 'published' => 'Durum', 'sort' => 'Sıra'],
            'fields' => [
                'title' => ['type' => 'text', 'label' => 'Başlık', 'required' => true],
                'label' => ['type' => 'text', 'label' => 'Kart etiketi', 'help' => 'Listede görselin altında büyük harfle görünür.'],
                'excerpt' => ['type' => 'textarea', 'label' => 'Özet', 'rows' => 3],
                'body' => ['type' => 'richtext', 'label' => 'Yazı', 'rows' => 12],
                'slug' => ['type' => 'slug', 'label' => 'Adres', 'prefix' => '/gunce/'],
                'image' => ['type' => 'image', 'label' => 'Görsel', 'side' => true],
                'wide' => ['type' => 'check', 'label' => 'Listede geniş kart', 'side' => true],
                'gallery' => ['type' => 'gallery', 'label' => 'Yazı galerisi'],
            ] + $pub + $sort,
        ],
        'showroomlar' => [
            'table' => 'showrooms', 'title' => 'Adresler / Showroomlar', 'single' => 'Adres', 'label' => 'name',
            'url' => '/adres/{slug}', 'gallery' => 'showroom', 'order' => 'sort, id',
            'list' => ['image' => '', 'name' => 'Ad', 'short' => 'Konum', 'phone' => 'Telefon', 'published' => 'Durum'],
            'fields' => [
                'name' => ['type' => 'text', 'label' => 'Ad', 'required' => true],
                'short' => ['type' => 'text', 'label' => 'Kısa konum', 'help' => 'Menüde adın altında görünür.'],
                'address' => ['type' => 'textarea', 'label' => 'Adres', 'rows' => 3],
                'phone' => ['type' => 'text', 'label' => 'Telefon'],
                'hours' => ['type' => 'text', 'label' => 'Çalışma saatleri'],
                'intro' => ['type' => 'textarea', 'label' => 'Tanıtım', 'rows' => 6],
                'body' => ['type' => 'textarea', 'label' => 'Dekorasyon hizmeti metni', 'rows' => 6],
                'slug' => ['type' => 'slug', 'label' => 'Adres', 'prefix' => '/adres/'],
                'image' => ['type' => 'image', 'label' => 'Görsel', 'side' => true],
                'gallery' => ['type' => 'gallery', 'label' => 'Slayt görselleri', 'help' => 'Sayfanın üstündeki geçişli görseller.'],
            ] + $pub + $sort,
        ],
        'slaytlar' => [
            'table' => 'slides', 'title' => 'Evren Görselleri', 'single' => 'Görsel', 'label' => 'title',
            'order' => 'place, sort, id',
            'list' => ['image' => '', 'title' => 'Başlık', 'place' => 'Yer', 'active' => 'Durum', 'sort' => 'Sıra'],
            'fields' => [
                'title' => ['type' => 'text', 'label' => 'Başlık'],
                'place' => ['type' => 'select', 'label' => 'Yer', 'options' => ['evren' => 'Evren — üst slayt', 'evren-sanat' => 'Evren — sanat şeridi'], 'required' => true],
                'image' => ['type' => 'image', 'label' => 'Görsel', 'side' => true, 'required' => true],
                'active' => ['type' => 'check', 'label' => 'Aktif', 'default' => 1, 'side' => true],
            ] + $sort,
        ],
        'sayfalar' => [
            'table' => 'pages', 'title' => 'Sayfalar', 'single' => 'Sayfa', 'label' => 'title', 'key' => 'slug',
            'url' => '/{slug}', 'order' => 'title', 'fixed' => true,
            'list' => ['title' => 'Sayfa', 'slug' => 'Adres', 'updated_at' => 'Güncelleme'],
            'fields' => [
                'title' => ['type' => 'text', 'label' => 'Başlık', 'required' => true],
                'subtitle' => ['type' => 'text', 'label' => 'Alt başlık'],
                'body' => ['type' => 'richtext', 'label' => 'Metin', 'rows' => 14, 'help' => 'Paragrafları boş satırla ayırın. “## Başlık” ara başlık, **kalın**, *italik*.'],
                'image' => ['type' => 'image', 'label' => 'Görsel', 'side' => true],
            ],
        ],
    ];
}
