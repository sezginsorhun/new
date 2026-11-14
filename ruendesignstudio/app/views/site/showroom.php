<section class="slider slider-tri" data-slider>
  <?php foreach ($images as $i => $im): ?>
    <figure class="slide<?= $i === 0 ? ' is-active' : '' ?>"><img src="<?= e(img($im['path'])) ?>" alt="" <?= $i ? 'loading="lazy"' : 'fetchpriority="high"' ?>></figure>
  <?php endforeach; ?>
  <?php if (count($images) > 1): ?>
    <button class="sl-arrow sl-prev" type="button" data-prev aria-label="Önceki">‹</button>
    <button class="sl-arrow sl-next" type="button" data-next aria-label="Sonraki">›</button>
  <?php endif; ?>
</section>

<section class="center-head">
  <h1 class="h-wide"><?= e($s['name']) ?></h1>
  <div class="serif-intro"><?= paragraphs($s['intro']) ?></div>
  <p class="sr-info">
    <?php if ($s['hours']): ?><span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><?= e($s['hours']) ?></span><?php endif; ?>
    <?php if ($s['phone']): ?><span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2"/></svg><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', $s['phone'])) ?>"><?= e($s['phone']) ?></a></span><?php endif; ?>
    <?php if ($s['address']): ?><span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg><a href="https://www.google.com/maps/search/?api=1&query=<?= rawurlencode(str_replace("\n", ' ', $s['address'])) ?>" target="_blank" rel="noopener"><?= e(str_replace("\n", ', ', $s['address'])) ?></a></span><?php endif; ?>
  </p>
</section>

<?php if ($s['body']): ?>
<section class="grey-band">
  <h2 class="h-wide h-sm center">Dekorasyon hizmeti</h2>
  <div class="gb-row">
    <figure class="gb-img reveal"><img src="<?= e(img(setting('univers_menu_image'))) ?>" alt="" loading="lazy"></figure>
    <div class="gb-text serif-grey reveal">
      <?= paragraphs($s['body']) ?>
      <a class="btn-black" href="/tasarim-hizmeti">Daha fazla bilgi</a>
    </div>
  </div>
</section>
<?php endif; ?>

<section class="visit">
  <h2 class="h-wide h-sm center">Bizi ziyaret edin</h2>
  <?= view('site/_form', ['type' => 'showroom', 'form' => $form, 'fields' => ['name', 'surname', 'email', 'phone', 'date'], 'submit' => 'Gönder']) ?>
</section>
