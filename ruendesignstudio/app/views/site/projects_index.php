<h1 class="sr">Projeler</h1>
<section class="stack-cats">
  <?php foreach ($categories as $i => $c): ?>
    <a class="stack-cat" href="/projeler/<?= e($c['slug']) ?>">
      <img src="<?= e(img($c['image'])) ?>" alt="<?= e($c['name']) ?>" <?= $i ? 'loading="lazy"' : 'fetchpriority="high"' ?>>
      <span class="stack-cat-cap">
        <span class="stack-cat-name"><?= e($c['name']) ?></span>
        <span class="btn-white">Keşfet</span>
      </span>
    </a>
  <?php endforeach; ?>
</section>
