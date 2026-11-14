<section class="chron-head">
  <h1 class="h-wide">Günce</h1>
  <div class="marquee" aria-hidden="true"><div class="marquee-track"><?php for ($i = 0; $i < 4; $i++): ?><span><?= e(setting('chronicles_marquee', 'bir hikâyeler defteri')) ?></span><?php endfor; ?></div></div>
  <div class="chron-intro"><?= paragraphs(setting('chronicles_intro')) ?></div>
</section>

<section class="chron-grid">
  <?php if (!$items): ?><p class="empty">Yakında.</p><?php endif; ?>
  <?php foreach ($items as $c): ?>
    <a class="chron-card reveal<?= $c['wide'] ? ' is-wide' : '' ?>" href="/gunce/<?= e($c['slug']) ?>">
      <span class="chron-img"><img src="<?= e(img($c['image'])) ?>" alt="<?= e($c['title']) ?>" loading="lazy"></span>
      <span class="chron-label"><?= e($c['label'] ?: $c['title']) ?></span>
      <span class="chron-ex"><?= e($c['excerpt']) ?></span>
    </a>
  <?php endforeach; ?>
</section>
