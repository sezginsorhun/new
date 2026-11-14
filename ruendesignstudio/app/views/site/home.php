<section class="home-hero">
  <a class="home-hero-media" href="<?= e(setting('hero_link', '/projeler')) ?>">
    <?php if (setting('hero_video')): ?>
      <video autoplay muted loop playsinline poster="<?= e(img(setting('hero_image'))) ?>"><source src="<?= e(img(setting('hero_video'))) ?>" type="video/mp4"></video>
    <?php else: ?>
      <img src="<?= e(img(setting('hero_image'))) ?>" alt="" fetchpriority="high">
    <?php endif; ?>
  </a>
  <div class="home-hero-cap">
    <p class="hh-title"><?= e(setting('hero_title')) ?></p>
    <p class="hh-sub"><?= e(setting('hero_subtitle')) ?></p>
  </div>
</section>

<section class="home-intro reveal">
  <div class="serif-grey"><?= paragraphs(setting('home_intro')) ?></div>
  <a class="lnk" href="/evren"><?= e(setting('home_intro_link', 'Evreni keşfedin')) ?></a>
</section>

<section class="home-tiles">
  <?php foreach ($tiles as $i => $c): ?>
    <a class="tile reveal<?= $i % 3 === 1 ? ' tile-mid' : '' ?>" href="/projeler/<?= e($c['slug']) ?>">
      <span class="tile-img"><img src="<?= e(img($c['image'])) ?>" alt="<?= e($c['name']) ?>" loading="lazy"></span>
      <span class="tile-name"><?= e($c['name']) ?></span>
    </a>
  <?php endforeach; ?>
</section>

<section class="home-block reveal">
  <h2 class="h-wide"><?= e(setting('home_projects_title', 'Projeler')) ?></h2>
  <div class="serif-grey"><?= paragraphs(setting('home_projects_text')) ?></div>
</section>

<section class="home-collection">
  <div class="hc-text reveal">
    <h2 class="h-wide"><?= e(setting('home_collection_title')) ?></h2>
    <div class="serif-grey"><?= paragraphs(setting('home_collection_text')) ?></div>
    <a class="lnk" href="/koleksiyonlar">Keşfedin</a>
  </div>
  <a class="hc-main reveal" href="/koleksiyonlar"><img src="<?= e(img(setting('home_collection_image'))) ?>" alt="" loading="lazy"></a>
  <a class="hc-a reveal" href="/mobilya"><img src="<?= e(img(setting('home_collection_image2'))) ?>" alt="" loading="lazy"></a>
  <a class="hc-b reveal" href="/butik"><img src="<?= e(img(setting('home_collection_image3'))) ?>" alt="" loading="lazy"></a>
</section>

<section class="home-block reveal">
  <h2 class="h-wide"><?= e(setting('home_addresses_title', 'Adreslerimiz')) ?></h2>
  <div class="serif-grey"><?= paragraphs(setting('home_addresses_text')) ?></div>
</section>

<section class="home-tiles home-addr">
  <?php foreach ($showrooms as $s): ?>
    <a class="tile reveal" href="/adres/<?= e($s['slug']) ?>">
      <span class="tile-img"><img src="<?= e(img($s['image'])) ?>" alt="<?= e($s['name']) ?>" loading="lazy"></span>
      <span class="tile-name"><?= e($s['name']) ?></span>
    </a>
  <?php endforeach; ?>
</section>

<section class="home-block home-meet reveal">
  <h2 class="h-wide"><?= e(setting('home_meet_title', 'Bizimle Tanışın')) ?></h2>
  <div class="serif-grey"><?= paragraphs(setting('home_meet_text')) ?></div>
  <a class="lnk-soft" href="/iletisim">İletişim</a>
</section>
