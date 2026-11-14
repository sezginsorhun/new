<section class="contact-split">
  <div class="contact-l">
    <h1 class="h-wide h-sm"><?= e($page['subtitle'] ?: 'Bizi bulun') ?></h1>
    <div class="addr-grid">
      <?php foreach ($showrooms as $s): ?>
        <div class="addr">
          <p class="addr-name"><a href="/adres/<?= e($s['slug']) ?>"><?= e($s['name']) ?>:</a></p>
          <p class="addr-line"><?= nl2br(e($s['address'])) ?></p>
          <?php if ($s['phone']): ?><p class="addr-line"><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', $s['phone'])) ?>"><?= e($s['phone']) ?></a></p><?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>

    <h2 class="h-wide h-sm"><?= e($page['title']) ?></h2>
    <div class="sans-text"><?= paragraphs($page['body']) ?></div>
    <?php if (setting('contact_email')): ?><p class="sans-text"><a class="u" href="mailto:<?= e(setting('contact_email')) ?>"><?= e(setting('contact_email')) ?></a></p><?php endif; ?>
    <?= view('site/_form', ['type' => 'iletisim', 'form' => $form, 'fields' => ['name', 'surname', 'email', 'phone', 'body'], 'submit' => 'Gönder']) ?>
  </div>
  <figure class="contact-img"><img src="<?= e(img($page['image'])) ?>" alt="" fetchpriority="high"></figure>
</section>
