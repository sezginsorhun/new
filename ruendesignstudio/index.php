<?php
/**
 * Tek giriş noktası. .htaccess dosya olmayan her isteği buraya yönlendirir.
 */
declare(strict_types=1);

require __DIR__ . '/app/bootstrap.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = '/' . trim(rawurldecode($path), '/');
$segments = $path === '/' ? [] : explode('/', trim($path, '/'));

// Gizli yönetim adresi
if (($segments[0] ?? '') === admin_path()) {
    require APP . '/admin.php';
    admin_dispatch(array_slice($segments, 1));
    exit;
}
// /admin, /wp-admin vb. tahminler sıradan 404 alır
require APP . '/site.php';
site_dispatch($segments);
