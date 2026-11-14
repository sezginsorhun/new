<article class="article">
  <header class="article-head">
    <p class="chron-label"><?= e($c['label']) ?></p>
    <h1 class="h-display"><?= e($c['title']) ?></h1>
  </header>
  <figure class="article-hero"><img src="<?= e(img($c['image'])) ?>" alt="<?= e($c['title']) ?>" fetchpriority="high"></figure>
  <div class="article-body serif-text"><?= paragraphs($c['body']) ?></div>
  <?php if ($images): ?>
    <div class="cl-duo article-gal">
      <?php foreach ($images as $i => $im): ?><figure class="cl <?= $i % 2 ? 'cl-b' : 'cl-a' ?> reveal"><img src="<?= e(img($im['path'])) ?>" alt="" loading="lazy"></figure><?php endforeach; ?>
    </div>
  <?php endif; ?>
</article>

<?php if ($more): ?>
<section class="chron-grid chron-more">
  <p class="more-title">Diğer yazılar</p>
  <?php foreach ($more as $m): ?>
    <a class="chron-card reveal" href="/gunce/<?= e($m['slug']) ?>">
      <span class="chron-img"><img src="<?= e(img($m['image'])) ?>" alt="" loading="lazy"></span>
      <span class="chron-label"><?= e($m['label'] ?: $m['title']) ?></span>
      <span class="chron-ex"><?= e($m['excerpt']) ?></span>
    </a>
  <?php endforeach; ?>
</section>
<?php endif; ?>
