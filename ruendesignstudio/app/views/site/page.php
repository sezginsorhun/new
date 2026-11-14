<section class="center-head page-simple">
  <h1 class="h-wide"><?= e($page['title']) ?></h1>
  <?php if ($page['subtitle']): ?><p class="list-eyebrow"><?= e($page['subtitle']) ?></p><?php endif; ?>
</section>
<?php if ($page['image']): ?><section class="hero-band hero-band-sm"><img src="<?= e(img($page['image'])) ?>" alt=""></section><?php endif; ?>
<section class="page-body serif-text"><?= paragraphs($page['body']) ?></section>
