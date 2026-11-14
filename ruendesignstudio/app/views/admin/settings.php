<?php $f = fn($k) => e($s[$k] ?? ''); ?>
<h1 class="page-title">Ayarlar</h1>
<form method="post" class="stack max-760">
  <?= csrf_field() ?>
  <section class="card pad stack">
    <h2>Site ve logo</h2>
    <div><label class="label" for="site_name">Site adı</label><input class="field" id="site_name" name="site_name" value="<?= $f('site_name') ?>"></div>
    <div class="grid-3">
      <div><label class="label" for="l1">Logo — sol (büyük harf)</label><input class="field" id="l1" name="logo_left" value="<?= $f('logo_left') ?>"></div>
      <div><label class="label" for="l2">Logo — orta (italik serif)</label><input class="field" id="l2" name="logo_mid" value="<?= $f('logo_mid') ?>"></div>
      <div><label class="label" for="l3">Logo — sağ (büyük harf)</label><input class="field" id="l3" name="logo_right" value="<?= $f('logo_right') ?>"></div>
    </div>
    <p class="help">Logo üç parçadan oluşur: RUEN <em>Design</em> STUDIO.</p>
  </section>

  <section class="card pad stack">
    <h2>İletişim</h2>
    <div class="grid-2">
      <div><label class="label" for="ce">E-posta</label><input class="field" id="ce" type="email" name="contact_email" value="<?= $f('contact_email') ?>"></div>
      <div><label class="label" for="cp">Telefon</label><input class="field" id="cp" name="contact_phone" value="<?= $f('contact_phone') ?>"></div>
    </div>
    <div>
      <label class="label" for="ne">Form bildirim e-postası</label>
      <input class="field" id="ne" type="email" name="notify_email" value="<?= $f('notify_email') ?>">
      <p class="help">Sitedeki tüm formlardan gelen mesajlar bu adrese de gönderilir; her durumda panelde saklanır. Adres bilgileri “Adresler” ekranından düzenlenir.</p>
    </div>
  </section>

  <section class="card pad stack">
    <h2>Sosyal medya</h2>
    <div class="grid-3">
      <div><label class="label" for="ig">Instagram</label><input class="field" id="ig" name="instagram" value="<?= $f('instagram') ?>" placeholder="https://instagram.com/..."></div>
      <div><label class="label" for="pi">Pinterest</label><input class="field" id="pi" name="pinterest" value="<?= $f('pinterest') ?>" placeholder="https://"></div>
      <div><label class="label" for="li">LinkedIn</label><input class="field" id="li" name="linkedin" value="<?= $f('linkedin') ?>" placeholder="https://"></div>
    </div>
    <p class="help">Boş bırakılan hesap alt bilgide görünmez.</p>
  </section>

  <section class="card pad stack">
    <h2>SEO</h2>
    <div><label class="label" for="st">Ana sayfa başlığı</label><input class="field" id="st" name="seo_title" value="<?= $f('seo_title') ?>"></div>
    <div><label class="label" for="sd">Açıklama</label><textarea class="field" id="sd" name="seo_description" rows="3"><?= $f('seo_description') ?></textarea><p class="help">Google sonuçlarında görünen 150–160 karakterlik özet.</p></div>
  </section>

  <div><button class="btn-primary" type="submit">Ayarları kaydet</button></div>
</form>
