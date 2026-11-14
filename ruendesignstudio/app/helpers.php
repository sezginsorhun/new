<?php
declare(strict_types=1);

/* ---------------- Çıktı ---------------- */

function e($v): string
{
    return htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function cfg(string $key, $default = null)
{
    global $CONFIG;
    return $CONFIG[$key] ?? $default;
}

function url(string $path = ''): string
{
    $path = ltrim($path, '/');
    return '/' . $path;
}

function admin_path(): string
{
    return trim((string) cfg('admin_path', 'yonetim'), '/');
}

function admin_url(string $path = ''): string
{
    $path = ltrim($path, '/');
    return '/' . admin_path() . '/' . $path;
}

function asset(string $path): string
{
    $file = ROOT . '/assets/' . ltrim($path, '/');
    $v = is_file($file) ? substr((string) filemtime($file), -6) : '1';
    return '/assets/' . ltrim($path, '/') . '?v=' . $v;
}

/** Görsel yolu: yüklenen dosya ya da yer tutucu. */
function img(?string $path, int $seed = 0): string
{
    $path = (string) $path;
    if ($path === '') {
        return '/assets/img/placeholder-' . (($seed % 6) + 1) . '.svg';
    }
    if (preg_match('~^https?://~', $path)) return $path;
    return '/' . ltrim($path, '/');
}

/** Panelde yazılan düz metni paragraflara çevirir (HTML'e izin vermez). */
function paragraphs(string $text): string
{
    $text = trim(str_replace("\r\n", "\n", $text));
    if ($text === '') return '';
    $out = '';
    foreach (preg_split("/\n{2,}/", $text) as $p) {
        $p = trim($p);
        if (preg_match('/^## (.+)$/', $p, $m)) {
            $out .= '<h3>' . e($m[1]) . '</h3>';
            continue;
        }
        $out .= '<p>' . inline_format(nl2br(e($p), false)) . '</p>';
    }
    return $out;
}

/** **kalın** ve *italik* işaretlerini (önceden kaçırılmış metinde) etikete çevirir. */
function inline_format(string $html): string
{
    $html = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $html);
    return preg_replace('/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/s', '<em>$1</em>', $html);
}

function excerpt(string $text, int $len = 160): string
{
    $text = trim(preg_replace('/\s+/', ' ', $text));
    return mb_strlen($text) > $len ? rtrim(mb_substr($text, 0, $len - 1)) . '…' : $text;
}

function slugify(string $text): string
{
    $map = ['ç' => 'c', 'Ç' => 'c', 'ğ' => 'g', 'Ğ' => 'g', 'ı' => 'i', 'İ' => 'i', 'ö' => 'o', 'Ö' => 'o',
        'ş' => 's', 'Ş' => 's', 'ü' => 'u', 'Ü' => 'u', 'â' => 'a', 'î' => 'i', 'û' => 'u', '&' => 've'];
    $text = strtr($text, $map);
    $text = mb_strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim($text, '-') ?: 'icerik';
}

function unique_slug(string $table, string $base, ?int $exceptId = null): string
{
    $slug = slugify($base);
    $try = $slug;
    $i = 2;
    while (true) {
        $sql = "SELECT id FROM $table WHERE slug = ?" . ($exceptId ? ' AND id != ?' : '');
        $params = $exceptId ? [$try, $exceptId] : [$try];
        if (!row($sql, $params)) return $try;
        $try = $slug . '-' . $i++;
    }
}

function tr_date(?string $date, bool $withTime = false): string
{
    if (!$date) return '';
    // Veritabanı zamanları UTC tutulur (CURRENT_TIMESTAMP); İstanbul saatine çevrilir
    $ts = strtotime($date . (strlen($date) > 10 ? ' UTC' : ''));
    $months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    $s = date('j', $ts) . ' ' . $months[(int) date('n', $ts) - 1] . ' ' . date('Y', $ts);
    return $withTime ? $s . ', ' . date('H:i', $ts) : $s;
}

/* ---------------- Ayarlar ---------------- */

function settings(): array
{
    static $cache = null;
    if ($cache === null) {
        $cache = [];
        foreach (rows('SELECT key, value FROM settings') as $r) $cache[$r['key']] = $r['value'];
    }
    return $cache;
}

function setting(string $key, string $default = ''): string
{
    $s = settings();
    return isset($s[$key]) && $s[$key] !== '' ? $s[$key] : $default;
}

function save_setting(string $key, string $value): void
{
    q('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [$key, $value]);
}

/* ---------------- İstek / yanıt ---------------- */

function is_post(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

function post(string $key, string $default = ''): string
{
    $v = $_POST[$key] ?? $default;
    return is_string($v) ? trim($v) : $default;
}

function redirect(string $to): never
{
    header('Location: ' . $to, true, 303);
    exit;
}

function client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

function not_found(): never
{
    http_response_code(404);
    render('site/404', ['title' => 'Sayfa bulunamadı'], 'site/layout');
    exit;
}

/**
 * Bir görünümü (app/views/...) değişkenlerle çalıştırır, isteğe bağlı olarak
 * bir yerleşim şablonunun içine yerleştirir.
 */
function render(string $view, array $vars = [], ?string $layout = null): void
{
    $content = view($view, $vars);
    if ($layout) {
        echo view($layout, $vars + ['content' => $content]);
    } else {
        echo $content;
    }
}

function view(string $view, array $vars = []): string
{
    extract($vars, EXTR_SKIP);
    ob_start();
    require APP . '/views/' . $view . '.php';
    return (string) ob_get_clean();
}

/* ---------------- Oturum, CSRF, flash ---------------- */

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('ruen_sid');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_strict_mode', '1');
    session_save_path(DATA . '/sessions');
    if (!is_dir(DATA . '/sessions')) @mkdir(DATA . '/sessions', 0700, true);
    session_start();
}

function csrf_token(): string
{
    start_session();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(csrf_token()) . '">';
}

function csrf_check(): void
{
    start_session();
    $sent = (string) ($_POST['_csrf'] ?? '');
    if ($sent === '' || !hash_equals($_SESSION['csrf'] ?? '', $sent)) {
        http_response_code(400);
        exit('Oturum süresi doldu ya da form geçersiz. Sayfayı yenileyip tekrar deneyin.');
    }
}

function flash(string $type, string $message): void
{
    start_session();
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function take_flash(): array
{
    start_session();
    $f = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $f;
}

/* ---------------- Yönetici kimliği ---------------- */

const SESSION_IDLE_LIMIT = 4 * 3600; // 4 saat işlem yapılmazsa oturum düşer

function current_admin(): ?array
{
    start_session();
    $id = $_SESSION['admin_id'] ?? null;
    if (!$id) return null;
    if (time() - ($_SESSION['admin_seen'] ?? 0) > SESSION_IDLE_LIMIT) {
        logout_admin();
        return null;
    }
    // Şifre değişince eski oturumlar geçersiz olsun
    $user = row('SELECT * FROM users WHERE id = ?', [$id]);
    if (!$user || !hash_equals((string) ($_SESSION['admin_fp'] ?? ''), substr($user['password_hash'], -16))) {
        logout_admin();
        return null;
    }
    $_SESSION['admin_seen'] = time();
    return $user;
}

function login_admin(array $user): void
{
    start_session();
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $user['id'];
    $_SESSION['admin_fp'] = substr($user['password_hash'], -16);
    $_SESSION['admin_seen'] = time();
    q('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [$user['id']]);
}

function logout_admin(): void
{
    start_session();
    unset($_SESSION['admin_id'], $_SESSION['admin_fp'], $_SESSION['admin_seen']);
    session_regenerate_id(true);
}

/** Son 15 dakikada bu IP'den 8 hatalı deneme varsa giriş kilitlenir. */
function login_locked(): bool
{
    $n = (int) val("SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND success = 0 AND created_at > datetime('now', '-15 minutes')", [client_ip()]);
    return $n >= 8;
}

function send_mail(string $to, string $subject, string $body, string $replyTo = ''): bool
{
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
    $host = parse_url((string) cfg('base_url', ''), PHP_URL_HOST) ?: 'localhost';
    $headers = [
        'From: ' . mb_encode_mimeheader(setting('site_name', 'Ruen Design Studio')) . ' <no-reply@' . $host . '>',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ];
    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: ' . $replyTo;
    return @mail($to, mb_encode_mimeheader($subject), $body, implode("\r\n", $headers));
}
