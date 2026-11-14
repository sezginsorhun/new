<?php
/*
 * Kolaj düzeni: referans sitedeki gibi görseller farklı boyutlarda, metin
 * blokları arada. Görsel sırası panelde belirlenir; çiftler dönüşümlü yerleşir.
 */
$paras = array_values(array_filter(array_map('trim', preg_split("/\n{2,}/", str_replace("\r\n", "\n", $p['body'])))));
$hero = $images[0] ?? null;
$rest = array_slice($images, 1);
?>
<section class="split-head">
  <h1 class="h-display"><?= e($p['title']) ?></h1>
  <div class="split-text">
    <div class="sans-text"><?= paragraphs($p['intro']) ?></div>
    <p class="proj-meta"><?= e($p['location']) ?></p>
  </div>
</section>

<section class="collage">
  <figure class="cl cl-wide reveal"><img src="<?= e(img($p['cover'])) ?>" alt="<?= e($p['title']) ?>"></figure>

  <?php if ($hero || $paras): ?>
  <div class="cl-row reveal">
    <?php if ($hero): ?><figure class="cl cl-small"><img src="<?= e(img($hero['path'])) ?>" alt="" loading="lazy"></figure><?php endif; ?>
    <div class="cl-text serif-text"><?php foreach (array_slice($paras, 0, 1) as $para) echo paragraphs($para); ?></div>
  </div>
  <?php endif; ?>

  <?php
  $chunks = array_chunk($rest, 2);
  foreach ($chunks as $ci => $pair):
      $alt = $ci % 3;
  ?>
    <?php if ($alt === 0 && count($pair) === 2): ?>
      <div class="cl-duo reveal">
        <figure class="cl cl-a"><img src="<?= e(img($pair[0]['path'])) ?>" alt="" loading="lazy"></figure>
        <figure class="cl cl-b"><img src="<?= e(img($pair[1]['path'])) ?>" alt="" loading="lazy"></figure>
      </div>
    <?php elseif ($alt === 1 && count($pair) === 2): ?>
      <div class="cl-duo cl-duo-rev reveal">
        <figure class="cl cl-b"><img src="<?= e(img($pair[0]['path'])) ?>" alt="" loading="lazy"></figure>
        <figure class="cl cl-a"><img src="<?= e(img($pair[1]['path'])) ?>" alt="" loading="lazy"></figure>
      </div>
      <?php if (isset($paras[1]) && $ci === 1): ?>
        <div class="cl-row cl-row-rev reveal"><div class="cl-text serif-text"><?= paragraphs($paras[1]) ?></div></div>
      <?php endif; ?>
    <?php else: ?>
      <?php foreach ($pair as $im): ?><figure class="cl cl-wide reveal"><img src="<?= e(img($im['path'])) ?>" alt="" loading="lazy"></figure><?php endforeach; ?>
    <?php endif; ?>
  <?php endforeach; ?>

  <?php if (isset($paras[1]) && count($chunks) < 2): ?>
    <div class="cl-row cl-row-rev reveal"><div class="cl-text serif-text"><?= paragraphs($paras[1]) ?></div></div>
  <?php endif; ?>
  <?php foreach (array_slice($paras, 2) as $para): ?>
    <div class="cl-row cl-row-rev reveal"><div class="cl-text serif-text"><?= paragraphs($para) ?></div></div>
  <?php endforeach; ?>
</section>

<?php if ($p['quote']): ?>
<section class="quote reveal">
  <blockquote>« <?= e($p['quote']) ?> »</blockquote>
  <?php if ($p['quote_author']): ?><p class="quote-by"><?= e($p['quote_author']) ?></p><?php endif; ?>
</section>
<?php endif; ?>

<?php if ($others): ?>
<section class="proj-grid proj-more">
  <p class="more-title"><?= e($p['category'] ?: 'Diğer projeler') ?></p>
  <?php foreach ($others as $o): ?>
    <a class="proj-card reveal" href="/proje/<?= e($o['slug']) ?>">
      <span class="proj-img"><img src="<?= e(img($o['cover'])) ?>" alt="<?= e($o['title']) ?>" loading="lazy"></span>
      <span class="proj-name"><?= e($o['title']) ?></span>
      <span class="proj-loc"><?= e($o['location']) ?></span>
    </a>
  <?php endforeach; ?>
</section>
<?php endif; ?>
