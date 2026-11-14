<?php
/**
 * Görsel alanı: önizleme + bilgisayardan yükle + kütüphaneden seç (+ isteğe bağlı kaldır).
 * $name: gizli alan adı (kütüphane yolu), $file: dosya alanı adı (boşsa yükleme yok),
 * $value: mevcut yol, $label, $hint, $clear: kaldır kutusu adı.
 */
$file = $file ?? '';
$clear = $clear ?? '';
$hint = $hint ?? '';
$uid = 'img' . substr(md5($name . random_int(0, PHP_INT_MAX)), 0, 8);
?>
<div class="image-field" data-image-field>
  <?php if (!empty($label)): ?><p class="label"><?= e($label) ?></p><?php endif; ?>
  <div class="image-field-row">
    <div class="thumb thumb-lg" data-preview>
      <?php if ($value): ?><img src="<?= e(img($value)) ?>" alt=""><?php else: ?><span>Görsel yok</span><?php endif; ?>
    </div>
    <div class="image-field-actions">
      <input type="hidden" name="<?= e($name) ?>" value="" data-path>
      <?php if ($file): ?>
        <label class="btn-outline btn-sm" for="<?= $uid ?>"><?= icon('upload', 14) ?> Bilgisayardan yükle</label>
        <input id="<?= $uid ?>" type="file" name="<?= e($file) ?>" accept="image/jpeg,image/png,image/webp,image/gif" hidden data-file>
      <?php endif; ?>
      <button type="button" class="btn-ghost btn-sm" data-pick><?= icon('images', 14) ?> Kütüphaneden seç</button>
      <?php if ($clear && $value): ?>
        <label class="check-inline"><input type="checkbox" name="<?= e($clear) ?>" value="1"> Görseli kaldır</label>
      <?php endif; ?>
      <p class="help" data-file-name><?= e($hint) ?></p>
    </div>
  </div>
</div>
