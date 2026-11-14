<section class="pdp">
  <div class="pdp-media" data-pdp>
    <div class="pdp-thumbs">
      <?php foreach ($images as $i => $im): ?>
        <button type="button" class="pdp-thumb<?= $i === 0 ? ' is-active' : '' ?>" data-src="<?= e(img($im['path'])) ?>" aria-label="Görsel <?= $i + 1 ?>"><img src="<?= e(img($im['path'])) ?>" alt="" loading="lazy"></button>
      <?php endforeach; ?>
    </div>
    <figure class="pdp-main">
      <img src="<?= e(img($p['cover'])) ?>" alt="<?= e($p['name']) ?>" data-pdp-main>
      <button type="button" class="wl-btn" data-wl="<?= (int) $p['id'] ?>" aria-label="İstek listesine ekle" aria-pressed="false">
        <svg width="18" height="17" viewBox="0 0 24 22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20.5S2 14.6 2 7.8A5 5 0 0 1 12 5a5 5 0 0 1 10 2.8c0 6.8-10 12.7-10 12.7Z"/></svg>
      </button>
    </figure>
  </div>

  <div class="pdp-info">
    <?php if ($p['type_name']): ?><a class="pdp-type" href="/urunler/<?= e($p['type_slug']) ?>"><?= e($p['type_name']) ?></a><?php endif; ?>
    <div class="pdp-titleline">
      <h1 class="h-wide pdp-name"><?= e($p['name']) ?></h1>
      <p class="pdp-price"><?= e($p['price']) ?></p>
    </div>
    <div class="serif-text pdp-desc"><?= paragraphs($p['description']) ?></div>
    <?php if ($p['collection_name']): ?><p class="pdp-coll"><a href="/koleksiyon/<?= e($p['collection_slug']) ?>"><?= e($p['collection_name']) ?> koleksiyonunu keşfedin</a></p><?php endif; ?>

    <?php if ($p['finishes']): ?>
      <p class="pdp-label">Bitişler</p>
      <p class="pdp-sub"><?= e($p['finishes']) ?></p>
    <?php endif; ?>

    <a class="btn-black w-full" href="#form" data-open-inquiry>Bilgi talep edin</a>
    <a class="btn-outline-dark w-full" href="/iletisim">Showroom randevusu</a>

    <div class="tabs" data-tabs>
      <div class="tab-heads" role="tablist">
        <button type="button" role="tab" aria-selected="true" data-tab="0">Özellikler</button>
        <?php if ($p['craft']): ?><button type="button" role="tab" aria-selected="false" data-tab="1">Zanaat</button><?php endif; ?>
        <?php if ($p['making']): ?><button type="button" role="tab" aria-selected="false" data-tab="2">Üretim</button><?php endif; ?>
      </div>
      <div class="tab-panel" data-panel="0">
        <dl class="spec">
          <?php if ($p['dimensions']): ?><div><dt>Ölçüler</dt><dd><?= e($p['dimensions']) ?></dd></div><?php endif; ?>
          <?php if ($p['finishes']): ?><div><dt>Bitişler</dt><dd><?= e($p['finishes']) ?></dd></div><?php endif; ?>
          <?php if ($p['collection_name']): ?><div><dt>Koleksiyon</dt><dd><?= e($p['collection_name']) ?></dd></div><?php endif; ?>
        </dl>
      </div>
      <?php if ($p['craft']): ?><div class="tab-panel" data-panel="1" hidden><div class="sans-text"><?= paragraphs($p['craft']) ?></div></div><?php endif; ?>
      <?php if ($p['making']): ?><div class="tab-panel" data-panel="2" hidden><div class="sans-text"><?= paragraphs($p['making']) ?></div></div><?php endif; ?>
    </div>
  </div>
</section>

<section class="services">
  <div class="svc">
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="6"/><path d="M3 28c0-5 4-8 9-8s9 3 9 8M22 6h7v6h-4l-3 3V6Z"/></svg>
    <p class="svc-title">Kişiye özel hizmet</p>
    <p class="svc-text">Ekiplerimiz her türlü bilgi talebiniz için size bire bir eşlik eder.</p>
  </div>
  <div class="svc">
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="4" y="9" width="24" height="16" rx="1"/><path d="m4 10 12 9 12-9"/></svg>
    <p class="svc-title">Dünyanın her yerine teslimat</p>
    <p class="svc-text">Parçalarınız her aşamada kişisel takip ile dünyanın her yerine teslim edilir.</p>
  </div>
  <div class="svc">
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="7" y="14" width="18" height="14" rx="1"/><path d="M11 14V9a5 5 0 0 1 10 0v5M16 19v4"/></svg>
    <p class="svc-title">Siparişe özel üretim</p>
    <p class="svc-text">Her parça Türkiye'deki atölyelerimizde sizin için üretilir.</p>
  </div>
</section>

<section class="inquiry" id="talep">
  <h2 class="h-wide h-sm">Bilgi talebi — <?= e($p['name']) ?></h2>
  <?= view('site/_form', ['type' => 'urun', 'form' => $form, 'fields' => ['name', 'surname', 'email', 'phone', 'body'], 'submit' => 'Gönder']) ?>
</section>

<?php if ($related): ?>
<section class="related">
  <h2 class="h-wide h-sm">Bunları da sevebilirsiniz</h2>
  <?= view('site/_product_grid', ['products' => $related]) ?>
</section>
<?php endif; ?>
