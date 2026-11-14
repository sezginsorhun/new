<?php
/**
 * Vitrin sayfaları.
 */
declare(strict_types=1);

function site_dispatch(array $seg): void
{
    $first = $seg[0] ?? '';
    $count = count($seg);

    switch (true) {
        case $count === 0:
            site_home();
            return;
        case $first === 'projeler' && $count === 1:
            site_projects(null);
            return;
        case $first === 'projeler' && $count === 2 && $seg[1] !== '':
            site_project($seg[1]);
            return;
        case $first === 'kategori' && $count === 2:
            site_projects($seg[1]);
            return;
        case $first === 'studyo' && $count === 1:
            site_page('studyo', 'site/studio');
            return;
        case $first === 'basin' && $count === 1:
            site_press();
            return;
        case $first === 'iletisim' && $count === 1:
            site_contact();
            return;
        case $first === 'kvkk' && $count === 1:
            site_page('kvkk', 'site/page');
            return;
        case $first === 'sitemap.xml':
            site_sitemap();
            return;
    }
    not_found();
}

function nav_categories(): array
{
    return rows('SELECT c.* FROM categories c WHERE EXISTS (SELECT 1 FROM projects p WHERE p.category_id = c.id AND p.published = 1) ORDER BY c.sort, c.name');
}

function site_home(): void
{
    $slides = rows('SELECT * FROM slides WHERE active = 1 ORDER BY sort, id');
    $featured = rows('SELECT p.*, c.name AS category FROM projects p LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.published = 1 AND p.featured = 1 ORDER BY p.sort, p.id DESC LIMIT 6');
    render('site/home', [
        'title' => '',
        'bodyClass' => 'is-home',
        'slides' => $slides,
        'featured' => $featured,
    ], 'site/layout');
}

function site_projects(?string $catSlug): void
{
    $category = null;
    $params = [];
    $where = 'p.published = 1';
    if ($catSlug !== null) {
        $category = row('SELECT * FROM categories WHERE slug = ?', [$catSlug]);
        if (!$category) not_found();
        $where .= ' AND p.category_id = ?';
        $params[] = $category['id'];
    }
    $projects = rows("SELECT p.*, c.name AS category, c.slug AS category_slug FROM projects p
        LEFT JOIN categories c ON c.id = p.category_id WHERE $where ORDER BY p.sort, p.id DESC", $params);
    render('site/projects', [
        'title' => $category ? $category['name'] : 'Projeler',
        'projects' => $projects,
        'category' => $category,
        'categories' => nav_categories(),
    ], 'site/layout');
}

function site_project(string $slug): void
{
    $p = row('SELECT p.*, c.name AS category, c.slug AS category_slug FROM projects p
        LEFT JOIN categories c ON c.id = p.category_id WHERE p.slug = ? AND p.published = 1', [$slug]);
    if (!$p) not_found();
    $images = rows('SELECT * FROM project_images WHERE project_id = ? ORDER BY sort, id', [$p['id']]);

    // Sıradaki proje (liste sırasına göre, sona gelince başa döner)
    $all = rows('SELECT id, title, slug, cover FROM projects WHERE published = 1 ORDER BY sort, id DESC');
    $next = null;
    foreach ($all as $i => $r) {
        if ((int) $r['id'] === (int) $p['id']) {
            $next = $all[($i + 1) % count($all)];
            break;
        }
    }
    if ($next && (int) $next['id'] === (int) $p['id']) $next = null;

    render('site/project', [
        'title' => $p['seo_title'] ?: $p['title'],
        'description' => $p['seo_description'] ?: $p['summary'],
        'ogImage' => $p['cover'],
        'p' => $p,
        'images' => $images,
        'next' => $next,
    ], 'site/layout');
}

function site_page(string $slug, string $view): void
{
    $page = row('SELECT * FROM pages WHERE slug = ?', [$slug]);
    if (!$page) not_found();
    render($view, [
        'title' => $page['title'],
        'description' => excerpt($page['body']),
        'page' => $page,
    ], 'site/layout');
}

function site_press(): void
{
    $items = rows('SELECT * FROM press WHERE published = 1 ORDER BY sort, id DESC');
    render('site/press', ['title' => 'Basın', 'items' => $items], 'site/layout');
}

function site_contact(): void
{
    start_session();
    $errors = [];
    $old = ['name' => '', 'email' => '', 'phone' => '', 'subject' => '', 'body' => ''];
    $sent = isset($_GET['gonderildi']);

    if (is_post()) {
        csrf_check();
        foreach ($old as $k => $_) $old[$k] = mb_substr(post($k), 0, $k === 'body' ? 5000 : 200);

        // Bot tuzağı ve çok hızlı gönderim kontrolü
        $tooFast = time() - (int) ($_SESSION['contact_t'] ?? 0) < 3;
        if (post('website') !== '' || $tooFast) {
            redirect(url('iletisim') . '?gonderildi=1#form');
        }
        if ($old['name'] === '') $errors['name'] = 'Adınızı yazın.';
        if (!filter_var($old['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Geçerli bir e-posta adresi yazın.';
        if (mb_strlen($old['body']) < 10) $errors['body'] = 'Mesajınız en az 10 karakter olmalı.';
        if (empty($_POST['kvkk'])) $errors['kvkk'] = 'Devam etmek için aydınlatma metnini onaylayın.';

        $recent = (int) val("SELECT COUNT(*) FROM messages WHERE ip = ? AND created_at > datetime('now', '-1 hour')", [client_ip()]);
        if ($recent >= 5) $errors['form'] = 'Kısa sürede çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin.';

        if (!$errors) {
            q('INSERT INTO messages(name, email, phone, subject, body, ip) VALUES(?,?,?,?,?,?)',
                [$old['name'], $old['email'], $old['phone'], $old['subject'], $old['body'], client_ip()]);
            send_mail(
                setting('notify_email', setting('contact_email')),
                'Web sitesinden yeni mesaj: ' . ($old['subject'] ?: $old['name']),
                "Ad: {$old['name']}\nE-posta: {$old['email']}\nTelefon: {$old['phone']}\nKonu: {$old['subject']}\n\n{$old['body']}\n",
                $old['email']
            );
            redirect(url('iletisim') . '?gonderildi=1#form');
        }
    }
    $_SESSION['contact_t'] = time();

    render('site/contact', [
        'title' => 'İletişim',
        'errors' => $errors,
        'old' => $old,
        'sent' => $sent,
    ], 'site/layout');
}

function site_sitemap(): void
{
    $base = rtrim((string) cfg('base_url'), '/');
    header('Content-Type: application/xml; charset=UTF-8');
    $urls = ['/', '/projeler', '/studyo', '/iletisim'];
    if (val('SELECT COUNT(*) FROM press WHERE published = 1')) $urls[] = '/basin';
    foreach (nav_categories() as $c) $urls[] = '/kategori/' . $c['slug'];
    foreach (rows('SELECT slug FROM projects WHERE published = 1') as $p) $urls[] = '/projeler/' . $p['slug'];
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as $u) echo '  <url><loc>' . e($base . $u) . "</loc></url>\n";
    echo "</urlset>\n";
}
