<?php
/**
 * Vitrin sayfaları. Sayfa yapısı Gilles & Boissier sitesinin kurgusunu izler:
 *   /                      ana sayfa
 *   /evren                 stüdyo / evren
 *   /projeler              proje kategorileri (tam genişlik görseller)
 *   /projeler/<kategori>   kategori: başlık + metin + proje ızgarası
 *   /proje/<proje>         proje detayı: kolaj galeri + alıntı
 *   /gunce, /gunce/<yazi>  günce (chroniques)
 *   /koleksiyonlar, /koleksiyon/<ad>
 *   /mobilya, /butik       ürün grupları
 *   /urunler/<grup>        ürün listesi
 *   /urun/<urun>           ürün detayı
 *   /adres/<showroom>      showroom sayfası
 *   /tasarim-hizmeti, /iletisim, /arama, /istek-listesi
 *   /basin, /oduller, /kariyer, /kvkk, /yasal-bildirim, /satis-kosullari, /cerez-politikasi
 */
declare(strict_types=1);

function site_dispatch(array $seg): void
{
    $a = $seg[0] ?? '';
    $b = $seg[1] ?? null;
    $n = count($seg);

    if ($n === 0) { site_home(); return; }
    if ($n === 1) {
        switch ($a) {
            case 'evren': site_univers(); return;
            case 'projeler': site_projects_index(); return;
            case 'gunce': site_chronicles(); return;
            case 'koleksiyonlar': site_collections(); return;
            case 'mobilya': site_section('mobilya'); return;
            case 'butik': site_section('butik'); return;
            case 'tasarim-hizmeti': site_design_service(); return;
            case 'iletisim': site_contact(); return;
            case 'arama': site_search(); return;
            case 'istek-listesi': site_wishlist(); return;
            case 'bulten': site_newsletter(); return;
            case 'sitemap.xml': site_sitemap(); return;
            case 'basin': case 'oduller': case 'kariyer': case 'kvkk':
            case 'yasal-bildirim': case 'satis-kosullari': case 'cerez-politikasi':
                site_page($a); return;
        }
    }
    if ($n === 2 && $b !== '') {
        switch ($a) {
            case 'projeler': site_project_category($b); return;
            case 'proje': site_project($b); return;
            case 'gunce': site_chronicle($b); return;
            case 'koleksiyon': site_collection($b); return;
            case 'urunler': site_product_type($b); return;
            case 'urun': site_product($b); return;
            case 'adres': site_showroom($b); return;
        }
    }
    not_found();
}

/* ---------------- Ortak veri (menü, alt bilgi) ---------------- */

function nav_data(): array
{
    static $d = null;
    if ($d !== null) return $d;
    $types = rows('SELECT * FROM product_types WHERE published = 1 ORDER BY sort, id');
    $group = function (string $section) use ($types) {
        $g = [];
        foreach ($types as $t) if ($t['section'] === $section) $g[$t['group_name']][] = $t;
        return $g;
    };
    $d = [
        'categories' => rows('SELECT * FROM project_categories WHERE published = 1 ORDER BY sort, id'),
        'showrooms' => rows('SELECT * FROM showrooms WHERE published = 1 ORDER BY sort, id'),
        'collections' => rows('SELECT * FROM collections WHERE published = 1 ORDER BY sort, id'),
        'mobilya' => $group('mobilya'),
        'butik' => $group('butik'),
    ];
    return $d;
}

function page_row(string $slug): array
{
    return row('SELECT * FROM pages WHERE slug = ?', [$slug]) ?? ['slug' => $slug, 'title' => '', 'subtitle' => '', 'body' => '', 'image' => ''];
}

function gallery_of(string $owner, int $id): array
{
    return rows('SELECT * FROM gallery WHERE owner = ? AND owner_id = ? ORDER BY sort, id', [$owner, $id]);
}

function product_rows(string $where = '1=1', array $params = [], string $limit = ''): array
{
    return rows("SELECT p.*, t.name AS type_name, t.slug AS type_slug FROM products p
        LEFT JOIN product_types t ON t.id = p.type_id
        WHERE p.published = 1 AND $where ORDER BY p.sort, p.id $limit", $params);
}

/* ---------------- Sayfalar ---------------- */

function site_home(): void
{
    render('site/home', [
        'title' => '',
        'bodyClass' => 'is-home',
        'tiles' => array_slice(nav_data()['categories'], 0, 6),
        'showrooms' => nav_data()['showrooms'],
    ], 'site/layout');
}

function site_univers(): void
{
    $page = page_row('evren');
    render('site/univers', [
        'title' => $page['title'],
        'description' => excerpt($page['body']),
        'page' => $page,
        'slides' => rows("SELECT * FROM slides WHERE place = 'evren' AND active = 1 ORDER BY sort, id"),
        'art' => rows("SELECT * FROM slides WHERE place = 'evren-sanat' AND active = 1 ORDER BY sort, id"),
        'showrooms' => nav_data()['showrooms'],
    ], 'site/layout');
}

function site_projects_index(): void
{
    render('site/projects_index', ['title' => 'Projeler', 'categories' => nav_data()['categories']], 'site/layout');
}

function site_project_category(string $slug): void
{
    $cat = row('SELECT * FROM project_categories WHERE slug = ? AND published = 1', [$slug]);
    if (!$cat) not_found();
    render('site/project_category', [
        'title' => $cat['name'],
        'description' => excerpt($cat['intro']),
        'ogImage' => $cat['image'],
        'cat' => $cat,
        'projects' => rows('SELECT * FROM projects WHERE category_id = ? AND published = 1 ORDER BY sort, id', [$cat['id']]),
    ], 'site/layout');
}

function site_project(string $slug): void
{
    $p = row('SELECT p.*, c.name AS category, c.slug AS category_slug FROM projects p
        LEFT JOIN project_categories c ON c.id = p.category_id WHERE p.slug = ? AND p.published = 1', [$slug]);
    if (!$p) not_found();
    $others = $p['category_id'] ? rows('SELECT * FROM projects WHERE category_id = ? AND id != ? AND published = 1 ORDER BY sort, id LIMIT 2', [$p['category_id'], $p['id']]) : [];
    render('site/project', [
        'title' => $p['seo_title'] ?: $p['title'],
        'description' => $p['seo_description'] ?: excerpt($p['intro']),
        'ogImage' => $p['cover'],
        'p' => $p,
        'images' => gallery_of('project', (int) $p['id']),
        'others' => $others,
    ], 'site/layout');
}

function site_chronicles(): void
{
    render('site/chronicles', [
        'title' => 'Günce',
        'items' => rows('SELECT * FROM chronicles WHERE published = 1 ORDER BY sort, id DESC'),
    ], 'site/layout');
}

function site_chronicle(string $slug): void
{
    $c = row('SELECT * FROM chronicles WHERE slug = ? AND published = 1', [$slug]);
    if (!$c) not_found();
    render('site/chronicle', [
        'title' => $c['title'],
        'description' => $c['excerpt'],
        'ogImage' => $c['image'],
        'c' => $c,
        'images' => gallery_of('chronicle', (int) $c['id']),
        'more' => rows('SELECT * FROM chronicles WHERE published = 1 AND id != ? ORDER BY sort, id DESC LIMIT 3', [$c['id']]),
    ], 'site/layout');
}

function site_collections(): void
{
    $cols = nav_data()['collections'];
    foreach ($cols as &$c) $c['products'] = product_rows('p.collection_id = ?', [$c['id']], 'LIMIT 4');
    render('site/collections', ['title' => 'Koleksiyonlar', 'collections' => $cols], 'site/layout');
}

function site_collection(string $slug): void
{
    $c = row('SELECT * FROM collections WHERE slug = ? AND published = 1', [$slug]);
    if (!$c) not_found();
    render('site/product_list', [
        'title' => $c['name'],
        'description' => excerpt($c['description']),
        'hero' => $c['image'],
        'eyebrow' => $c['label'] ?: 'Koleksiyon',
        'heading' => $c['name'],
        'intro' => $c['description'],
        'products' => product_rows('p.collection_id = ?', [$c['id']]),
    ], 'site/layout');
}

function site_section(string $section): void
{
    $types = rows('SELECT t.*, (SELECT COUNT(*) FROM products p WHERE p.type_id = t.id AND p.published = 1) AS n
        FROM product_types t WHERE t.section = ? AND t.published = 1 ORDER BY t.sort, t.id', [$section]);
    render('site/section', [
        'title' => $section === 'mobilya' ? 'Mobilya' : 'Butik',
        'section' => $section,
        'types' => $types,
    ], 'site/layout');
}

function site_product_type(string $slug): void
{
    $t = row('SELECT * FROM product_types WHERE slug = ? AND published = 1', [$slug]);
    if (!$t) not_found();
    render('site/product_list', [
        'title' => $t['name'],
        'description' => excerpt($t['intro']),
        'hero' => $t['image'],
        'eyebrow' => $t['group_name'],
        'heading' => $t['name'],
        'intro' => $t['intro'],
        'products' => product_rows('p.type_id = ?', [$t['id']]),
    ], 'site/layout');
}

function site_product(string $slug): void
{
    $p = row('SELECT p.*, t.name AS type_name, t.slug AS type_slug, c.name AS collection_name, c.slug AS collection_slug
        FROM products p LEFT JOIN product_types t ON t.id = p.type_id LEFT JOIN collections c ON c.id = p.collection_id
        WHERE p.slug = ? AND p.published = 1', [$slug]);
    if (!$p) not_found();
    $related = $p['type_id'] ? product_rows('p.type_id = ? AND p.id != ?', [$p['type_id'], $p['id']], 'LIMIT 4') : [];
    if (count($related) < 4 && $p['collection_id']) {
        $ids = array_column($related, 'id');
        foreach (product_rows('p.collection_id = ? AND p.id != ?', [$p['collection_id'], $p['id']], 'LIMIT 6') as $r) {
            if (count($related) >= 4) break;
            if (!in_array($r['id'], $ids)) $related[] = $r;
        }
    }
    render('site/product', [
        'title' => $p['name'] . ($p['type_name'] ? ' — ' . $p['type_name'] : ''),
        'description' => excerpt($p['description']),
        'ogImage' => $p['cover'],
        'p' => $p,
        'images' => array_merge([['path' => $p['cover'], 'caption' => '']], gallery_of('product', (int) $p['id'])),
        'related' => $related,
        'form' => form_handle('urun', $p['name'] . ($p['type_name'] ? ' (' . $p['type_name'] . ')' : '')),
    ], 'site/layout');
}

function site_showroom(string $slug): void
{
    $s = row('SELECT * FROM showrooms WHERE slug = ? AND published = 1', [$slug]);
    if (!$s) not_found();
    $g = gallery_of('showroom', (int) $s['id']);
    render('site/showroom', [
        'title' => $s['name'],
        'description' => excerpt($s['intro']),
        'ogImage' => $s['image'],
        's' => $s,
        'images' => $g ?: [['path' => $s['image']]],
        'form' => form_handle('showroom', $s['name']),
    ], 'site/layout');
}

function site_design_service(): void
{
    $page = page_row('tasarim-hizmeti');
    $steps = [];
    foreach (preg_split('/\R/', setting('design_steps')) as $line) {
        if (!str_contains($line, '|')) continue;
        [$t, $d] = array_map('trim', explode('|', $line, 2));
        $steps[] = ['title' => $t, 'text' => $d];
    }
    render('site/design_service', [
        'title' => $page['title'],
        'description' => excerpt($page['body']),
        'page' => $page,
        'steps' => $steps,
        'images' => gallery_of('page-tasarim-hizmeti', 0),
        'form' => form_handle('proje', 'Tasarım hizmeti'),
    ], 'site/layout');
}

function site_contact(): void
{
    $page = page_row('iletisim');
    render('site/contact', [
        'title' => $page['title'],
        'page' => $page,
        'showrooms' => nav_data()['showrooms'],
        'form' => form_handle('iletisim', 'İletişim'),
    ], 'site/layout');
}

function site_page(string $slug): void
{
    $page = page_row($slug);
    if ($page['title'] === '') not_found();
    render('site/page', ['title' => $page['title'], 'description' => excerpt($page['body']), 'page' => $page], 'site/layout');
}

function site_search(): void
{
    $qs = trim(mb_substr((string) ($_GET['q'] ?? ''), 0, 80));
    $res = ['projects' => [], 'products' => [], 'chronicles' => []];
    if (mb_strlen($qs) >= 2) {
        $like = '%' . $qs . '%';
        $res['projects'] = rows('SELECT * FROM projects WHERE published = 1 AND (title LIKE ? OR location LIKE ? OR intro LIKE ?) ORDER BY sort LIMIT 12', [$like, $like, $like]);
        $res['products'] = product_rows('(p.name LIKE ? OR t.name LIKE ? OR p.description LIKE ?)', [$like, $like, $like], 'LIMIT 12');
        $res['chronicles'] = rows('SELECT * FROM chronicles WHERE published = 1 AND (title LIKE ? OR excerpt LIKE ?) ORDER BY sort LIMIT 6', [$like, $like]);
    }
    render('site/search', ['title' => 'Arama', 'qs' => $qs, 'res' => $res], 'site/layout');
}

function site_wishlist(): void
{
    $ids = array_slice(array_filter(array_map('intval', explode(',', (string) ($_GET['ids'] ?? '')))), 0, 60);
    $items = $ids ? product_rows('p.id IN (' . implode(',', $ids) . ')') : [];
    if (isset($_GET['partial'])) {
        echo view('site/_product_grid', ['products' => $items, 'empty' => 'İstek listeniz boş. Ürün sayfalarındaki kalp simgesiyle parça ekleyebilirsiniz.']);
        return;
    }
    render('site/wishlist', ['title' => 'İstek Listesi'], 'site/layout');
}

function site_newsletter(): void
{
    if (!is_post()) redirect('/');
    csrf_check();
    $email = strtolower(post('email'));
    $back = (string) ($_SERVER['HTTP_REFERER'] ?? '/');
    $back = parse_url($back, PHP_URL_PATH) ?: '/';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || post('website') !== '') {
        redirect($back . '?bulten=hata#bulten');
    }
    q('INSERT OR IGNORE INTO newsletter(email, ip) VALUES(?, ?)', [$email, client_ip()]);
    redirect($back . '?bulten=ok#bulten');
}

/**
 * Ortak form işleyici (iletişim, proje talebi, showroom ziyareti, ürün bilgisi).
 * Mesajlar panele kaydedilir ve bildirim e-postası gönderilir.
 */
function form_handle(string $type, string $context): array
{
    start_session();
    $state = ['errors' => [], 'old' => [], 'sent' => isset($_GET['gonderildi'])];
    $fields = ['name', 'surname', 'email', 'phone', 'city', 'body', 'date'];
    foreach ($fields as $f) $state['old'][$f] = '';

    if (is_post() && post('_form') === $type) {
        csrf_check();
        foreach ($fields as $f) $state['old'][$f] = mb_substr(post($f), 0, $f === 'body' ? 5000 : 200);
        $o = $state['old'];
        $tooFast = time() - (int) ($_SESSION['form_t'] ?? 0) < 3;
        $self = strtok($_SERVER['REQUEST_URI'] ?? '/', '?');
        if (post('website') !== '' || $tooFast) redirect($self . '?gonderildi=1#form');

        if ($o['name'] === '') $state['errors']['name'] = 'Adınızı yazın.';
        if (!filter_var($o['email'], FILTER_VALIDATE_EMAIL)) $state['errors']['email'] = 'Geçerli bir e-posta adresi yazın.';
        if ($type !== 'showroom' && mb_strlen($o['body']) < 5) $state['errors']['body'] = 'Mesajınızı yazın.';
        if (empty($_POST['kvkk'])) $state['errors']['kvkk'] = 'Devam etmek için aydınlatma metnini onaylayın.';
        $recent = (int) val("SELECT COUNT(*) FROM messages WHERE ip = ? AND created_at > datetime('now', '-1 hour')", [client_ip()]);
        if ($recent >= 6) $state['errors']['form'] = 'Kısa sürede çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin.';

        if (!$state['errors']) {
            $name = trim($o['name'] . ' ' . $o['surname']);
            $meta = array_filter(['Şehir / ülke' => $o['city'], 'Tarih' => $o['date']]);
            $metaText = implode("\n", array_map(fn($k, $v) => "$k: $v", array_keys($meta), $meta));
            $body = $o['body'] !== '' ? $o['body'] : '(Ziyaret talebi)';
            q('INSERT INTO messages(name, email, phone, subject, body, ip, type, meta) VALUES(?,?,?,?,?,?,?,?)',
                [$name, $o['email'], $o['phone'], $context, $body, client_ip(), $type, $metaText]);
            send_mail(
                setting('notify_email', setting('contact_email')),
                'Web sitesi — ' . $context . ': ' . $name,
                "Ad: $name\nE-posta: {$o['email']}\nTelefon: {$o['phone']}\nKonu: $context\n$metaText\n\n$body\n",
                $o['email']
            );
            redirect($self . '?gonderildi=1#form');
        }
    }
    $_SESSION['form_t'] = time();
    return $state;
}

function site_sitemap(): void
{
    $base = rtrim((string) cfg('base_url'), '/');
    header('Content-Type: application/xml; charset=UTF-8');
    $urls = ['/', '/evren', '/projeler', '/gunce', '/koleksiyonlar', '/mobilya', '/butik', '/tasarim-hizmeti', '/iletisim'];
    foreach (nav_data()['categories'] as $c) $urls[] = '/projeler/' . $c['slug'];
    foreach (rows('SELECT slug FROM projects WHERE published = 1') as $p) $urls[] = '/proje/' . $p['slug'];
    foreach (rows('SELECT slug FROM chronicles WHERE published = 1') as $p) $urls[] = '/gunce/' . $p['slug'];
    foreach (nav_data()['collections'] as $p) $urls[] = '/koleksiyon/' . $p['slug'];
    foreach (rows('SELECT slug FROM product_types WHERE published = 1') as $p) $urls[] = '/urunler/' . $p['slug'];
    foreach (rows('SELECT slug FROM products WHERE published = 1') as $p) $urls[] = '/urun/' . $p['slug'];
    foreach (nav_data()['showrooms'] as $p) $urls[] = '/adres/' . $p['slug'];
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as $u) echo '  <url><loc>' . e($base . $u) . "</loc></url>\n";
    echo "</urlset>\n";
}
