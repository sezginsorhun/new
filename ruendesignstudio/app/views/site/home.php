<?php
$interval = max(3, (int) setting('slide_interval', '6'));
?>
<section class="hero" aria-label="Öne çıkan projeler" data-slider data-interval="<?= $interval ?>">
  <?php if (!$slides): ?>
    <div class="slide is-active"><img src="<?= e(img('', 0)) ?>" alt=""></div>
  <?php endif; ?>
  <?php foreach ($slides as $i => $s): ?>
    <figure class="slide<?= $i === 0 ? ' is-active' : '' ?>">
      <img src="<?= e(img($s['image'], $i)) ?>" alt="<?= e($s['title']) ?>" <?= $i === 0 ? 'fetchpriority="high"' : 'loading="lazy"' ?>>
      <?php if ($s['title'] || $s['subtitle']): ?>
        <figcaption>
          <?php if ($s['link']): ?><a href="<?= e($s['link']) ?>"><?php endif; ?>
          <span class="cap-title"><?= e($s['title']) ?></span>
          <?php if ($s['subtitle']): ?><span class="cap-sub"><?= e($s['subtitle']) ?></span><?php endif; ?>
          <?php if ($s['link']): ?></a><?php endif; ?>
        </figcaption>
      <?php endif; ?>
    </figure>
  <?php endforeach; ?>
  <?php if (count($slides) > 1): ?>
    <div class="hero-dots" role="tablist" aria-label="Görsel seçimi">
      <?php foreach ($slides as $i => $s): ?>
        <button type="button" role="tab" aria-label="<?= $i + 1 ?>. görsel" aria-selected="<?= $i === 0 ? 'true' : 'false' ?>" data-dot="<?= $i ?>"></button>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
  <a class="hero-scroll" href="#giris" aria-label="Aşağı kaydır"></a>
</section>

<section class="intro" id="giris">
  <p class="eyebrow"><?= e(setting('tagline')) ?></p>
  <h1 class="intro-title"><?= e(setting('intro_title')) ?></h1>
  <div class="intro-text"><?= paragraphs(setting('intro_text')) ?></div>
  <a class="link-line" href="/studyo">Stüdyoyu keşfedin</a>
</section>

<?php if ($featured): ?>
<section class="featured">
  <div class="section-head">
    <h2><?= e(setting('home_featured_title', 'Seçili Projeler')) ?></h2>
    <a class="link-line" href="/projeler">Tüm projeler</a>
  </div>
  <div class="featured-grid">
    <?php foreach ($featured as $i => $p): ?>
      <a class="card-project reveal<?= $i % 3 === 0 ? ' is-wide' : '' ?>" href="/projeler/<?= e($p['slug']) ?>">
        <div class="card-img"><img src="<?= e(img($p['cover'], $p['id'])) ?>" alt="<?= e($p['title']) ?>" loading="lazy"></div>
        <div class="card-meta">
          <h3><?= e($p['title']) ?></h3>
          <p><?= e($p['location']) ?></p>
        </div>
      </a>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>

<section class="cta">
  <p class="eyebrow">Yeni bir proje</p>
  <h2>Mekânınızı birlikte düşünelim.</h2>
  <a class="btn" href="/iletisim">İletişime geçin</a>
</section>
