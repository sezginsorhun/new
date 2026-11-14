<div class="page-head">
  <h1 class="page-title">Medya</h1>
</div>

<form method="post" enctype="multipart/form-data" class="card pad dropzone-big" data-drop>
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="upload">
  <?= icon('upload', 22) ?>
  <p>Görselleri buraya sürükleyin ya da</p>
  <label class="btn-primary btn-sm">Bilgisayardan seçin<input type="file" name="files[]" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden data-auto-submit></label>
  <p class="help">JPG, PNG, WEBP · en fazla 15 MB. Görseller otomatik küçültülür ve WEBP'ye çevrilir.</p>
</form>

<?php if (!$items): ?>
  <p class="empty">Kütüphane boş.</p>
<?php else: ?>
<div class="media-grid mt-6">
  <?php foreach ($items as $m): ?>
    <figure class="card media-item">
      <a class="thumb thumb-sq" href="<?= e(img($m['path'])) ?>" target="_blank" rel="noopener"><img src="<?= e(img($m['path'])) ?>" alt="" loading="lazy"></a>
      <figcaption>
        <p class="small truncate" title="<?= e($m['original_name']) ?>"><?= e($m['original_name'] ?: basename($m['path'])) ?></p>
        <p class="muted xsmall"><?= (int) $m['width'] ?>×<?= (int) $m['height'] ?> · <?= number_format($m['size'] / 1024, 0, ',', '.') ?> KB</p>
        <form method="post">
          <?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= $m['id'] ?>">
          <button class="btn-ghost btn-sm danger" type="submit" data-confirm="Görsel kalıcı olarak silinsin mi?"><?= icon('trash', 13) ?> Sil</button>
        </form>
      </figcaption>
    </figure>
  <?php endforeach; ?>
</div>
<?php endif; ?>
