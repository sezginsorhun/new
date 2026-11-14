<?php if (!$products): ?>
  <p class="empty"><?= e($empty ?? 'Bu bölümde henüz parça yok.') ?></p>
<?php else: ?>
<div class="prod-grid">
  <?php foreach ($products as $pr): ?>
    <a class="prod-card reveal" href="/urun/<?= e($pr['slug']) ?>">
      <span class="prod-img"><img src="<?= e(img($pr['cover'])) ?>" alt="<?= e($pr['name']) ?>" loading="lazy"></span>
      <span class="prod-line">
        <span class="prod-name"><?= e($pr['name']) ?></span>
        <span class="prod-type"><?= e($pr['type_name'] ?? '') ?></span>
        <span class="prod-price"><?= e($pr['price']) ?></span>
      </span>
    </a>
  <?php endforeach; ?>
</div>
<?php endif; ?>
