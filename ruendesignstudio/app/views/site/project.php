<article class="project">
  <figure class="project-cover">
    <img src="<?= e(img($p['cover'], $p['id'])) ?>" alt="<?= e($p['title']) ?>" fetchpriority="high">
  </figure>

  <header class="project-head">
    <div>
      <?php if ($p['category']): ?><a class="eyebrow" href="/kategori/<?= e($p['category_slug']) ?>"><?= e($p['category']) ?></a><?php endif; ?>
      <h1><?= e($p['title']) ?></h1>
      <?php if ($p['summary']): ?><p class="lead"><?= e($p['summary']) ?></p><?php endif; ?>
    </div>
    <dl class="project-facts">
      <?php if ($p['location']): ?><div><dt>Konum</dt><dd><?= e($p['location']) ?></dd></div><?php endif; ?>
      <?php if ($p['year']): ?><div><dt>Yıl</dt><dd><?= e($p['year']) ?></dd></div><?php endif; ?>
      <?php if ($p['area']): ?><div><dt>Ölçek</dt><dd><?= e($p['area']) ?></dd></div><?php endif; ?>
    </dl>
  </header>

  <?php if ($p['body']): ?>
    <div class="prose project-body"><?= paragraphs($p['body']) ?></div>
  <?php endif; ?>

  <?php if ($images): ?>
  <div class="gallery" data-gallery>
    <?php foreach ($images as $i => $im): ?>
      <figure class="gallery-item reveal<?= $i % 3 === 0 ? ' is-full' : '' ?>">
        <button type="button" class="gallery-open" data-full="<?= e(img($im['path'])) ?>" aria-label="Büyüt">
          <img src="<?= e(img($im['path'])) ?>" alt="<?= e($im['caption'] ?: $p['title']) ?>" loading="lazy">
        </button>
        <?php if ($im['caption']): ?><figcaption><?= e($im['caption']) ?></figcaption><?php endif; ?>
      </figure>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>

  <?php if ($next): ?>
  <a class="next-project" href="/projeler/<?= e($next['slug']) ?>">
    <span class="eyebrow">Sıradaki proje</span>
    <span class="next-title"><?= e($next['title']) ?></span>
  </a>
  <?php endif; ?>
</article>

<div class="lightbox" hidden data-lightbox>
  <button type="button" class="lightbox-close" aria-label="Kapat" data-lightbox-close>×</button>
  <img alt="">
</div>
