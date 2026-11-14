<?php $f = fn($k) => e($s[$k] ?? ''); ?>
<h1 class="page-title">Ayarlar</h1>
<form method="post" class="stack max-760">
  <?= csrf_field() ?>
  <section class="card pad stack">
    <h2>Site Bilgileri</h2>
    <div><label class="label" for="site_name">Site adı</label><input class="field" id="site_name" name="site_name" value="<?= $f('site_name') ?>"></div>
    <div class="grid-2">
      <div><label class="label" for="l1">Logo — üst satır</label><input class="field" id="l1" name="logo_line1" value="<?= $f('logo_line1') ?>"></div>
      <div><label class="label" for="l2">Logo — alt satır</label><input class="field" id="l2" name="logo_line2" value="<?= $f('logo_line2') ?>"></div>
    </div>
    <div><label class="label" for="fn">Alt bilgi notu</label><input class="field" id="fn" name="footer_note" value="<?= $f('footer_note') ?>"></div>
  </section>

  <section class="card pad stack">
    <h2>İletişim</h2>
    <div class="grid-2">
      <div><label class="label" for="ce">E-posta</label><input class="field" id="ce" type="email" name="contact_email" value="<?= $f('contact_email') ?>"></div>
      <div><label class="label" for="cp">Telefon</label><input class="field" id="cp" name="contact_phone" value="<?= $f('contact_phone') ?>" placeholder="+90 ..."></div>
    </div>
    <div><label class="label" for="ca">Adres</label><textarea class="field" id="ca" name="contact_address" rows="3"><?= $f('contact_address') ?></textarea></div>
    <div class="grid-2">
      <div><label class="label" for="ch">Çalışma saatleri</label><input class="field" id="ch" name="contact_hours" value="<?= $f('contact_hours') ?>"></div>
      <div><label class="label" for="mu">Harita bağlantısı</label><input class="field" id="mu" name="map_url" value="<?= $f('map_url') ?>" placeholder="https://maps.google.com/..."></div>
    </div>
    <div>
      <label class="label" for="ne">Form bildirim e-postası</label>
      <input class="field" id="ne" type="email" name="notify_email" value="<?= $f('notify_email') ?>">
      <p class="help">İletişim formundan gelen her mesaj bu adrese de gönderilir. Mesajlar her durumda panelde saklanır.</p>
    </div>
  </section>

  <section class="card pad stack">
    <h2>Sosyal Medya</h2>
    <div class="grid-3">
      <div><label class="label" for="ig">Instagram</label><input class="field" id="ig" name="instagram" value="<?= $f('instagram') ?>" placeholder="https://instagram.com/..."></div>
      <div><label class="label" for="pi">Pinterest</label><input class="field" id="pi" name="pinterest" value="<?= $f('pinterest') ?>" placeholder="https://"></div>
      <div><label class="label" for="li">LinkedIn</label><input class="field" id="li" name="linkedin" value="<?= $f('linkedin') ?>" placeholder="https://"></div>
    </div>
  </section>

  <section class="card pad stack">
    <h2>SEO</h2>
    <div><label class="label" for="st">Ana sayfa başlığı</label><input class="field" id="st" name="seo_title" value="<?= $f('seo_title') ?>"></div>
    <div><label class="label" for="sd">Açıklama</label><textarea class="field" id="sd" name="seo_description" rows="3"><?= $f('seo_description') ?></textarea><p class="help">Google sonuçlarında görünen 150–160 karakterlik özet.</p></div>
  </section>

  <div><button class="btn-primary" type="submit">Ayarları kaydet</button></div>
</form>
