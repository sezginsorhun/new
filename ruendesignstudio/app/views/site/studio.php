<section class="studio">
  <figure class="studio-img">
    <img src="<?= e(img($page['image'], 4)) ?>" alt="<?= e(setting('site_name')) ?>">
  </figure>
  <div class="studio-text">
    <h1><?= e($page['title']) ?></h1>
    <div class="prose"><?= paragraphs($page['body']) ?></div>
    <a class="link-line" href="/iletisim">Bize ulaşın</a>
  </div>
</section>
