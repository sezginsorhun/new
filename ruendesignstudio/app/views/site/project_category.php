<section class="split-head">
  <h1 class="h-display"><?= e($cat['name']) ?></h1>
  <div class="split-text">
    <div class="sans-text"><?= paragraphs($cat['intro']) ?></div>
    <a class="btn-outline" href="/iletisim">İletişim</a>
  </div>
</section>

<section class="proj-grid">
  <?php if (!$projects): ?><p class="empty">Bu kategoride henüz proje yok.</p><?php endif; ?>
  <?php foreach ($projects as $p): ?>
    <a class="proj-card reveal" href="/proje/<?= e($p['slug']) ?>">
      <span class="proj-img"><img src="<?= e(img($p['cover'])) ?>" alt="<?= e($p['title']) ?>" loading="lazy"></span>
      <span class="proj-name"><?= e($p['title']) ?></span>
      <span class="proj-loc"><?= e($p['location']) ?></span>
    </a>
  <?php endforeach; ?>
</section>
