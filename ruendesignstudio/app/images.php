<?php
/**
 * Görsel yükleme. Gelen dosya uzantısına değil içeriğine bakılarak doğrulanır
 * ve GD ile yeniden kodlanır; böylece dosyanın içine gizlenmiş betikler ve
 * EXIF konum bilgisi atılır. Uzun kenar en fazla 2400 piksel olur.
 */
declare(strict_types=1);

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 2400;

/**
 * @return array{path:string,width:int,height:int,size:int}|string  başarıda bilgi, hatada mesaj
 */
function store_upload(array $file)
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return match ($file['error'] ?? 0) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Dosya çok büyük.',
            UPLOAD_ERR_NO_FILE => 'Dosya seçilmedi.',
            default => 'Yükleme başarısız oldu.',
        };
    }
    if ($file['size'] > MAX_UPLOAD_BYTES) return 'Dosya 15 MB sınırını aşıyor.';
    if (!is_uploaded_file($file['tmp_name'])) return 'Geçersiz yükleme.';

    $info = @getimagesize($file['tmp_name']);
    $allowed = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP, IMAGETYPE_GIF];
    if (!$info || !in_array($info[2], $allowed, true)) return 'Yalnızca JPG, PNG, WEBP veya GIF yüklenebilir.';
    if ($info[0] * $info[1] > 60_000_000) return 'Görsel çözünürlüğü çok yüksek.';

    @ini_set('memory_limit', '512M');
    $src = match ($info[2]) {
        IMAGETYPE_JPEG => @imagecreatefromjpeg($file['tmp_name']),
        IMAGETYPE_PNG => @imagecreatefrompng($file['tmp_name']),
        IMAGETYPE_WEBP => @imagecreatefromwebp($file['tmp_name']),
        IMAGETYPE_GIF => @imagecreatefromgif($file['tmp_name']),
    };
    if (!$src) return 'Görsel okunamadı.';

    // Telefon fotoğraflarının yönünü düzelt
    if ($info[2] === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $exif = @exif_read_data($file['tmp_name']);
        $o = (int) ($exif['Orientation'] ?? 1);
        if ($o === 3) $src = imagerotate($src, 180, 0);
        if ($o === 6) $src = imagerotate($src, -90, 0);
        if ($o === 8) $src = imagerotate($src, 90, 0);
    }

    $w = imagesx($src);
    $h = imagesy($src);
    $scale = min(1, MAX_EDGE / max($w, $h));
    $nw = (int) round($w * $scale);
    $nh = (int) round($h * $scale);

    $dst = imagecreatetruecolor($nw, $nh);
    $keepAlpha = $info[2] === IMAGETYPE_PNG || $info[2] === IMAGETYPE_WEBP || $info[2] === IMAGETYPE_GIF;
    if ($keepAlpha) {
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        imagefill($dst, 0, 0, imagecolorallocatealpha($dst, 0, 0, 0, 127));
    }
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    imagedestroy($src);

    $dir = 'uploads/' . date('Y/m');
    if (!is_dir(ROOT . '/' . $dir)) mkdir(ROOT . '/' . $dir, 0755, true);
    $base = slugify(pathinfo((string) $file['name'], PATHINFO_FILENAME));
    $base = substr($base, 0, 50) . '-' . bin2hex(random_bytes(3));

    if (function_exists('imagewebp')) {
        $rel = "$dir/$base.webp";
        $ok = imagewebp($dst, ROOT . '/' . $rel, 84);
    } elseif ($keepAlpha) {
        $rel = "$dir/$base.png";
        $ok = imagepng($dst, ROOT . '/' . $rel, 7);
    } else {
        $rel = "$dir/$base.jpg";
        $ok = imagejpeg($dst, ROOT . '/' . $rel, 86);
    }
    imagedestroy($dst);
    if (!$ok) return 'Görsel kaydedilemedi.';

    $size = (int) filesize(ROOT . '/' . $rel);
    q('INSERT INTO media(path, original_name, width, height, size) VALUES(?,?,?,?,?)',
        [$rel, mb_substr((string) $file['name'], 0, 200), $nw, $nh, $size]);

    return ['path' => $rel, 'width' => $nw, 'height' => $nh, 'size' => $size];
}

/** Tek bir dosya alanından yükleme; dosya yoksa null döner. */
function upload_field(string $name, ?string &$error = null): ?string
{
    if (empty($_FILES[$name]) || ($_FILES[$name]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
    $r = store_upload($_FILES[$name]);
    if (is_string($r)) {
        $error = $r;
        return null;
    }
    return $r['path'];
}

/** Çoklu dosya alanı (name="x[]"). */
function upload_many(string $name, array &$errors = []): array
{
    $paths = [];
    if (empty($_FILES[$name]['name']) || !is_array($_FILES[$name]['name'])) return $paths;
    foreach ($_FILES[$name]['name'] as $i => $n) {
        $f = [
            'name' => $n,
            'type' => $_FILES[$name]['type'][$i],
            'tmp_name' => $_FILES[$name]['tmp_name'][$i],
            'error' => $_FILES[$name]['error'][$i],
            'size' => $_FILES[$name]['size'][$i],
        ];
        if ($f['error'] === UPLOAD_ERR_NO_FILE) continue;
        $r = store_upload($f);
        if (is_string($r)) $errors[] = $n . ': ' . $r;
        else $paths[] = $r['path'];
    }
    return $paths;
}

/** Medya kütüphanesinden seçilen yolun gerçekten bizim yüklememiz olduğunu doğrular. */
function valid_media_path(string $path): string
{
    $path = trim($path);
    if ($path === '') return '';
    if (!preg_match('~^uploads/[0-9]{4}/[0-9]{2}/[a-z0-9\-]+\.(webp|png|jpe?g|gif)$~', $path)) return '';
    return is_file(ROOT . '/' . $path) ? $path : '';
}
