<section class="ds-intro">
  <figure class="ds-img reveal"><img src="<?= e(img($page['image'])) ?>" alt="" fetchpriority="high"></figure>
  <div class="ds-text">
    <h1 class="h-display h-md"><?= e($page['title']) ?></h1>
    <?php if ($page['subtitle']): ?><p class="ds-sub"><?= e($page['subtitle']) ?></p><?php endif; ?>
    <div class="sans-text sans-justify"><?= paragraphs($page['body']) ?></div>
    <a class="btn-black" href="#form">Randevu alın</a>
  </div>
</section>

<section class="ds-strip">
  <?php foreach (['salon-sade', 'beyaz-kose', 'calisma-odasi', 'antre'] as $i => $img): ?>
    <figure class="ds-strip-<?= $i ?> reveal"><img src="<?= e(img('assets/demo/' . $img . '.webp')) ?>" alt="" loading="lazy"></figure>
  <?php endforeach; ?>
</section>

<?php if ($steps): ?>
<section class="steps">
  <h2 class="h-display h-md">Hizmetimiz</h2>
  <div class="steps-row">
    <?php foreach ($steps as $i => $st): ?>
      <div class="step reveal" style="--i: <?= $i ?>">
        <p class="step-num"><?= str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT) ?> <span><?= $i < 2 ? '↓' : '→' ?></span></p>
        <p class="step-title"><?= e($st['title']) ?></p>
        <p class="step-text"><?= e($st['text']) ?></p>
      </div>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>

<section class="ds-form">
  <div class="ds-form-l">
    <h2 class="h-display h-md">Size özel<br>projeniz</h2>
    <p class="sans-text sans-justify">Arzularınızı daha iyi anlamak ve projenizi birlikte hayal etmek için bilgilerinizi bırakın. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
    <figure><img src="<?= e(img('assets/demo/salon-galeri.webp')) ?>" alt="" loading="lazy"></figure>
  </div>
  <div class="ds-form-r">
    <?= view('site/_form', ['type' => 'proje', 'form' => $form, 'fields' => ['name', 'surname', 'email', 'phone', 'body', 'city'], 'submit' => 'Gönder']) ?>
  </div>
</section>
