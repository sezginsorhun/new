<div class="page-head">
  <h1 class="page-title">Basın</h1>
  <a class="btn-outline btn-sm" href="/basin" target="_blank" rel="noopener"><?= icon('eye', 14) ?> Sitede gör</a>
</div>
<p class="help mb-4">Hiç yayında kayıt yoksa “Basın” bağlantısı sitede gizlenir.</p>

<div class="form-grid">
  <form method="post" class="card overflow">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="save">
    <?php if (!$items): ?><p class="empty">Henüz basın kaydı yok.</p><?php endif; ?>
    <div class="slide-list">
    <?php foreach ($items as $it): ?>
      <div class="slide-row">
        <?= view('admin/_image', ['name' => 'item[' . $it['id'] . '][image]', 'value' => $it['image'], 'label' => '']) ?>
        <div class="grid-2">
          <div><label class="label">Yayın</label><input class="field" name="item[<?= $it['id'] ?>][publication]" value="<?= e($it['publication']) ?>"></div>
          <div><label class="label">Sayı / tarih</label><input class="field" name="item[<?= $it['id'] ?>][issue]" value="<?= e($it['issue']) ?>"></div>
          <div><label class="label">Başlık</label><input class="field" name="item[<?= $it['id'] ?>][title]" value="<?= e($it['title']) ?>"></div>
          <div><label class="label">Bağlantı</label><input class="field" name="item[<?= $it['id'] ?>][link]" value="<?= e($it['link']) ?>" placeholder="https://"></div>
          <div><label class="label">Sıra</label><input class="field" type="number" name="item[<?= $it['id'] ?>][sort]" value="<?= (int) $it['sort'] ?>"></div>
          <div class="end"><label class="check-inline"><input type="checkbox" name="item[<?= $it['id'] ?>][published]" value="1"<?= $it['published'] ? ' checked' : '' ?>> Yayında</label></div>
        </div>
        <button class="btn-ghost btn-sm danger" type="submit" form="del-press-<?= $it['id'] ?>" data-confirm="Bu kayıt silinsin mi?"><?= icon('trash', 14) ?></button>
      </div>
    <?php endforeach; ?>
    </div>
    <?php if ($items): ?><div class="card-foot"><span></span><button class="btn-primary btn-sm" type="submit">Kaydet</button></div><?php endif; ?>
  </form>

  <form method="post" enctype="multipart/form-data" class="card pad stack side">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="add">
    <h2>Yeni yayın</h2>
    <?= view('admin/_image', ['name' => 'image', 'file' => 'image_file', 'value' => '', 'label' => 'Kapak', 'hint' => 'Dergi kapağı veya sayfa görüntüsü.']) ?>
    <div><label class="label">Yayın adı *</label><input class="field" name="publication" required placeholder="Dergi / gazete"></div>
    <div><label class="label">Başlık</label><input class="field" name="title"></div>
    <div><label class="label">Sayı / tarih</label><input class="field" name="issue" placeholder="Kasım 2026"></div>
    <div><label class="label">Bağlantı</label><input class="field" name="link" placeholder="https://"></div>
    <button class="btn-primary w-full" type="submit">Ekle</button>
  </form>
</div>

<?php foreach ($items as $it): ?>
  <form method="post" id="del-press-<?= $it['id'] ?>"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= $it['id'] ?>"></form>
<?php endforeach; ?>
