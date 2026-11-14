<?php
/** Mağaza panelindeki düzenin aynısı: 228px beyaz kenar çubuğu, gruplu menü, krem içerik alanı. */

$groups = [
    'Genel' => [['', 'Panel', 'dashboard'], ['mesajlar', 'Mesajlar', 'mail']],
    'Portfolyo' => [['projeler', 'Projeler', 'folder'], ['kategoriler', 'Kategoriler', 'tag'], ['basin', 'Basın', 'newspaper']],
    'Görünüm' => [['anasayfa', 'Ana Sayfa', 'layout'], ['sayfalar', 'Sayfalar', 'file'], ['medya', 'Medya', 'images']],
    'Sistem' => [['hesabim', 'Hesabım', 'user'], ['ayarlar', 'Ayarlar', 'settings'], ['guvenlik', 'Güvenlik', 'shield']],
];
$reqPath = trim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$current = explode('/', $reqPath)[1] ?? '';
$siteName = setting('site_name', 'Ruen Design Studio');
?><!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= e($title ?? 'Yönetim') ?> — Yönetim</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="<?= e(asset('admin.css')) ?>">
</head>
<body data-media-url="<?= e(admin_url('medya/liste.json')) ?>" data-upload-url="<?= e(admin_url('medya')) ?>" data-csrf="<?= e(csrf_token()) ?>">
<div class="shell">
  <aside class="sidebar">
    <div class="brand">
      <a href="<?= e(admin_url()) ?>">
        <p class="brand-name"><?= e(setting('logo_line1', 'RUEN')) ?></p>
        <p class="brand-sub">Yönetim</p>
      </a>
    </div>
    <nav class="side-nav" aria-label="Yönetim menüsü">
      <?php foreach ($groups as $g => $items): ?>
        <div class="nav-group">
          <p class="nav-title"><?= e($g) ?></p>
          <?php foreach ($items as [$slug, $label, $ic]): ?>
            <a href="<?= e(admin_url($slug)) ?>" class="nav-item"<?= $current === $slug ? ' aria-current="page"' : '' ?>>
              <?= icon($ic) ?><span><?= e($label) ?></span>
              <?php if ($slug === 'mesajlar' && $unread): ?><span class="count"><?= $unread ?></span><?php endif; ?>
            </a>
          <?php endforeach; ?>
        </div>
      <?php endforeach; ?>
    </nav>
    <div class="side-foot">
      <p class="who"><?= e($user['name'] ?: 'Yönetici') ?></p>
      <p class="who-sub"><?= e($user['email']) ?></p>
      <a class="btn-ghost w-full" href="/" target="_blank" rel="noopener">Siteyi görüntüle →</a>
      <form method="post" action="<?= e(admin_url('cikis')) ?>">
        <?= csrf_field() ?>
        <button class="btn-ghost w-full" type="submit"><?= icon('logout', 14) ?> Çıkış</button>
      </form>
    </div>
  </aside>

  <div class="main-col">
    <div class="topbar">
      <div class="topbar-row">
        <a href="<?= e(admin_url()) ?>" class="topbar-brand"><?= e(setting('logo_line1', 'RUEN')) ?> Yönetim</a>
        <form method="post" action="<?= e(admin_url('cikis')) ?>"><?= csrf_field() ?><button class="btn-ghost" type="submit">Çıkış</button></form>
      </div>
      <div class="topbar-links">
        <?php foreach ($groups as $items): foreach ($items as [$slug, $label]): ?>
          <a href="<?= e(admin_url($slug)) ?>"<?= $current === $slug ? ' aria-current="page"' : '' ?>><?= e($label) ?></a>
        <?php endforeach; endforeach; ?>
      </div>
    </div>

    <main class="content">
      <?php foreach ($flashes as $f): ?>
        <div class="flash flash-<?= e($f['type']) ?>" role="status"><?= e($f['message']) ?></div>
      <?php endforeach; ?>
      <?= $content ?>
    </main>
  </div>
</div>

<dialog class="picker" data-picker>
  <div class="picker-head">
    <h2>Medya kütüphanesi</h2>
    <label class="btn-outline btn-sm"><?= icon('upload', 14) ?> Yükle<input type="file" accept="image/*" multiple hidden data-picker-upload></label>
    <button type="button" class="btn-ghost" data-picker-close>Kapat</button>
  </div>
  <p class="help picker-help" data-picker-help>Bir görsel seçin.</p>
  <div class="picker-grid" data-picker-grid><p class="muted">Yükleniyor…</p></div>
  <div class="picker-foot" data-picker-foot hidden>
    <button type="button" class="btn-primary btn-sm" data-picker-done>Seçilenleri ekle</button>
  </div>
</dialog>

<script src="<?= e(asset('admin.js')) ?>" defer></script>
</body>
</html>
