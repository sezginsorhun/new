<?php
$fields = $def['fields'];
$key = $def['key'] ?? 'id';
$main = array_filter($fields, fn($f) => empty($f['side']) && $f['type'] !== 'gallery');
$side = array_filter($fields, fn($f) => !empty($f['side']));
$galleryField = array_filter($fields, fn($f) => $f['type'] === 'gallery');
$publicUrl = ($item && !empty($def['url'])) ? str_replace('{slug}', (string) ($item['slug'] ?? ''), $def['url']) : '';

$renderField = function (string $name, array $f) use ($values, $options) {
    $v = $values[$name] ?? '';
    $id = 'f-' . $name;
    $req = !empty($f['required']) ? ' *' : '';
    $help = !empty($f['help']) ? '<p class="help">' . e($f['help']) . '</p>' : '';
    switch ($f['type']) {
        case 'check':
            return '<label class="check-inline"><input type="checkbox" name="' . e($name) . '" value="1"' . ($v ? ' checked' : '') . '> ' . e($f['label']) . '</label>' . $help;
        case 'image':
            return view('admin/_image', ['name' => $name, 'file' => $name . '__file', 'clear' => empty($f['required']) ? $name . '__clear' : '', 'value' => $v, 'label' => $f['label'] . $req, 'hint' => $f['help'] ?? '']);
        case 'select':
            $o = '<select class="field" id="' . $id . '" name="' . e($name) . '">';
            if (empty($f['required'])) $o .= '<option value="">—</option>';
            foreach ($options[$name] as $k => $lab) $o .= '<option value="' . e($k) . '"' . ((string) $k === (string) $v ? ' selected' : '') . '>' . e($lab) . '</option>';
            return '<div><label class="label" for="' . $id . '">' . e($f['label']) . $req . '</label>' . $o . '</select>' . $help . '</div>';
        case 'textarea':
        case 'richtext':
            return '<div><label class="label" for="' . $id . '">' . e($f['label']) . $req . '</label><textarea class="field" id="' . $id . '" name="' . e($name) . '" rows="' . (int) ($f['rows'] ?? 4) . '">' . e($v) . '</textarea>' . $help . '</div>';
        case 'number':
            return '<div><label class="label" for="' . $id . '">' . e($f['label']) . '</label><input class="field" type="number" id="' . $id . '" name="' . e($name) . '" value="' . (int) $v . '">' . $help . '</div>';
        case 'slug':
            return '<div><label class="label" for="' . $id . '">' . e($f['label']) . '</label><div class="prefix"><span>' . e($f['prefix'] ?? '/') . '</span><input class="field" id="' . $id . '" name="slug" value="' . e($v) . '" placeholder="otomatik"></div></div>';
        default:
            return '<div><label class="label" for="' . $id . '">' . e($f['label']) . $req . '</label><input class="field" id="' . $id . '" name="' . e($name) . '" value="' . e($v) . '"' . (!empty($f['required']) ? ' required' : '') . '>' . $help . '</div>';
    }
};
?>
<div class="page-head">
  <div>
    <a class="back" href="<?= e(admin_url($slug)) ?>">← <?= e($def['title']) ?></a>
    <h1 class="page-title"><?= e($title) ?></h1>
  </div>
  <?php if ($publicUrl): ?><a class="btn-outline btn-sm" href="<?= e($publicUrl) ?>" target="_blank" rel="noopener"><?= icon('eye', 14) ?> Sitede gör</a><?php endif; ?>
</div>

<form method="post" enctype="multipart/form-data" class="form-grid" id="crud-form">
  <?= csrf_field() ?>
  <div class="stack">
    <section class="card pad stack">
      <?php foreach ($main as $name => $f) echo $renderField($name, $f); ?>
    </section>

    <?php foreach ($galleryField as $gname => $gf): ?>
    <section class="card pad stack" id="galeri">
      <div class="card-head flat"><h2><?= e($gf['label']) ?></h2><span class="muted small"><?= count($gallery) ?> görsel</span></div>
      <?php if (!empty($gf['help'])): ?><p class="help"><?= e($gf['help']) ?></p><?php endif; ?>
      <?php if ($gallery): ?>
      <div class="gallery-admin">
        <?php foreach ($gallery as $g): ?>
          <div class="gallery-admin-item">
            <div class="thumb thumb-md"><img src="<?= e(img($g['path'])) ?>" alt="" loading="lazy"></div>
            <input class="field field-sm" name="g[<?= $g['id'] ?>][caption]" value="<?= e($g['caption']) ?>" placeholder="Açıklama (isteğe bağlı)">
            <div class="row-between">
              <label class="small muted">Sıra <input class="field field-xs" type="number" name="g[<?= $g['id'] ?>][sort]" value="<?= (int) $g['sort'] ?>"></label>
              <label class="small danger check-inline"><input type="checkbox" name="g[<?= $g['id'] ?>][del]" value="1"> Kaldır</label>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
      <?php if ($item): ?>
      <div class="dropzone">
        <label class="btn-outline btn-sm" for="gallery_files"><?= icon('upload', 14) ?> Görsel yükle</label>
        <input id="gallery_files" type="file" name="gallery_files[]" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden data-multi-file>
        <button type="button" class="btn-ghost btn-sm" data-pick-multi="gallery_pick"><?= icon('images', 14) ?> Kütüphaneden ekle</button>
        <input type="hidden" name="gallery_pick" value="" data-multi-target="gallery_pick">
        <p class="help" data-multi-info>Birden fazla görsel seçebilirsiniz. Kaydettiğinizde galeriye eklenir.</p>
      </div>
      <?php else: ?>
        <p class="help">Galeriye görsel eklemek için önce kaydı oluşturun.</p>
      <?php endif; ?>
    </section>
    <?php endforeach; ?>
  </div>

  <aside class="stack side">
    <section class="card pad stack">
      <h2>Yayın</h2>
      <?php foreach ($side as $name => $f) if ($f['type'] !== 'image') echo $renderField($name, $f); ?>
      <button class="btn-primary w-full" type="submit">Kaydet</button>
    </section>
    <?php foreach ($side as $name => $f) if ($f['type'] === 'image'): ?>
      <section class="card pad"><?= $renderField($name, $f) ?></section>
    <?php endif; ?>
    <?php if ($item && empty($def['fixed'])): ?>
      <section class="card pad">
        <button class="btn-ghost btn-sm danger w-full" type="submit" form="del-form" data-confirm="Bu kayıt kalıcı olarak silinecek. Emin misiniz?"><?= icon('trash', 14) ?> Sil</button>
      </section>
    <?php endif; ?>
  </aside>
</form>
<?php if ($item && empty($def['fixed'])): ?>
  <form method="post" id="del-form"><?= csrf_field() ?><input type="hidden" name="action" value="delete"></form>
<?php endif; ?>
