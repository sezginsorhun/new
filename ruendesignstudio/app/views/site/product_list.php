<section class="hero-band"><img src="<?= e(img($hero)) ?>" alt="" fetchpriority="high"></section>

<section class="center-head">
  <?php if ($eyebrow): ?><p class="list-eyebrow"><?= e($eyebrow) ?></p><?php endif; ?>
  <h1 class="h-wide"><?= e($heading) ?></h1>
  <div class="serif-intro"><?= paragraphs($intro) ?></div>
</section>

<section class="list-products">
  <?= view('site/_product_grid', ['products' => $products]) ?>
</section>
