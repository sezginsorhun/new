<section class="center-head page-simple">
  <h1 class="h-wide">Arama</h1>
  <form action="/arama" method="get" class="search-inline" role="search">
    <input type="search" name="q" value="<?= e($qs) ?>" placeholder="Proje, parça, yazı…" aria-label="Ara">
    <button type="submit" class="btn-black">Ara</button>
  </form>
</section>
<?php $total = count($res['projects']) + count($res['products']) + count($res['chronicles']); ?>
<?php if ($qs !== '' && !$total): ?><p class="empty">“<?= e($qs) ?>” için sonuç bulunamadı.</p><?php endif; ?>

<?php if ($res['projects']): ?>
<section class="proj-grid proj-more">
  <p class="more-title">Projeler</p>
  <?php foreach ($res['projects'] as $o): ?>
    <a class="proj-card" href="/proje/<?= e($o['slug']) ?>">
      <span class="proj-img"><img src="<?= e(img($o['cover'])) ?>" alt="" loading="lazy"></span>
      <span class="proj-name"><?= e($o['title']) ?></span><span class="proj-loc"><?= e($o['location']) ?></span>
    </a>
  <?php endforeach; ?>
</section>
<?php endif; ?>
<?php if ($res['products']): ?>
<section class="list-products"><p class="more-title">Koleksiyon</p><?= view('site/_product_grid', ['products' => $res['products']]) ?></section>
<?php endif; ?>
<?php if ($res['chronicles']): ?>
<section class="chron-grid chron-more">
  <p class="more-title">Günce</p>
  <?php foreach ($res['chronicles'] as $m): ?>
    <a class="chron-card" href="/gunce/<?= e($m['slug']) ?>">
      <span class="chron-img"><img src="<?= e(img($m['image'])) ?>" alt="" loading="lazy"></span>
      <span class="chron-label"><?= e($m['label'] ?: $m['title']) ?></span><span class="chron-ex"><?= e($m['excerpt']) ?></span>
    </a>
  <?php endforeach; ?>
</section>
<?php endif; ?>
<div class="spacer"></div>
