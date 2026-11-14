<?php
/**
 * Ortak form. $type: form türü, $form: form_handle() sonucu,
 * $fields: gösterilecek alanlar, $submit: düğme metni.
 */
$o = $form['old'];
$er = $form['errors'];
$labels = ['name' => 'Ad', 'surname' => 'Soyad', 'email' => 'E-posta', 'phone' => 'Telefon', 'city' => 'Projenin şehri veya ülkesi', 'date' => 'Tercih ettiğiniz tarih', 'body' => 'Mesaj'];
$required = ['name', 'email'];
if ($type !== 'showroom') $required[] = 'body';
?>
<div class="form-wrap" id="form">
<?php if ($form['sent']): ?>
  <div class="form-done">
    <p class="h-wide h-sm">Teşekkürler</p>
    <p>Talebiniz bize ulaştı. Ekibimiz en kısa sürede size dönüş yapacaktır.</p>
  </div>
<?php else: ?>
  <?php if (!empty($er['form'])): ?><p class="f-err"><?= e($er['form']) ?></p><?php endif; ?>
  <form method="post" action="#form" class="rform" novalidate>
    <?= csrf_field() ?>
    <input type="hidden" name="_form" value="<?= e($type) ?>">
    <div class="hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>
    <div class="rform-grid">
      <?php foreach ($fields as $f): ?>
        <label class="rf<?= $f === 'body' || $f === 'city' ? ' rf-full' : '' ?>">
          <span><?= e($labels[$f]) ?><?= in_array($f, $required, true) ? '*' : '' ?></span>
          <?php if ($f === 'body'): ?>
            <textarea name="body" rows="5" placeholder="<?= $type === 'proje' ? 'Projenizi, istediğiniz üslubu, ilhamlarınızı anlatın…' : 'Mesajınız' ?>"><?= e($o['body']) ?></textarea>
          <?php else: ?>
            <input name="<?= $f ?>" type="<?= $f === 'email' ? 'email' : ($f === 'phone' ? 'tel' : ($f === 'date' ? 'date' : 'text')) ?>" value="<?= e($o[$f]) ?>" placeholder="<?= e($labels[$f]) ?>" autocomplete="<?= ['name' => 'given-name', 'surname' => 'family-name', 'email' => 'email', 'phone' => 'tel'][$f] ?? 'off' ?>">
          <?php endif; ?>
          <?php if (!empty($er[$f])): ?><em class="f-err"><?= e($er[$f]) ?></em><?php endif; ?>
        </label>
      <?php endforeach; ?>
    </div>
    <label class="rf-check">
      <input type="checkbox" name="kvkk" value="1"<?= !empty($_POST['kvkk']) ? ' checked' : '' ?>>
      <span><a href="/kvkk" target="_blank">Gizlilik politikasını</a> kabul ediyor ve kişisel verilerimin işlenmesine onay veriyorum.</span>
    </label>
    <?php if (!empty($er['kvkk'])): ?><em class="f-err"><?= e($er['kvkk']) ?></em><?php endif; ?>
    <button class="btn-black" type="submit"><?= e($submit ?? 'Gönder') ?></button>
  </form>
<?php endif; ?>
</div>
