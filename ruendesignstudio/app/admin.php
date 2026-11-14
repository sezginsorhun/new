<?php
/**
 * Yönetim paneli. Yalnızca config.php'deki gizli adresten açılır.
 * Her POST isteği CSRF belirteci ile doğrulanır.
 */
declare(strict_types=1);

require APP . '/icons.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');

function admin_dispatch(array $seg): void
{
    start_session();
    $page = $seg[0] ?? '';
    $id = $seg[1] ?? null;

    if ($page === 'giris') { admin_login(); return; }

    $user = current_admin();
    if (!$user) redirect(admin_url('giris'));

    if (is_post()) csrf_check();

    $routes = [
        '' => 'admin_dashboard',
        'cikis' => 'admin_logout',
        'projeler' => 'admin_projects',
        'kategoriler' => 'admin_categories',
        'anasayfa' => 'admin_home',
        'sayfalar' => 'admin_pages',
        'basin' => 'admin_press',
        'medya' => 'admin_media',
        'mesajlar' => 'admin_messages',
        'ayarlar' => 'admin_settings',
        'hesabim' => 'admin_account',
        'guvenlik' => 'admin_security',
    ];
    if (!isset($routes[$page])) {
        http_response_code(404);
        admin_render('admin/notfound', ['title' => 'Bulunamadı'], $user);
        return;
    }
    $routes[$page]($user, $id);
}

function admin_render(string $view, array $vars, array $user): void
{
    $vars['user'] = $user;
    $vars['flashes'] = take_flash();
    $vars['unread'] = (int) val('SELECT COUNT(*) FROM messages WHERE is_read = 0');
    render($view, $vars, 'admin/layout');
}

/* ------------------------------------------------------------------ */

function admin_login(): void
{
    if (current_admin()) redirect(admin_url());
    $error = '';
    $email = '';
    if (is_post()) {
        csrf_check();
        $email = strtolower(post('email'));
        $password = (string) ($_POST['password'] ?? '');
        if (login_locked()) {
            $error = 'Çok fazla hatalı deneme yapıldı. 15 dakika sonra tekrar deneyin.';
        } else {
            $u = row('SELECT * FROM users WHERE email = ?', [$email]);
            // Kullanıcı yoksa da hash doğrulaması yapılır; süre farkından hesap varlığı anlaşılmasın
            $ok = password_verify($password, $u['password_hash'] ?? '$2y$10$abcdefghijklmnopqrstuuGQ0rI0JcI0r7oG7WqfJyP4fOZLz5H8a');
            q('INSERT INTO login_attempts(ip, email, success) VALUES(?,?,?)', [client_ip(), mb_substr($email, 0, 190), $ok && $u ? 1 : 0]);
            if ($ok && $u) {
                if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) {
                    q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $u['id']]);
                    $u = row('SELECT * FROM users WHERE id = ?', [$u['id']]);
                }
                login_admin($u);
                redirect(admin_url());
            }
            $error = 'E-posta veya şifre hatalı.';
            usleep(400000);
        }
    }
    render('admin/login', ['error' => $error, 'email' => $email]);
}

function admin_logout(array $user): void
{
    if (is_post()) logout_admin();
    redirect(admin_url('giris'));
}

function admin_dashboard(array $user): void
{
    admin_render('admin/dashboard', [
        'title' => 'Panel',
        'stats' => [
            'projects' => (int) val('SELECT COUNT(*) FROM projects'),
            'published' => (int) val('SELECT COUNT(*) FROM projects WHERE published = 1'),
            'messages' => (int) val('SELECT COUNT(*) FROM messages'),
            'unread' => (int) val('SELECT COUNT(*) FROM messages WHERE is_read = 0'),
            'media' => (int) val('SELECT COUNT(*) FROM media'),
            'press' => (int) val('SELECT COUNT(*) FROM press'),
        ],
        'recentMessages' => rows('SELECT * FROM messages ORDER BY id DESC LIMIT 6'),
        'recentProjects' => rows('SELECT p.*, c.name AS category FROM projects p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.updated_at DESC LIMIT 6'),
        'noCover' => (int) val("SELECT COUNT(*) FROM projects WHERE cover = ''"),
    ], $user);
}

/* ---------------- Projeler ---------------- */

function admin_projects(array $user, ?string $id): void
{
    if ($id === null) {
        if (is_post() && post('action') === 'reorder') {
            foreach ((array) ($_POST['sort'] ?? []) as $pid => $s) q('UPDATE projects SET sort = ? WHERE id = ?', [(int) $s, (int) $pid]);
            flash('ok', 'Sıralama kaydedildi.');
            redirect(admin_url('projeler'));
        }
        $where = '1=1';
        $params = [];
        $search = trim((string) ($_GET['q'] ?? ''));
        $cat = (int) ($_GET['kategori'] ?? 0);
        if ($search !== '') { $where .= ' AND (p.title LIKE ? OR p.location LIKE ?)'; $params[] = "%$search%"; $params[] = "%$search%"; }
        if ($cat) { $where .= ' AND p.category_id = ?'; $params[] = $cat; }
        admin_render('admin/projects', [
            'title' => 'Projeler',
            'projects' => rows("SELECT p.*, c.name AS category, (SELECT COUNT(*) FROM project_images i WHERE i.project_id = p.id) AS image_count
                FROM projects p LEFT JOIN categories c ON c.id = p.category_id WHERE $where ORDER BY p.sort, p.id DESC", $params),
            'categories' => rows('SELECT * FROM categories ORDER BY sort, name'),
            'search' => $search,
            'cat' => $cat,
        ], $user);
        return;
    }

    $project = null;
    if ($id !== 'yeni') {
        $project = row('SELECT * FROM projects WHERE id = ?', [(int) $id]);
        if (!$project) { flash('error', 'Proje bulunamadı.'); redirect(admin_url('projeler')); }
    }

    if (is_post()) {
        $action = post('action', 'save');
        if ($action === 'delete' && $project) {
            q('DELETE FROM projects WHERE id = ?', [$project['id']]);
            flash('ok', '“' . $project['title'] . '” silindi.');
            redirect(admin_url('projeler'));
        }
        if ($action === 'delete_image' && $project) {
            q('DELETE FROM project_images WHERE id = ? AND project_id = ?', [(int) post('image_id'), $project['id']]);
            flash('ok', 'Görsel galeriden kaldırıldı.');
            redirect(admin_url('projeler/' . $project['id'] . '#galeri'));
        }

        $data = [
            'title' => mb_substr(post('title'), 0, 160),
            'category_id' => (int) post('category_id') ?: null,
            'location' => mb_substr(post('location'), 0, 160),
            'year' => mb_substr(post('year'), 0, 20),
            'area' => mb_substr(post('area'), 0, 60),
            'summary' => mb_substr(post('summary'), 0, 400),
            'body' => mb_substr(post('body'), 0, 20000),
            'featured' => isset($_POST['featured']) ? 1 : 0,
            'published' => isset($_POST['published']) ? 1 : 0,
            'sort' => (int) post('sort', '0'),
            'seo_title' => mb_substr(post('seo_title'), 0, 160),
            'seo_description' => mb_substr(post('seo_description'), 0, 300),
        ];
        if ($data['title'] === '') {
            flash('error', 'Proje adı boş olamaz.');
            redirect(admin_url('projeler/' . ($project['id'] ?? 'yeni')));
        }
        $slugInput = post('slug') ?: $data['title'];
        $data['slug'] = unique_slug('projects', $slugInput, $project['id'] ?? null);

        $err = null;
        $cover = upload_field('cover_file', $err);
        if ($err) flash('error', 'Kapak: ' . $err);
        // Öncelik: yeni yükleme > kaldır işareti > kütüphaneden seçilen > mevcut kapak
        $data['cover'] = $cover ?? (post('cover_clear') ? '' : (valid_media_path(post('cover')) ?: ($project['cover'] ?? '')));

        if ($project) {
            $sets = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            q("UPDATE projects SET $sets, updated_at = CURRENT_TIMESTAMP WHERE id = :id", $data + ['id' => $project['id']]);
            $pid = (int) $project['id'];
        } else {
            $cols = implode(', ', array_keys($data));
            $ph = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            q("INSERT INTO projects($cols) VALUES($ph)", $data);
            $pid = (int) db()->lastInsertId();
        }

        // Galeri: yeni yüklemeler, kütüphaneden seçilenler, açıklama ve sıra
        $errors = [];
        $max = (int) val('SELECT COALESCE(MAX(sort), 0) FROM project_images WHERE project_id = ?', [$pid]);
        foreach (upload_many('gallery_files', $errors) as $path) q('INSERT INTO project_images(project_id, path, sort) VALUES(?,?,?)', [$pid, $path, ++$max]);
        foreach (array_filter(explode(',', post('gallery_pick'))) as $path) {
            if ($p = valid_media_path($path)) q('INSERT INTO project_images(project_id, path, sort) VALUES(?,?,?)', [$pid, $p, ++$max]);
        }
        foreach ((array) ($_POST['img'] ?? []) as $iid => $im) {
            q('UPDATE project_images SET caption = ?, sort = ? WHERE id = ? AND project_id = ?',
                [mb_substr(trim((string) ($im['caption'] ?? '')), 0, 200), (int) ($im['sort'] ?? 0), (int) $iid, $pid]);
        }
        foreach ($errors as $e) flash('error', $e);
        flash('ok', 'Proje kaydedildi.');
        redirect(admin_url('projeler/' . $pid));
    }

    admin_render('admin/project_form', [
        'title' => $project ? $project['title'] : 'Yeni proje',
        'p' => $project ?? ['id' => null, 'title' => '', 'slug' => '', 'category_id' => null, 'location' => '', 'year' => date('Y'), 'area' => '',
            'summary' => '', 'body' => '', 'cover' => '', 'featured' => 0, 'published' => 1, 'sort' => 0, 'seo_title' => '', 'seo_description' => ''],
        'images' => $project ? rows('SELECT * FROM project_images WHERE project_id = ? ORDER BY sort, id', [$project['id']]) : [],
        'categories' => rows('SELECT * FROM categories ORDER BY sort, name'),
    ], $user);
}

/* ---------------- Kategoriler ---------------- */

function admin_categories(array $user): void
{
    if (is_post()) {
        $action = post('action');
        if ($action === 'add' && post('name') !== '') {
            q('INSERT INTO categories(name, slug, sort) VALUES(?,?,?)', [mb_substr(post('name'), 0, 80), unique_slug('categories', post('name')), (int) post('sort')]);
            flash('ok', 'Kategori eklendi.');
        } elseif ($action === 'save') {
            foreach ((array) ($_POST['cat'] ?? []) as $cid => $c) {
                $name = mb_substr(trim((string) ($c['name'] ?? '')), 0, 80);
                if ($name === '') continue;
                $slug = unique_slug('categories', trim((string) ($c['slug'] ?? '')) ?: $name, (int) $cid);
                q('UPDATE categories SET name = ?, slug = ?, sort = ? WHERE id = ?', [$name, $slug, (int) ($c['sort'] ?? 0), (int) $cid]);
            }
            flash('ok', 'Kategoriler kaydedildi.');
        } elseif ($action === 'delete') {
            q('DELETE FROM categories WHERE id = ?', [(int) post('id')]);
            flash('ok', 'Kategori silindi; projeleri kategorisiz kaldı.');
        }
        redirect(admin_url('kategoriler'));
    }
    admin_render('admin/categories', [
        'title' => 'Kategoriler',
        'categories' => rows('SELECT c.*, (SELECT COUNT(*) FROM projects p WHERE p.category_id = c.id) AS n FROM categories c ORDER BY c.sort, c.name'),
    ], $user);
}

/* ---------------- Ana sayfa ---------------- */

function admin_home(array $user): void
{
    if (is_post()) {
        $action = post('action');
        if ($action === 'texts') {
            foreach (['tagline', 'intro_title', 'intro_text', 'home_featured_title', 'slide_interval'] as $k) save_setting($k, mb_substr(post($k), 0, 4000));
            flash('ok', 'Ana sayfa metinleri kaydedildi.');
        } elseif ($action === 'add_slide') {
            $err = null;
            $image = upload_field('image_file', $err) ?? valid_media_path(post('image'));
            if ($err) flash('error', $err);
            if ($image) {
                $max = (int) val('SELECT COALESCE(MAX(sort), 0) FROM slides');
                q('INSERT INTO slides(image, title, subtitle, link, sort) VALUES(?,?,?,?,?)',
                    [$image, mb_substr(post('title'), 0, 120), mb_substr(post('subtitle'), 0, 120), admin_clean_link(post('link')), $max + 1]);
                flash('ok', 'Görsel eklendi.');
            } elseif (!$err) {
                flash('error', 'Bir görsel yükleyin ya da kütüphaneden seçin.');
            }
        } elseif ($action === 'save_slides') {
            foreach ((array) ($_POST['slide'] ?? []) as $sid => $s) {
                $sets = [
                    mb_substr(trim((string) ($s['title'] ?? '')), 0, 120),
                    mb_substr(trim((string) ($s['subtitle'] ?? '')), 0, 120),
                    admin_clean_link((string) ($s['link'] ?? '')),
                    (int) ($s['sort'] ?? 0),
                    !empty($s['active']) ? 1 : 0,
                ];
                q('UPDATE slides SET title = ?, subtitle = ?, link = ?, sort = ?, active = ? WHERE id = ?', [...$sets, (int) $sid]);
                $img = valid_media_path((string) ($s['image'] ?? ''));
                if ($img) q('UPDATE slides SET image = ? WHERE id = ?', [$img, (int) $sid]);
            }
            flash('ok', 'Görseller kaydedildi.');
        } elseif ($action === 'delete_slide') {
            q('DELETE FROM slides WHERE id = ?', [(int) post('id')]);
            flash('ok', 'Görsel kaldırıldı.');
        }
        redirect(admin_url('anasayfa'));
    }
    admin_render('admin/home', [
        'title' => 'Ana Sayfa',
        'slides' => rows('SELECT * FROM slides ORDER BY sort, id'),
        'projects' => rows('SELECT title, slug FROM projects ORDER BY title'),
    ], $user);
}

/** Bağlantılar yalnızca site içi yol ya da http(s) olabilir (javascript: vb. engellenir). */
function admin_clean_link(string $link): string
{
    $link = trim($link);
    if ($link === '') return '';
    if (str_starts_with($link, '/') && !str_starts_with($link, '//')) return mb_substr($link, 0, 300);
    if (preg_match('~^https?://~i', $link)) return mb_substr($link, 0, 300);
    return '';
}

/* ---------------- Sayfalar ---------------- */

function admin_pages(array $user, ?string $slug): void
{
    if ($slug === null) {
        admin_render('admin/pages', ['title' => 'Sayfalar', 'pages' => rows('SELECT * FROM pages ORDER BY slug DESC')], $user);
        return;
    }
    $page = row('SELECT * FROM pages WHERE slug = ?', [$slug]);
    if (!$page) { flash('error', 'Sayfa bulunamadı.'); redirect(admin_url('sayfalar')); }
    if (is_post()) {
        $err = null;
        $image = upload_field('image_file', $err) ?? (post('image_clear') ? '' : (valid_media_path(post('image')) ?: $page['image']));
        if ($err) flash('error', $err);
        q('UPDATE pages SET title = ?, body = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?',
            [mb_substr(post('title'), 0, 160) ?: $page['title'], mb_substr(post('body'), 0, 30000), $image, $slug]);
        flash('ok', 'Sayfa kaydedildi.');
        redirect(admin_url('sayfalar/' . $slug));
    }
    admin_render('admin/page_form', ['title' => $page['title'], 'page' => $page], $user);
}

/* ---------------- Basın ---------------- */

function admin_press(array $user): void
{
    if (is_post()) {
        $action = post('action');
        if ($action === 'add') {
            if (post('publication') === '') {
                flash('error', 'Yayın adı zorunlu.');
            } else {
                $err = null;
                $image = upload_field('image_file', $err) ?? valid_media_path(post('image'));
                if ($err) flash('error', $err);
                $max = (int) val('SELECT COALESCE(MAX(sort), 0) FROM press');
                q('INSERT INTO press(publication, title, issue, image, link, sort) VALUES(?,?,?,?,?,?)',
                    [mb_substr(post('publication'), 0, 120), mb_substr(post('title'), 0, 200), mb_substr(post('issue'), 0, 80), (string) $image, admin_clean_link(post('link')), $max + 1]);
                flash('ok', 'Yayın eklendi.');
            }
        } elseif ($action === 'save') {
            foreach ((array) ($_POST['item'] ?? []) as $pid => $it) {
                q('UPDATE press SET publication = ?, title = ?, issue = ?, link = ?, sort = ?, published = ? WHERE id = ?', [
                    mb_substr(trim((string) ($it['publication'] ?? '')), 0, 120) ?: '—',
                    mb_substr(trim((string) ($it['title'] ?? '')), 0, 200),
                    mb_substr(trim((string) ($it['issue'] ?? '')), 0, 80),
                    admin_clean_link((string) ($it['link'] ?? '')),
                    (int) ($it['sort'] ?? 0),
                    !empty($it['published']) ? 1 : 0,
                    (int) $pid,
                ]);
                $img = valid_media_path((string) ($it['image'] ?? ''));
                if ($img) q('UPDATE press SET image = ? WHERE id = ?', [$img, (int) $pid]);
            }
            flash('ok', 'Basın listesi kaydedildi.');
        } elseif ($action === 'delete') {
            q('DELETE FROM press WHERE id = ?', [(int) post('id')]);
            flash('ok', 'Yayın silindi.');
        }
        redirect(admin_url('basin'));
    }
    admin_render('admin/press', ['title' => 'Basın', 'items' => rows('SELECT * FROM press ORDER BY sort, id DESC')], $user);
}

/* ---------------- Medya ---------------- */

function admin_media(array $user, ?string $sub): void
{
    if ($sub === 'liste.json') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(rows('SELECT id, path, original_name, width, height FROM media ORDER BY id DESC LIMIT 500'), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return;
    }
    if (is_post()) {
        if (post('action') === 'upload') {
            $errors = [];
            $n = count(upload_many('files', $errors));
            foreach ($errors as $e) flash('error', $e);
            if ($n) flash('ok', "$n görsel yüklendi.");
            if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
                header('Content-Type: application/json');
                echo json_encode(['ok' => $n > 0, 'errors' => $errors, 'items' => rows('SELECT id, path, original_name, width, height FROM media ORDER BY id DESC LIMIT ' . max(1, $n))]);
                take_flash();
                return;
            }
        } elseif (post('action') === 'delete') {
            $m = row('SELECT * FROM media WHERE id = ?', [(int) post('id')]);
            if ($m) {
                $used = (int) val('SELECT (SELECT COUNT(*) FROM projects WHERE cover = :p) + (SELECT COUNT(*) FROM project_images WHERE path = :p)
                    + (SELECT COUNT(*) FROM slides WHERE image = :p) + (SELECT COUNT(*) FROM press WHERE image = :p) + (SELECT COUNT(*) FROM pages WHERE image = :p)', ['p' => $m['path']]);
                if ($used) {
                    flash('error', 'Bu görsel sitede kullanılıyor; önce kullanıldığı yerden kaldırın.');
                } else {
                    q('DELETE FROM media WHERE id = ?', [$m['id']]);
                    if (valid_media_path($m['path'])) @unlink(ROOT . '/' . $m['path']);
                    flash('ok', 'Görsel silindi.');
                }
            }
        }
        redirect(admin_url('medya'));
    }
    admin_render('admin/media', ['title' => 'Medya', 'items' => rows('SELECT * FROM media ORDER BY id DESC')], $user);
}

/* ---------------- Mesajlar ---------------- */

function admin_messages(array $user, ?string $id): void
{
    if (is_post()) {
        $mid = (int) post('id');
        match (post('action')) {
            'read' => q('UPDATE messages SET is_read = 1 WHERE id = ?', [$mid]),
            'unread' => q('UPDATE messages SET is_read = 0 WHERE id = ?', [$mid]),
            'delete' => q('DELETE FROM messages WHERE id = ?', [$mid]),
            'read_all' => q('UPDATE messages SET is_read = 1'),
            default => null,
        };
        flash('ok', 'Güncellendi.');
        redirect(post('action') === 'delete' ? admin_url('mesajlar') : ($id ? admin_url('mesajlar/' . $id) : admin_url('mesajlar')));
    }
    if ($id !== null) {
        $m = row('SELECT * FROM messages WHERE id = ?', [(int) $id]);
        if (!$m) redirect(admin_url('mesajlar'));
        if (!$m['is_read']) q('UPDATE messages SET is_read = 1 WHERE id = ?', [$m['id']]);
        admin_render('admin/message', ['title' => 'Mesaj', 'm' => $m], $user);
        return;
    }
    $filter = $_GET['durum'] ?? '';
    $where = $filter === 'okunmamis' ? 'WHERE is_read = 0' : '';
    admin_render('admin/messages', ['title' => 'Mesajlar', 'messages' => rows("SELECT * FROM messages $where ORDER BY id DESC LIMIT 300"), 'filter' => $filter], $user);
}

/* ---------------- Ayarlar ---------------- */

const SETTING_FIELDS = [
    'site_name', 'logo_line1', 'logo_line2', 'footer_note',
    'contact_email', 'contact_phone', 'contact_address', 'contact_hours', 'map_url', 'notify_email',
    'instagram', 'pinterest', 'linkedin',
    'seo_title', 'seo_description',
];

function admin_settings(array $user): void
{
    if (is_post()) {
        foreach (SETTING_FIELDS as $k) {
            $v = mb_substr(post($k), 0, 2000);
            if (in_array($k, ['instagram', 'pinterest', 'linkedin', 'map_url'], true)) $v = admin_clean_link($v);
            save_setting($k, $v);
        }
        flash('ok', 'Ayarlar kaydedildi.');
        redirect(admin_url('ayarlar'));
    }
    admin_render('admin/settings', ['title' => 'Ayarlar', 's' => settings()], $user);
}

/* ---------------- Hesabım ---------------- */

function admin_account(array $user): void
{
    if (is_post()) {
        $action = post('action');
        if ($action === 'profile') {
            $email = strtolower(post('email'));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                flash('error', 'Geçerli bir e-posta yazın.');
            } elseif (row('SELECT id FROM users WHERE email = ? AND id != ?', [$email, $user['id']])) {
                flash('error', 'Bu e-posta başka bir hesapta kayıtlı.');
            } else {
                q('UPDATE users SET name = ?, email = ? WHERE id = ?', [mb_substr(post('name'), 0, 120), $email, $user['id']]);
                flash('ok', 'Bilgileriniz güncellendi.');
            }
        } elseif ($action === 'password') {
            $cur = (string) ($_POST['current'] ?? '');
            $new = (string) ($_POST['new'] ?? '');
            if (!password_verify($cur, $user['password_hash'])) {
                flash('error', 'Mevcut şifre hatalı.');
            } elseif (strlen($new) < 10) {
                flash('error', 'Yeni şifre en az 10 karakter olmalı.');
            } elseif ($new !== (string) ($_POST['new2'] ?? '')) {
                flash('error', 'Yeni şifreler birbirini tutmuyor.');
            } else {
                q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), $user['id']]);
                login_admin(row('SELECT * FROM users WHERE id = ?', [$user['id']]));
                flash('ok', 'Şifreniz değiştirildi. Diğer cihazlardaki oturumlar kapandı.');
            }
        } elseif ($action === 'add_user') {
            $email = strtolower(post('email'));
            $pw = (string) ($_POST['password'] ?? '');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pw) < 10) {
                flash('error', 'Geçerli bir e-posta ve en az 10 karakterlik şifre girin.');
            } elseif (row('SELECT id FROM users WHERE email = ?', [$email])) {
                flash('error', 'Bu e-posta zaten kayıtlı.');
            } else {
                q('INSERT INTO users(email, name, password_hash) VALUES(?,?,?)', [$email, mb_substr(post('name'), 0, 120), password_hash($pw, PASSWORD_DEFAULT)]);
                flash('ok', 'Yönetici eklendi.');
            }
        } elseif ($action === 'delete_user') {
            $uid = (int) post('id');
            if ($uid === (int) $user['id']) flash('error', 'Kendi hesabınızı silemezsiniz.');
            else { q('DELETE FROM users WHERE id = ?', [$uid]); flash('ok', 'Yönetici silindi.'); }
        }
        redirect(admin_url('hesabim'));
    }
    admin_render('admin/account', ['title' => 'Hesabım', 'users' => rows('SELECT id, email, name, last_login_at, created_at FROM users ORDER BY id')], $user);
}

function admin_security(array $user): void
{
    admin_render('admin/security', [
        'title' => 'Güvenlik',
        'attempts' => rows('SELECT * FROM login_attempts ORDER BY id DESC LIMIT 100'),
        'failed24' => (int) val("SELECT COUNT(*) FROM login_attempts WHERE success = 0 AND created_at > datetime('now', '-1 day')"),
    ], $user);
}
