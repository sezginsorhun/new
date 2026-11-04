<?php
/**
 * NİLSER — teklif / iletişim formu alıcısı
 *
 * Hostinger paylaşımlı hostingde ek kurulum gerektirmez (PHP mail()).
 * Mesajların ulaşması için hPanel → E-postalar bölümünde
 * info@nilseraluminyum.com hesabının açılmış olması gerekir.
 *
 * Alıcıyı değiştirmek için aşağıdaki $TO satırını düzenleyin.
 */

declare(strict_types=1);

$TO       = 'info@nilseraluminyum.com';
$FROM     = 'web@nilseraluminyum.com';          // alan adınıza ait bir adres olmalı
$SITE     = 'nilseraluminyum.com';
$LIMIT    = 5;                                   // aynı IP'den 10 dakikada en fazla
$WINDOW   = 600;

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json');

function respond(bool $ok, string $error = '', int $code = 200): void
{
    global $wantsJson;
    http_response_code($code);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    } elseif ($ok) {
        header('Location: /tesekkurler/', true, 303);
    } else {
        header('Content-Type: text/html; charset=utf-8');
        echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
            . '<p style="font:16px system-ui;padding:24px">' . htmlspecialchars($error) . ' <a href="/iletisim/">Geri dön</a></p>';
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'Geçersiz istek.', 405);
}

/* Başka sitelerden gönderimi engelle */
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($origin !== '') {
    $host = strtolower((string) parse_url($origin, PHP_URL_HOST));
    if ($host !== $SITE && $host !== 'www.' . $SITE && $host !== strtolower((string) preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''))) {
        respond(false, 'Geçersiz kaynak.', 403);
    }
}

/* Bal küpü: botlar bu gizli alanı doldurur */
if (!empty($_POST['website'])) {
    respond(true);
}

/* Basit hız sınırı (IP başına) */
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$bucket = sys_get_temp_dir() . '/nilser_rl_' . hash('sha256', $ip . $SITE);
$now = time();
$hits = [];
if (is_file($bucket)) {
    $hits = array_filter(
        array_map('intval', explode(',', (string) @file_get_contents($bucket))),
        fn ($t) => $t > $now - $WINDOW
    );
}
if (count($hits) >= $LIMIT) {
    respond(false, 'Çok fazla deneme. Lütfen biraz sonra tekrar deneyin veya bizi arayın.', 429);
}
$hits[] = $now;
@file_put_contents($bucket, implode(',', $hits), LOCK_EX);

/* Alanlar */
$clean = static function (string $key, int $max): string {
    $v = trim((string) ($_POST[$key] ?? ''));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
};
$oneLine = static fn (string $v): string => trim(preg_replace('/[\r\n]+/', ' ', $v) ?? '');

$ad      = $oneLine($clean('ad', 80));
$telefon = $oneLine($clean('telefon', 20));
$eposta  = $oneLine($clean('eposta', 120));
$mesaj   = $clean('mesaj', 3000);
$kvkk    = ($_POST['kvkk'] ?? '') === '1';

if (mb_strlen($ad) < 3) respond(false, 'Lütfen adınızı yazın.', 422);
if (!preg_match('/^[0-9 +()\-]{10,20}$/', $telefon)) respond(false, 'Lütfen geçerli bir telefon numarası yazın.', 422);
if ($eposta !== '' && !filter_var($eposta, FILTER_VALIDATE_EMAIL)) respond(false, 'E-posta adresi geçersiz.', 422);
if (!$kvkk) respond(false, 'Lütfen KVKK onayını işaretleyin.', 422);

if ($mesaj === '') {
    // JavaScript kapalıysa özet tarayıcıda üretilemez; alanlardan oluştur
    $parts = [];
    foreach (['urun' => 'Ürün', 'tip' => 'Tip', 'model' => 'Model', 'en' => 'Genişlik (cm)', 'boy' => 'Yükseklik (cm)', 'adet' => 'Adet', 'ilce' => 'Konum', 'not' => 'Not'] as $k => $label) {
        $v = $clean($k, 1000);
        if ($v !== '') $parts[] = "$label: $v";
    }
    $mesaj = implode("\n", $parts);
}

$urun = $oneLine($clean('urun', 40));
$subject = 'Web teklif talebi' . ($urun !== '' ? " ($urun)" : '') . " — $ad";

$body  = $mesaj . "\n\n";
$body .= "------------------------------\n";
$body .= 'Tarih : ' . date('d.m.Y H:i') . "\n";
$body .= "IP    : $ip\n";
$body .= "Kaynak: https://$SITE/iletisim/\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: =?UTF-8?B?' . base64_encode('NİLSER Web') . "?= <$FROM>",
    'X-Mailer: nilser-site',
];
if ($eposta !== '') {
    $headers[] = 'Reply-To: =?UTF-8?B?' . base64_encode($ad) . "?= <$eposta>";
}

$sent = @mail(
    $TO,
    '=?UTF-8?B?' . base64_encode($subject) . '?=',
    $body,
    implode("\r\n", $headers),
    '-f' . $FROM
);

if (!$sent) {
    respond(false, 'E-posta gönderilemedi. Lütfen WhatsApp veya telefonla ulaşın.', 500);
}

respond(true);
