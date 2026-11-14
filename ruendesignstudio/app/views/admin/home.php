<div class="page-head">
  <h1 class="page-title">Ana Sayfa & Metinler</h1>
  <a class="btn-outline btn-sm" href="/" target="_blank" rel="noopener"><?= icon('eye', 14) ?> Ana sayfayı gör</a>
</div>
<p class="help mb-4">Ana sayfadaki üç küçük kutu proje kategorilerinin ilk altısıdır (Proje Kategorileri ekranındaki sıraya göre); adres kutuları ise Adresler ekranından gelir.</p>

<form method="post" enctype="multipart/form-data" class="stack max-900">
  <?= csrf_field() ?>
  <?php foreach ($groups as $gname => $items): ?>
    <section class="card pad stack">
      <h2><?= e($gname) ?></h2>
      <div class="settings-grid">
      <?php foreach ($items as $it): [$k, $label, $type] = $it; $hint = $it[3] ?? ''; $v = $s[$k] ?? ''; ?>
        <?php if ($type === 'image'): ?>
          <div class="sg-image"><?= view('admin/_image', ['name' => $k, 'file' => $k . '__file', 'value' => $v, 'label' => $label]) ?></div>
        <?php elseif ($type === 'textarea'): ?>
          <div class="sg-full"><label class="label" for="s-<?= e($k) ?>"><?= e($label) ?></label><textarea class="field" id="s-<?= e($k) ?>" name="<?= e($k) ?>" rows="<?= max(3, min(10, substr_count($v, "\n") + 3)) ?>"><?= e($v) ?></textarea><?php if ($hint): ?><p class="help"><?= e($hint) ?></p><?php endif; ?></div>
        <?php else: ?>
          <div><label class="label" for="s-<?= e($k) ?>"><?= e($label) ?></label><input class="field" id="s-<?= e($k) ?>" name="<?= e($k) ?>" value="<?= e($v) ?>"><?php if ($hint): ?><p class="help"><?= e($hint) ?></p><?php endif; ?></div>
        <?php endif; ?>
      <?php endforeach; ?>
      </div>
    </section>
  <?php endforeach; ?>
  <div class="sticky-save"><button class="btn-primary" type="submit">Kaydet</button></div>
</form>
