<h1 class="sr"><?= e($title) ?></h1>
<?php
$groups = [];
foreach ($types as $t) $groups[$t['group_name']][] = $t;
?>
<?php foreach ($groups as $g => $items): ?>
<section class="type-group" id="<?= e(slugify($g)) ?>">
  <h2 class="h-wide type-group-title"><?= e($g) ?></h2>
  <div class="type-tiles">
    <?php foreach ($items as $i => $t): ?>
      <a class="type-tile reveal<?= $i === 0 ? ' is-first' : '' ?>" href="/urunler/<?= e($t['slug']) ?>">
        <img src="<?= e(img($t['image'])) ?>" alt="<?= e($t['name']) ?>" loading="lazy">
        <span class="type-label"><?= e($t['name']) ?></span>
      </a>
    <?php endforeach; ?>
  </div>
</section>
<?php endforeach; ?>
