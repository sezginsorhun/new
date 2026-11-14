<section class="page-head">
  <h1><?= e($category ? $category['name'] : 'Projeler') ?></h1>
  <?php if ($categories): ?>
  <nav class="filters" aria-label="Kategoriler">
    <a href="/projeler"<?= !$category ? ' aria-current="page"' : '' ?>>Tümü</a>
    <?php foreach ($categories as $c): ?>
      <a href="/kategori/<?= e($c['slug']) ?>"<?= $category && $category['id'] == $c['id'] ? ' aria-current="page"' : '' ?>><?= e($c['name']) ?></a>
    <?php endforeach; ?>
  </nav>
  <?php endif; ?>
</section>

<section class="projects-grid">
  <?php if (!$projects): ?>
    <p class="empty">Bu kategoride henüz proje yok.</p>
  <?php endif; ?>
  <?php foreach ($projects as $p): ?>
    <a class="card-project reveal" href="/projeler/<?= e($p['slug']) ?>">
      <div class="card-img"><img src="<?= e(img($p['cover'], $p['id'])) ?>" alt="<?= e($p['title']) ?>" loading="lazy"></div>
      <div class="card-meta">
        <h3><?= e($p['title']) ?></h3>
        <p><?= e(implode(' · ', array_filter([$p['category'], $p['location']]))) ?></p>
      </div>
    </a>
  <?php endforeach; ?>
</section>
