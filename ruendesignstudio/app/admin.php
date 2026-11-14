<?php
/**
 * Yönetim paneli. Yalnızca config.php'deki gizli adresten açılır.
 * Her POST isteği CSRF belirteci ile doğrulanır.
 */
declare(strict_types=1);

require APP . '/icons.php';
require APP . '/admin_entities.php';

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

    $special = [
        '' => 'admin_dashboard',
        'cikis' => 'admin_logout',
        'anasayfa' => 'admin_home',
        'medya' => 'admin_media',
        'mesajlar' => 'admin_messages',
        'bulten' => 'admin_newsletter',
        'ayarlar' => 'admin_settings',
        'hesabim' => 'admin_account',
        'guvenlik' => 'admin_security',
    ];
    if (isset($special[$page])) { $special[$page]($user, $id); return; }

    $defs = entity_defs();
    if (isset($defs[$page])) { admin_crud($user, $page, $defs[$page], $id); return; }

    http_response_code(404);
    admin_render('admin/notfound', ['title' => 'Bulunamadı'], $user);
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
    $count = fn(string $t, string $w = '1=1') => (int) val("SELECT COUNT(*) FROM $t WHERE $w");
    admin_render('admin/dashboard', [
        'title' => 'Panel',
        'stats' => [
            ['Proje', $count('projects'), $count('projects', 'published = 1') . ' yayında', 'folder', 'projeler'],
            ['Ürün', $count('products'), $count('collections') . ' koleksiyon', 'tag', 'urunler'],
            ['Mesaj', $count('messages'), $count('messages', 'is_read = 0') . ' okunmamış', 'mail', 'mesajlar'],
            ['Bülten', $count('newsletter'), 'abone', 'newspaper', 'bulten'],
        ],
        'recentMessages' => rows('SELECT * FROM messages ORDER BY id DESC LIMIT 6'),
        'recentProjects' => rows('SELECT p.*, c.name AS category FROM projects p LEFT JOIN project_categories c ON c.id = p.category_id ORDER BY p.updated_at DESC, p.id DESC LIMIT 6'),
        'demoImages' => (int) val("SELECT (SELECT COUNT(*) FROM projects WHERE cover LIKE 'assets/demo/%') + (SELECT COUNT(*) FROM products WHERE cover LIKE 'assets/demo/%')"),
    ], $user);
}

/* ---------------- Genel içerik ekranları ---------------- */

function rel_options(array $rel): array
{
    [$table, $col] = $rel;
    $out = [];
    $extra = $table === 'product_types' ? ', section, group_name' : '';
    foreach (rows("SELECT id, $col AS name$extra FROM $table ORDER BY " . ($table === 'product_types' ? 'section, sort, id' : 'sort, id')) as $r) {
        $out[$r['id']] = $table === 'product_types' ? ($r['section'] === 'butik' ? 'Butik' : 'Koleksiyon') . ' › ' . $r['group_name'] . ' › ' . $r['name'] : $r['name'];
    }
    return $out;
}

function admin_crud(array $user, string $slug, array $def, ?string $id): void
{
    $table = $def['table'];
    $key = $def['key'] ?? 'id';
    $fields = $def['fields'];

    // ---------- Liste ----------
    if ($id === null) {
        if (is_post() && post('action') === 'reorder' && isset($fields['sort'])) {
            foreach ((array) ($_POST['sort'] ?? []) as $rid => $s) q("UPDATE $table SET sort = ? WHERE $key = ?", [(int) $s, $rid]);
            flash('ok', 'Sıralama kaydedildi.');
            redirect(admin_url($slug));
        }
        $where = '1=1';
        $params = [];
        $search = trim((string) ($_GET['q'] ?? ''));
        if ($search !== '') { $where .= " AND {$def['label']} LIKE ?"; $params[] = "%$search%"; }
        $filter = $def['filter'] ?? null;
        $fval = $filter ? (int) ($_GET['f'] ?? 0) : 0;
        if ($filter && $fval) { $where .= " AND $filter = ?"; $params[] = $fval; }
        $items = rows("SELECT * FROM $table WHERE $where ORDER BY {$def['order']}", $params);

        $relMaps = [];
        foreach ($def['list'] as $col => $_) {
            if (($fields[$col]['type'] ?? '') === 'select') {
                $relMaps[$col] = isset($fields[$col]['rel']) ? rel_options($fields[$col]['rel']) : $fields[$col]['options'];
            }
        }
        admin_render('admin/crud_list', [
            'title' => $def['title'], 'slug' => $slug, 'def' => $def, 'items' => $items, 'relMaps' => $relMaps,
            'search' => $search, 'filterOptions' => $filter ? rel_options($fields[$filter]['rel']) : [], 'fval' => $fval,
        ], $user);
        return;
    }

    // ---------- Kayıt ----------
    $isNew = $id === 'yeni' && empty($def['fixed']);
    $item = $isNew ? null : row("SELECT * FROM $table WHERE $key = ?", [$id]);
    if (!$isNew && !$item) { flash('error', 'Kayıt bulunamadı.'); redirect(admin_url($slug)); }

    if (is_post()) {
        if (post('action') === 'delete' && $item && empty($def['fixed'])) {
            q("DELETE FROM $table WHERE $key = ?", [$item[$key]]);
            if (!empty($def['gallery'])) q('DELETE FROM gallery WHERE owner = ? AND owner_id = ?', [$def['gallery'], $item[$key]]);
            flash('ok', '“' . ($item[$def['label']] ?: $def['single']) . '” silindi.');
            redirect(admin_url($slug));
        }

        $data = [];
        $errors = [];
        foreach ($fields as $name => $f) {
            switch ($f['type']) {
                case 'gallery':
                    break;
                case 'check':
                    $data[$name] = isset($_POST[$name]) ? 1 : 0;
                    break;
                case 'number':
                    $data[$name] = (int) post($name, '0');
                    break;
                case 'select':
                    $v = post($name);
                    if (isset($f['rel'])) $data[$name] = ($v !== '' && (int) $v) ? (int) $v : null;
                    else $data[$name] = array_key_exists($v, $f['options']) ? $v : (string) array_key_first($f['options']);
                    break;
                case 'image':
                    $err = null;
                    $up = upload_field($name . '__file', $err);
                    if ($err) $errors[] = $f['label'] . ': ' . $err;
                    $picked = valid_media_path(post($name));
                    $data[$name] = $up ?? ($picked ?: (post($name . '__clear') ? '' : ($item[$name] ?? '')));
                    if (!empty($f['required']) && $data[$name] === '') $errors[] = $f['label'] . ' zorunlu.';
                    break;
                case 'slug':
                    break; // aşağıda
                default:
                    $max = in_array($f['type'], ['richtext', 'textarea'], true) ? 30000 : 300;
                    $data[$name] = mb_substr(post($name), 0, $max);
                    if (!empty($f['required']) && $data[$name] === '') $errors[] = $f['label'] . ' boş olamaz.';
            }
        }
        if (isset($fields['slug'])) {
            $base = post('slug') ?: (string) ($data[$def['label']] ?? '');
            $data['slug'] = unique_slug($table, $base, $item ? (int) $item['id'] : null);
        }
        if ($errors) {
            foreach ($errors as $e) flash('error', $e);
            if ($isNew) redirect(admin_url($slug . '/yeni'));
            // Eksik zorunlu alanlar varsa kaydetme; dosya hatalarında diğer alanlar kaydedilir
            if (array_filter($errors, fn($e) => str_contains($e, 'zorunlu') || str_contains($e, 'boş olamaz'))) redirect(admin_url($slug . '/' . $id));
        }

        $cols = array_keys($data);
        if ($item) {
            $sets = implode(', ', array_map(fn($k) => "$k = :$k", $cols));
            $touch = in_array($table, ['projects', 'pages'], true) ? ', updated_at = CURRENT_TIMESTAMP' : '';
            q("UPDATE $table SET $sets$touch WHERE $key = :__key", $data + ['__key' => $item[$key]]);
            $rid = $item[$key];
        } else {
            q("INSERT INTO $table(" . implode(', ', $cols) . ') VALUES(' . implode(', ', array_map(fn($k) => ":$k", $cols)) . ')', $data);
            $rid = (int) db()->lastInsertId();
        }

        if (!empty($def['gallery'])) admin_save_gallery($def['gallery'], (int) $rid);
        flash('ok', $def['single'] . ' kaydedildi.');
        redirect(admin_url($slug . '/' . rawurlencode((string) $rid)));
    }

    $values = $item ?? [];
    if (!$item) foreach ($fields as $n => $f) $values[$n] = $f['default'] ?? '';
    $options = [];
    foreach ($fields as $n => $f) if ($f['type'] === 'select') $options[$n] = isset($f['rel']) ? rel_options($f['rel']) : $f['options'];

    admin_render('admin/crud_form', [
        'title' => $item ? ($item[$def['label']] ?: $def['single']) : 'Yeni ' . mb_strtolower($def['single']),
        'slug' => $slug, 'def' => $def, 'item' => $item, 'values' => $values, 'options' => $options,
        'gallery' => ($item && !empty($def['gallery'])) ? rows('SELECT * FROM gallery WHERE owner = ? AND owner_id = ? ORDER BY sort, id', [$def['gallery'], $item[$key]]) : [],
    ], $user);
}

/** Galeri: açıklama/sıra güncelle, işaretlileri sil, yeni yüklemeleri ve kütüphane seçimlerini ekle. */
function admin_save_gallery(string $owner, int $ownerId): void
{
    foreach ((array) ($_POST['g'] ?? []) as $gid => $g) {
        if (!empty($g['del'])) {
            q('DELETE FROM gallery WHERE id = ? AND owner = ? AND owner_id = ?', [(int) $gid, $owner, $ownerId]);
            continue;
        }
        q('UPDATE gallery SET caption = ?, sort = ? WHERE id = ? AND owner = ? AND owner_id = ?',
            [mb_substr(trim((string) ($g['caption'] ?? '')), 0, 200), (int) ($g['sort'] ?? 0), (int) $gid, $owner, $ownerId]);
    }
    $max = (int) val('SELECT COALESCE(MAX(sort), 0) FROM gallery WHERE owner = ? AND owner_id = ?', [$owner, $ownerId]);
    $errors = [];
    foreach (upload_many('gallery_files', $errors) as $path) q('INSERT INTO gallery(owner, owner_id, path, sort) VALUES(?,?,?,?)', [$owner, $ownerId, $path, ++$max]);
    foreach (array_filter(explode(',', post('gallery_pick'))) as $path) {
        if ($p = valid_media_path($path)) q('INSERT INTO gallery(owner, owner_id, path, sort) VALUES(?,?,?,?)', [$owner, $ownerId, $p, ++$max]);
    }
    foreach ($errors as $e) flash('error', $e);
}

/* ---------------- Ana sayfa ve genel metinler ---------------- */

/** Ayar formlarında kullanılan alan grupları: [anahtar, etiket, tür] */
function home_setting_groups(): array
{
    return [
        'Üst şerit' => [
            ['announce_title', 'Başlık', 'text'], ['announce_text', 'Alt metin', 'text'], ['announce_link', 'Bağlantı', 'text'],
        ],
        'Açılış görseli' => [
            ['hero_image', 'Görsel', 'image'], ['hero_video', 'Video yolu (isteğe bağlı, mp4)', 'text'],
            ['hero_title', 'Başlık', 'text'], ['hero_subtitle', 'Alt başlık', 'text'], ['hero_link', 'Bağlantı', 'text'],
        ],
        'Giriş metni' => [
            ['home_intro', 'Metin', 'textarea'], ['home_intro_link', 'Bağlantı yazısı', 'text'],
        ],
        'Projeler bölümü' => [
            ['home_projects_title', 'Başlık', 'text'], ['home_projects_text', 'Metin', 'textarea'],
        ],
        'Ev koleksiyonu bölümü' => [
            ['home_collection_title', 'Başlık', 'text'], ['home_collection_text', 'Metin', 'textarea'],
            ['home_collection_image', 'Büyük görsel', 'image'], ['home_collection_image2', 'Küçük görsel 1', 'image'], ['home_collection_image3', 'Küçük görsel 2', 'image'],
        ],
        'Adresler ve tanışma' => [
            ['home_addresses_title', 'Adresler başlığı', 'text'], ['home_addresses_text', 'Adresler metni', 'textarea'],
            ['home_meet_title', 'Tanışma başlığı', 'text'], ['home_meet_text', 'Tanışma metni', 'textarea'],
        ],
        'Açılır menüler' => [
            ['univers_menu_text', 'Evren menüsü metni', 'textarea'], ['univers_menu_image', 'Evren menüsü görseli', 'image'],
            ['collection_menu_image', 'Koleksiyon menüsü görseli', 'image'], ['shop_menu_image', 'Butik menüsü görseli', 'image'],
        ],
        'Diğer sayfa metinleri' => [
            ['collections_hero', 'Koleksiyonlar sayfası görseli', 'image'], ['collections_intro', 'Koleksiyonlar giriş metni', 'textarea'],
            ['chronicles_marquee', 'Günce kayan yazı', 'text'], ['chronicles_intro', 'Günce giriş metni', 'textarea'],
            ['design_steps', 'Tasarım hizmeti adımları', 'textarea', 'Her satır bir adım: Başlık | açıklama'],
        ],
    ];
}

function admin_home(array $user): void
{
    $groups = home_setting_groups();
    if (is_post()) {
        foreach ($groups as $items) {
            foreach ($items as $it) {
                [$k, $label, $type] = $it;
                if ($type === 'image') {
                    $err = null;
                    $up = upload_field($k . '__file', $err);
                    if ($err) flash('error', $label . ': ' . $err);
                    $picked = valid_media_path(post($k));
                    if ($up || $picked) save_setting($k, $up ?? $picked);
                } else {
                    $v = mb_substr(post($k), 0, 8000);
                    if (str_ends_with($k, '_link')) $v = admin_clean_link($v) ?: '/';
                    if ($k === 'hero_video' && $v !== '' && !preg_match('~^(uploads|assets)/[\w/.\-]+\.mp4$~', $v)) $v = '';
                    save_setting($k, $v);
                }
            }
        }
        flash('ok', 'Ana sayfa ve metinler kaydedildi.');
        redirect(admin_url('anasayfa'));
    }
    admin_render('admin/home', ['title' => 'Ana Sayfa & Metinler', 'groups' => $groups, 's' => settings()], $user);
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
            if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
                header('Content-Type: application/json');
                echo json_encode(['ok' => $n > 0, 'errors' => $errors]);
                return;
            }
            foreach ($errors as $e) flash('error', $e);
            if ($n) flash('ok', "$n görsel yüklendi.");
        } elseif (post('action') === 'delete') {
            $m = row('SELECT * FROM media WHERE id = ?', [(int) post('id')]);
            if ($m) {
                $p = $m['path'];
                $used = (int) val('SELECT (SELECT COUNT(*) FROM projects WHERE cover = :p) + (SELECT COUNT(*) FROM gallery WHERE path = :p)
                    + (SELECT COUNT(*) FROM products WHERE cover = :p) + (SELECT COUNT(*) FROM project_categories WHERE image = :p)
                    + (SELECT COUNT(*) FROM product_types WHERE image = :p) + (SELECT COUNT(*) FROM collections WHERE image = :p)
                    + (SELECT COUNT(*) FROM chronicles WHERE image = :p) + (SELECT COUNT(*) FROM showrooms WHERE image = :p)
                    + (SELECT COUNT(*) FROM slides WHERE image = :p) + (SELECT COUNT(*) FROM pages WHERE image = :p)
                    + (SELECT COUNT(*) FROM settings WHERE value = :p)', ['p' => $p]);
                if ($used) {
                    flash('error', 'Bu görsel sitede kullanılıyor; önce kullanıldığı yerden kaldırın.');
                } else {
                    q('DELETE FROM media WHERE id = ?', [$m['id']]);
                    if (valid_media_path($p)) @unlink(ROOT . '/' . $p);
                    flash('ok', 'Görsel silindi.');
                }
            }
        }
        redirect(admin_url('medya'));
    }
    admin_render('admin/media', ['title' => 'Medya', 'items' => rows('SELECT * FROM media ORDER BY id DESC')], $user);
}

/* ---------------- Mesajlar ve bülten ---------------- */

const MESSAGE_TYPES = ['iletisim' => 'İletişim', 'proje' => 'Proje talebi', 'showroom' => 'Showroom ziyareti', 'urun' => 'Ürün bilgisi'];

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
        redirect(post('action') === 'delete' || !$id ? admin_url('mesajlar') : admin_url('mesajlar/' . $id));
    }
    if ($id !== null) {
        $m = row('SELECT * FROM messages WHERE id = ?', [(int) $id]);
        if (!$m) redirect(admin_url('mesajlar'));
        if (!$m['is_read']) q('UPDATE messages SET is_read = 1 WHERE id = ?', [$m['id']]);
        admin_render('admin/message', ['title' => 'Mesaj', 'm' => $m], $user);
        return;
    }
    $filter = (string) ($_GET['tur'] ?? '');
    $where = '1=1';
    $params = [];
    if ($filter === 'okunmamis') $where = 'is_read = 0';
    elseif (isset(MESSAGE_TYPES[$filter])) { $where = 'type = ?'; $params[] = $filter; }
    admin_render('admin/messages', [
        'title' => 'Mesajlar',
        'messages' => rows("SELECT * FROM messages WHERE $where ORDER BY id DESC LIMIT 300", $params),
        'filter' => $filter,
    ], $user);
}

function admin_newsletter(array $user): void
{
    if (isset($_GET['csv'])) {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="bulten-aboneleri-' . date('Y-m-d') . '.csv"');
        echo "\xEF\xBB\xBF" . "e-posta;tarih\n";
        foreach (rows('SELECT email, created_at FROM newsletter ORDER BY id DESC') as $r) echo $r['email'] . ';' . $r['created_at'] . "\n";
        return;
    }
    if (is_post() && post('action') === 'delete') {
        q('DELETE FROM newsletter WHERE id = ?', [(int) post('id')]);
        flash('ok', 'Abone silindi.');
        redirect(admin_url('bulten'));
    }
    admin_render('admin/newsletter', ['title' => 'Bülten', 'items' => rows('SELECT * FROM newsletter ORDER BY id DESC')], $user);
}

/* ---------------- Ayarlar ---------------- */

const SETTING_FIELDS = [
    'site_name', 'logo_left', 'logo_mid', 'logo_right',
    'contact_email', 'contact_phone', 'notify_email',
    'instagram', 'pinterest', 'linkedin',
    'seo_title', 'seo_description',
];

function admin_settings(array $user): void
{
    if (is_post()) {
        foreach (SETTING_FIELDS as $k) {
            $v = mb_substr(post($k), 0, 2000);
            if (in_array($k, ['instagram', 'pinterest', 'linkedin'], true)) $v = admin_clean_link($v);
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
