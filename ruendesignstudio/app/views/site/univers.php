<section class="slider slider-full" data-slider>
  <?php foreach ($slides as $i => $s): ?>
    <figure class="slide<?= $i === 0 ? ' is-active' : '' ?>">
      <img src="<?= e(img($s['image'])) ?>" alt="" <?= $i ? 'loading="lazy"' : 'fetchpriority="high"' ?>>
      <figcaption class="slide-cap-center"><?= e($s['title']) ?></figcaption>
    </figure>
  <?php endforeach; ?>
  <?php if (count($slides) > 1): ?>
    <button class="sl-arrow sl-prev" type="button" data-prev aria-label="Önceki">←</button>
    <button class="sl-arrow sl-next" type="button" data-next aria-label="Sonraki">→</button>
    <div class="sl-dots"><?php foreach ($slides as $i => $s): ?><button type="button" data-dot="<?= $i ?>" aria-label="<?= $i + 1 ?>"<?= $i === 0 ? ' aria-current="true"' : '' ?>></button><?php endforeach; ?></div>
  <?php endif; ?>
</section>

<section class="univers-duo">
  <div class="ud-inner">
    <figure class="ud-img reveal"><img src="<?= e(img($page['image'])) ?>" alt="" loading="lazy"></figure>
    <div class="ud-text reveal">
      <?= paragraphs($page['body']) ?>
    </div>
  </div>
</section>

<?php if ($art): ?>
<section class="univers-art">
  <?php foreach ($art as $i => $a): ?>
    <figure class="ua-item reveal">
      <img src="<?= e(img($a['image'])) ?>" alt="" loading="lazy">
      <?php if ($i === 0): ?><figcaption><?= e($a['title']) ?></figcaption><?php endif; ?>
    </figure>
  <?php endforeach; ?>
</section>
<?php endif; ?>

<section class="home-block reveal">
  <h2 class="h-wide">Ruen adresleri</h2>
</section>
<section class="home-tiles home-addr">
  <?php foreach ($showrooms as $s): ?>
    <a class="tile reveal" href="/adres/<?= e($s['slug']) ?>">
      <span class="tile-img"><img src="<?= e(img($s['image'])) ?>" alt="<?= e($s['name']) ?>" loading="lazy"></span>
      <span class="tile-name"><?= e($s['name']) ?></span>
    </a>
  <?php endforeach; ?>
</section>
<div class="spacer"></div>
