<?php
$siteName = setting('site_name', 'Ruen Design Studio');
$pageTitle = !empty($title) ? $title . ' — ' . $siteName : setting('seo_title', $siteName);
$desc = !empty($description) ? $description : setting('seo_description');
$base = rtrim((string) cfg('base_url'), '/');
$canonical = $base . strtok($_SERVER['REQUEST_URI'] ?? '/', '?');
$og = !empty($ogImage) ? $base . img($ogImage) : $base . '/assets/img/og.png';
$bodyClass = $bodyClass ?? '';
$reqPath = '/' . trim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$active = fn(string $p) => str_starts_with($reqPath, $p) ? ' aria-current="page"' : '';
$hasPress = (int) val('SELECT COUNT(*) FROM press WHERE published = 1') > 0;
?><!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($pageTitle) ?></title>
<meta name="description" content="<?= e($desc) ?>">
<link rel="canonical" href="<?= e($canonical) ?>">
<meta property="og:type" content="website">
<meta property="og:site_name" content="<?= e($siteName) ?>">
<meta property="og:title" content="<?= e($pageTitle) ?>">
<meta property="og:description" content="<?= e($desc) ?>">
<meta property="og:image" content="<?= e($og) ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/cormorant-garamond-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="<?= e(asset('site.css')) ?>">
<script type="application/ld+json"><?= json_encode([
    '@context' => 'https://schema.org',
    '@type' => 'InteriorDesigner',
    'name' => $siteName,
    'url' => $base . '/',
    'email' => setting('contact_email'),
    'telephone' => setting('contact_phone'),
    'address' => setting('contact_address'),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
</head>
<body class="<?= e($bodyClass) ?>">
<a class="skip" href="#icerik">İçeriğe geç</a>

<header class="site-header" data-header>
  <nav class="nav nav-left" aria-label="Ana menü">
    <a href="/projeler"<?= $active('/projeler') ?: $active('/kategori') ?>>Projeler</a>
    <a href="/studyo"<?= $active('/studyo') ?>>Stüdyo</a>
  </nav>
  <a class="logo" href="/" aria-label="<?= e($siteName) ?> — Ana sayfa">
    <span class="logo-1"><?= e(setting('logo_line1', 'RUEN')) ?></span>
    <span class="logo-2"><?= e(setting('logo_line2', 'DESIGN STUDIO')) ?></span>
  </a>
  <nav class="nav nav-right" aria-label="İkincil menü">
    <?php if ($hasPress): ?><a href="/basin"<?= $active('/basin') ?>>Basın</a><?php endif; ?>
    <a href="/iletisim"<?= $active('/iletisim') ?>>İletişim</a>
  </nav>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobil-menu" data-menu-btn>
    <span></span><span></span><span class="sr">Menü</span>
  </button>
</header>

<div class="mobile-menu" id="mobil-menu" hidden data-menu>
  <a href="/projeler">Projeler</a>
  <a href="/studyo">Stüdyo</a>
  <?php if ($hasPress): ?><a href="/basin">Basın</a><?php endif; ?>
  <a href="/iletisim">İletişim</a>
  <div class="mobile-menu-foot">
    <?php if (setting('contact_email')): ?><a href="mailto:<?= e(setting('contact_email')) ?>"><?= e(setting('contact_email')) ?></a><?php endif; ?>
    <?php if (setting('instagram')): ?><a href="<?= e(setting('instagram')) ?>" rel="noopener" target="_blank">Instagram</a><?php endif; ?>
  </div>
</div>

<main id="icerik">
<?= $content ?>
</main>

<footer class="site-footer">
  <div class="footer-grid">
    <div>
      <p class="footer-logo"><?= e(setting('logo_line1', 'RUEN')) ?> <span><?= e(setting('logo_line2', 'DESIGN STUDIO')) ?></span></p>
      <p class="muted"><?= e(setting('footer_note')) ?></p>
    </div>
    <div>
      <p class="label-sm">Stüdyo</p>
      <p><?= nl2br(e(setting('contact_address'))) ?></p>
      <?php if (setting('contact_hours')): ?><p class="muted"><?= e(setting('contact_hours')) ?></p><?php endif; ?>
    </div>
    <div>
      <p class="label-sm">İletişim</p>
      <?php if (setting('contact_email')): ?><p><a href="mailto:<?= e(setting('contact_email')) ?>"><?= e(setting('contact_email')) ?></a></p><?php endif; ?>
      <?php if (setting('contact_phone')): ?><p><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', setting('contact_phone'))) ?>"><?= e(setting('contact_phone')) ?></a></p><?php endif; ?>
    </div>
    <?php if (setting('instagram') || setting('pinterest') || setting('linkedin')): ?>
    <div>
      <p class="label-sm">Takip edin</p>
      <?php foreach (['instagram' => 'Instagram', 'pinterest' => 'Pinterest', 'linkedin' => 'LinkedIn'] as $k => $label): if (setting($k)): ?>
        <p><a href="<?= e(setting($k)) ?>" target="_blank" rel="noopener"><?= $label ?></a></p>
      <?php endif; endforeach; ?>
    </div>
    <?php endif; ?>
  </div>
  <div class="footer-bottom">
    <span>© <?= date('Y') ?> <?= e($siteName) ?></span>
    <a href="/kvkk">KVKK</a>
  </div>
</footer>

<script src="<?= e(asset('site.js')) ?>" defer></script>
</body>
</html>
