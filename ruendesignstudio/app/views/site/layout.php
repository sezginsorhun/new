<?php
$nav = nav_data();
$siteName = setting('site_name', 'Ruen Design Studio');
$pageTitle = !empty($title) ? $title . ' — ' . $siteName : setting('seo_title', $siteName);
$desc = !empty($description) ? $description : setting('seo_description');
$base = rtrim((string) cfg('base_url'), '/');
$canonical = $base . strtok($_SERVER['REQUEST_URI'] ?? '/', '?');
$og = !empty($ogImage) ? $base . img($ogImage) : $base . img(setting('hero_image'));
$bodyClass = $bodyClass ?? '';
$logo = fn(string $cls = '') => '<span class="logo-mark ' . $cls . '"><span>' . e(setting('logo_left', 'RUEN')) . '</span><em>' . e(setting('logo_mid', 'Design')) . '</em><span>' . e(setting('logo_right', 'STUDIO')) . '</span></span>';
$chev = '<svg class="chev" width="9" height="6" viewBox="0 0 9 6" aria-hidden="true"><path d="M.5.8 4.5 4.8 8.5.8" fill="none" stroke="currentColor"/></svg>';
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
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/lexend-exa-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/cormorant-garamond-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="<?= e(asset('site.css')) ?>">
<script type="application/ld+json"><?= json_encode([
    '@context' => 'https://schema.org', '@type' => 'InteriorDesigner', 'name' => $siteName, 'url' => $base . '/',
    'email' => setting('contact_email'), 'telephone' => setting('contact_phone'),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
</head>
<body class="<?= e($bodyClass) ?>">
<a class="skip" href="#icerik">İçeriğe geç</a>

<div class="topbar">
  <a class="topbar-news" href="<?= e(setting('announce_link', '/')) ?>">
    <span class="tb-title"><?= e(setting('announce_title')) ?></span>
    <span class="tb-text"><?= e(setting('announce_text')) ?></span>
  </a>
  <div class="topbar-icons">
    <button type="button" class="icon-btn" data-search-open aria-label="Ara">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    </button>
    <a class="icon-btn" href="/istek-listesi" aria-label="İstek listesi">
      <svg width="16" height="15" viewBox="0 0 24 22" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20.5S2 14.6 2 7.8A5 5 0 0 1 12 5a5 5 0 0 1 10 2.8c0 6.8-10 12.7-10 12.7Z"/></svg>
      <span class="wl-count" data-wl-count hidden></span>
    </a>
    <a class="icon-btn" href="/iletisim" aria-label="İletişim">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>
    </a>
  </div>
</div>

<header class="header" data-header>
  <div class="header-inner">
    <nav class="nav nav-l" aria-label="Ana menü">
      <div class="nav-item" data-mega>
        <a href="/evren" class="nav-link">Evren <?= $chev ?></a>
        <div class="mega mega-univers">
          <div class="mu-text">
            <?= paragraphs(setting('univers_menu_text')) ?>
            <a class="lnk" href="/evren">Evreni keşfedin</a>
          </div>
          <div class="mu-img"><img src="<?= e(img(setting('univers_menu_image'))) ?>" alt="" loading="lazy"></div>
          <div class="mu-addr">
            <p class="mega-title">Ruen adresleri</p>
            <?php foreach ($nav['showrooms'] as $s): ?>
              <a class="mu-addr-item" href="/adres/<?= e($s['slug']) ?>">
                <img src="<?= e(img($s['image'])) ?>" alt="" loading="lazy">
                <span><span class="mu-addr-name"><?= e($s['name']) ?></span><span class="mu-addr-sub"><?= e($s['short']) ?></span></span>
              </a>
            <?php endforeach; ?>
          </div>
        </div>
      </div>
      <div class="nav-item" data-mega>
        <a href="/projeler" class="nav-link">Projeler <?= $chev ?></a>
        <div class="mega mega-projects">
          <?php foreach ($nav['categories'] as $c): ?>
            <a class="mp-item" href="/projeler/<?= e($c['slug']) ?>">
              <span class="mp-img"><img src="<?= e(img($c['image'])) ?>" alt="" loading="lazy"></span>
              <span class="mp-name"><?= e($c['name']) ?></span>
            </a>
          <?php endforeach; ?>
        </div>
      </div>
      <div class="nav-item"><a href="/gunce" class="nav-link">Günce</a></div>
    </nav>

    <a class="logo" href="/" aria-label="<?= e($siteName) ?> — Ana sayfa"><?= $logo() ?></a>

    <nav class="nav nav-r" aria-label="Koleksiyon menüsü">
      <div class="nav-item" data-mega>
        <a href="/mobilya" class="nav-link">Koleksiyon <?= $chev ?></a>
        <div class="mega mega-cols">
          <?php foreach ($nav['mobilya'] as $g => $items): ?>
            <div class="mc-col">
              <a class="mega-title" href="/mobilya#<?= e(slugify($g)) ?>"><?= e($g) ?></a>
              <?php foreach ($items as $t): ?><a class="mc-link" href="/urunler/<?= e($t['slug']) ?>"><?= e($t['name']) ?></a><?php endforeach; ?>
            </div>
          <?php endforeach; ?>
          <div class="mc-img"><img src="<?= e(img(setting('collection_menu_image'))) ?>" alt="" loading="lazy"></div>
        </div>
      </div>
      <div class="nav-item" data-mega>
        <a href="/butik" class="nav-link">Butik <?= $chev ?></a>
        <div class="mega mega-cols">
          <?php foreach ($nav['butik'] as $g => $items): ?>
            <div class="mc-col">
              <a class="mega-title" href="/butik#<?= e(slugify($g)) ?>"><?= e($g) ?></a>
              <?php foreach ($items as $t): ?><a class="mc-link" href="/urunler/<?= e($t['slug']) ?>"><?= e($t['name']) ?></a><?php endforeach; ?>
            </div>
          <?php endforeach; ?>
          <div class="mc-col mc-sep">
            <a class="mega-title" href="/koleksiyonlar">Koleksiyonlar</a>
            <?php foreach ($nav['collections'] as $c): ?><a class="mc-link" href="/koleksiyon/<?= e($c['slug']) ?>"><?= e($c['name']) ?></a><?php endforeach; ?>
          </div>
          <div class="mc-img"><img src="<?= e(img(setting('shop_menu_image'))) ?>" alt="" loading="lazy"></div>
        </div>
      </div>
      <div class="nav-item"><a href="/iletisim" class="nav-link">Bize ulaşın</a></div>
    </nav>

    <button class="burger" type="button" aria-expanded="false" aria-controls="mobil-menu" data-burger aria-label="Menü">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<div class="mobile-nav" id="mobil-menu" hidden data-mobile-nav>
  <details>
    <summary>Evren</summary>
    <a href="/evren">Evreni keşfedin</a>
    <?php foreach ($nav['showrooms'] as $s): ?><a href="/adres/<?= e($s['slug']) ?>"><?= e($s['name']) ?></a><?php endforeach; ?>
  </details>
  <details>
    <summary>Projeler</summary>
    <a href="/projeler">Tüm projeler</a>
    <?php foreach ($nav['categories'] as $c): ?><a href="/projeler/<?= e($c['slug']) ?>"><?= e($c['name']) ?></a><?php endforeach; ?>
  </details>
  <a class="mn-link" href="/gunce">Günce</a>
  <details>
    <summary>Koleksiyon</summary>
    <?php foreach ($nav['mobilya'] as $g => $items): foreach ($items as $t): ?><a href="/urunler/<?= e($t['slug']) ?>"><?= e($t['name']) ?></a><?php endforeach; endforeach; ?>
  </details>
  <details>
    <summary>Butik</summary>
    <a href="/koleksiyonlar">Koleksiyonlar</a>
    <?php foreach ($nav['butik'] as $g => $items): foreach ($items as $t): ?><a href="/urunler/<?= e($t['slug']) ?>"><?= e($t['name']) ?></a><?php endforeach; endforeach; ?>
  </details>
  <a class="mn-link" href="/iletisim">Bize ulaşın</a>
</div>

<div class="search-layer" hidden data-search>
  <form action="/arama" method="get" class="search-form" role="search">
    <input type="search" name="q" placeholder="Ara…" aria-label="Ara" autocomplete="off">
    <button type="submit" class="lnk">Ara</button>
  </form>
  <button type="button" class="search-close" data-search-close aria-label="Kapat">×</button>
</div>

<main id="icerik">
<?= $content ?>
</main>

<footer class="footer">
  <div class="footer-top">
    <a class="footer-logo" href="/"><?= $logo() ?></a>
  </div>
  <div class="footer-grid">
    <div class="f-news" id="bulten">
      <p class="f-title">Bülten</p>
      <?php $bs = $_GET['bulten'] ?? ''; ?>
      <?php if ($bs === 'ok'): ?><p class="f-note ok">Bülten aboneliğiniz onaylandı.</p><?php endif; ?>
      <?php if ($bs === 'hata'): ?><p class="f-note err">Aboneliğiniz kaydedilemedi, lütfen tekrar deneyin.</p><?php endif; ?>
      <form method="post" action="/bulten" class="f-form">
        <?= csrf_field() ?>
        <div class="hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>
        <input type="email" name="email" placeholder="E-posta adresiniz" required aria-label="E-posta adresiniz">
        <button type="submit">Tamam</button>
      </form>
      <p class="f-small">Abone olarak <a href="/kvkk">aydınlatma metnini</a> kabul etmiş olursunuz.</p>
      <p class="f-title f-follow">Bizi takip edin</p>
      <div class="f-social">
        <?php if (setting('instagram')): ?><a href="<?= e(setting('instagram')) ?>" target="_blank" rel="noopener" aria-label="Instagram"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1" fill="currentColor"/></svg></a><?php endif; ?>
        <?php if (setting('pinterest')): ?><a href="<?= e(setting('pinterest')) ?>" target="_blank" rel="noopener" aria-label="Pinterest"><svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11.3 7.2c2.9-.4 4.8 1.3 4.8 3.6 0 2.5-1.4 4.3-3.3 4.3-.9 0-1.6-.6-1.4-1.4l-1.3 5.1M10.6 13.4c-.9-.4-1.4-1.3-1.4-2.4 0-1.8 1.4-3.4 3.7-3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></a><?php endif; ?>
        <?php if (setting('linkedin')): ?><a href="<?= e(setting('linkedin')) ?>" target="_blank" rel="noopener" aria-label="LinkedIn"><svg width="22" height="22" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2" fill="currentColor"/><path d="M7 10v7M7 7v.01M11 17v-7m0 3.5c0-2 1.2-3.5 3-3.5s2.5 1.2 2.5 3.2V17" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg></a><?php endif; ?>
      </div>
    </div>
    <div>
      <p class="f-title">Hakkımızda</p>
      <a href="/evren">Evren</a>
      <a href="/projeler">Projeler</a>
      <a href="/oduller">Ödüller</a>
    </div>
    <div>
      <p class="f-title">Bilgiler</p>
      <a href="/basin">Basın</a>
      <a href="/kariyer">Kariyer</a>
      <a href="/iletisim">İletişim</a>
    </div>
    <div>
      <p class="f-title">Adreslerimiz</p>
      <?php foreach ($nav['showrooms'] as $s): ?><a href="/adres/<?= e($s['slug']) ?>"><?= e($s['name']) ?></a><?php endforeach; ?>
    </div>
  </div>
  <div class="footer-bottom">
    <a href="/yasal-bildirim">Yasal bildirim</a>
    <a href="/satis-kosullari">Satış koşulları</a>
    <a href="/cerez-politikasi">Çerez politikası</a>
    <a href="/kvkk">KVKK</a>
    <span>© <?= date('Y') ?> <?= e($siteName) ?></span>
  </div>
</footer>

<script src="<?= e(asset('site.js')) ?>" defer></script>
</body>
</html>
