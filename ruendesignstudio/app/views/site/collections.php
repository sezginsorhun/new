<section class="hero-band"><img src="<?= e(img(setting('collections_hero'))) ?>" alt="" fetchpriority="high"></section>

<section class="center-head">
  <h1 class="h-wide">Koleksiyonlarımız</h1>
  <div class="serif-intro"><?= paragraphs(setting('collections_intro')) ?></div>
</section>

<?php foreach ($collections as $i => $c): ?>
<section class="coll-block<?= $i % 2 ? ' is-rev' : '' ?>">
  <div class="coll-row">
    <div class="coll-text reveal">
      <?php if ($c['label']): ?><p class="coll-label"><?= e($c['label']) ?></p><?php endif; ?>
      <h2 class="h-display h-md"><?= e($c['name']) ?></h2>
      <div class="caps-text"><?= paragraphs($c['description']) ?></div>
      <a class="btn-ghost" href="/koleksiyon/<?= e($c['slug']) ?>">Tümünü gör</a>
    </div>
    <a class="coll-img reveal" href="/koleksiyon/<?= e($c['slug']) ?>"><img src="<?= e(img($c['image'])) ?>" alt="<?= e($c['name']) ?>" loading="lazy"></a>
  </div>
  <?php if ($c['products']): ?>
    <?= view('site/_product_grid', ['products' => $c['products']]) ?>
  <?php endif; ?>
</section>
<?php endforeach; ?>
<div class="spacer"></div>
