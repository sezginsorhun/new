<section class="page-head">
  <h1>Basın</h1>
</section>
<section class="press-grid">
  <?php if (!$items): ?><p class="empty">Yakında.</p><?php endif; ?>
  <?php foreach ($items as $i => $it): ?>
    <?php $tag = $it['link'] ? 'a' : 'div'; ?>
    <<?= $tag ?> class="press-item reveal"<?= $it['link'] ? ' href="' . e($it['link']) . '" target="_blank" rel="noopener"' : '' ?>>
      <div class="press-img"><img src="<?= e(img($it['image'], $i + 2)) ?>" alt="<?= e($it['publication']) ?>" loading="lazy"></div>
      <p class="press-pub"><?= e($it['publication']) ?></p>
      <?php if ($it['title']): ?><p class="press-title"><?= e($it['title']) ?></p><?php endif; ?>
      <?php if ($it['issue']): ?><p class="muted"><?= e($it['issue']) ?></p><?php endif; ?>
    </<?= $tag ?>>
  <?php endforeach; ?>
</section>
