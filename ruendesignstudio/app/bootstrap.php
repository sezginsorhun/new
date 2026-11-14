<?php
/**
 * RUEN DESIGN STUDIO — çekirdek
 *
 * Tek giriş noktası index.php'dir; bu dosya ayarları, veritabanını,
 * oturumu ve ortak yardımcıları yükler. app/ ve data/ klasörleri
 * .htaccess ile dışarıya kapalıdır.
 */
declare(strict_types=1);

define('ROOT', dirname(__DIR__));
define('APP', __DIR__);
define('DATA', ROOT . '/data');
define('UPLOADS', ROOT . '/uploads');

if (!is_file(APP . '/config.php')) {
    http_response_code(500);
    exit('app/config.php bulunamadı. app/config.sample.php dosyasını kopyalayıp doldurun.');
}
$CONFIG = require APP . '/config.php';

error_reporting(E_ALL);
ini_set('display_errors', !empty($CONFIG['debug']) ? '1' : '0');
ini_set('log_errors', '1');
ini_set('error_log', DATA . '/php-error.log');
date_default_timezone_set('Europe/Istanbul');
mb_internal_encoding('UTF-8');

require APP . '/db.php';
require APP . '/helpers.php';
require APP . '/images.php';

foreach ([DATA, UPLOADS] as $dir) {
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
}

db_migrate();
