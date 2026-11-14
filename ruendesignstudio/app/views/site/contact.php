<section class="page-head">
  <h1>İletişim</h1>
</section>

<section class="contact">
  <div class="contact-info">
    <div>
      <p class="label-sm">Stüdyo</p>
      <p class="big"><?= nl2br(e(setting('contact_address'))) ?></p>
      <?php if (setting('map_url')): ?><p><a class="link-line" href="<?= e(setting('map_url')) ?>" target="_blank" rel="noopener">Haritada göster</a></p><?php endif; ?>
    </div>
    <?php if (setting('contact_email')): ?>
    <div>
      <p class="label-sm">E-posta</p>
      <p class="big"><a href="mailto:<?= e(setting('contact_email')) ?>"><?= e(setting('contact_email')) ?></a></p>
    </div>
    <?php endif; ?>
    <?php if (setting('contact_phone')): ?>
    <div>
      <p class="label-sm">Telefon</p>
      <p class="big"><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', setting('contact_phone'))) ?>"><?= e(setting('contact_phone')) ?></a></p>
    </div>
    <?php endif; ?>
    <?php if (setting('contact_hours')): ?>
    <div>
      <p class="label-sm">Çalışma saatleri</p>
      <p><?= e(setting('contact_hours')) ?></p>
    </div>
    <?php endif; ?>
  </div>

  <div class="contact-form" id="form">
    <?php if ($sent): ?>
      <div class="notice">
        <h2>Teşekkürler.</h2>
        <p>Mesajınız bize ulaştı; en kısa sürede size dönüş yapacağız.</p>
      </div>
    <?php else: ?>
    <h2>Bize yazın</h2>
    <?php if (!empty($errors['form'])): ?><p class="error"><?= e($errors['form']) ?></p><?php endif; ?>
    <form method="post" action="/iletisim#form" novalidate>
      <?= csrf_field() ?>
      <div class="hp" aria-hidden="true"><label>Web sitesi <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="row2">
        <label class="f">
          <span>Ad Soyad *</span>
          <input name="name" value="<?= e($old['name']) ?>" autocomplete="name" required>
          <?php if (!empty($errors['name'])): ?><em><?= e($errors['name']) ?></em><?php endif; ?>
        </label>
        <label class="f">
          <span>E-posta *</span>
          <input type="email" name="email" value="<?= e($old['email']) ?>" autocomplete="email" required>
          <?php if (!empty($errors['email'])): ?><em><?= e($errors['email']) ?></em><?php endif; ?>
        </label>
      </div>
      <div class="row2">
        <label class="f">
          <span>Telefon</span>
          <input type="tel" name="phone" value="<?= e($old['phone']) ?>" autocomplete="tel">
        </label>
        <label class="f">
          <span>Proje türü</span>
          <select name="subject">
            <?php foreach (['', 'Konut', 'Otel', 'Restoran', 'Ofis', 'Mağaza', 'Mobilya', 'Diğer'] as $o): ?>
              <option value="<?= e($o) ?>"<?= $old['subject'] === $o ? ' selected' : '' ?>><?= $o === '' ? 'Seçiniz' : e($o) ?></option>
            <?php endforeach; ?>
          </select>
        </label>
      </div>
      <label class="f">
        <span>Mesajınız *</span>
        <textarea name="body" rows="6" required><?= e($old['body']) ?></textarea>
        <?php if (!empty($errors['body'])): ?><em><?= e($errors['body']) ?></em><?php endif; ?>
      </label>
      <label class="check">
        <input type="checkbox" name="kvkk" value="1"<?= !empty($_POST['kvkk']) ? ' checked' : '' ?>>
        <span><a href="/kvkk" target="_blank">Aydınlatma metnini</a> okudum, kişisel verilerimin işlenmesini onaylıyorum.</span>
      </label>
      <?php if (!empty($errors['kvkk'])): ?><em class="error"><?= e($errors['kvkk']) ?></em><?php endif; ?>
      <button class="btn" type="submit">Gönder</button>
    </form>
    <?php endif; ?>
  </div>
</section>
