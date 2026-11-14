<div class="page-head">
  <div>
    <a class="back" href="<?= e(admin_url('sayfalar')) ?>">← Sayfalar</a>
    <h1 class="page-title"><?= e($page['title']) ?></h1>
  </div>
  <a class="btn-outline btn-sm" href="/<?= e($page['slug']) ?>" target="_blank" rel="noopener"><?= icon('eye', 14) ?> Sitede gör</a>
</div>
<form method="post" enctype="multipart/form-data" class="form-grid">
  <?= csrf_field() ?>
  <section class="card pad stack">
    <div><label class="label" for="t">Başlık</label><input class="field" id="t" name="title" value="<?= e($page['title']) ?>"></div>
    <div>
      <label class="label" for="b">Metin</label>
      <textarea class="field" id="b" name="body" rows="18"><?= e($page['body']) ?></textarea>
      <p class="help">Paragrafları boş satırla ayırın. “## Başlık” yazan satır ara başlık olur.</p>
    </div>
  </section>
  <aside class="stack side">
    <section class="card pad stack">
      <button class="btn-primary w-full" type="submit">Kaydet</button>
    </section>
    <?php if ($page['slug'] === 'studyo'): ?>
    <section class="card pad">
      <?= view('admin/_image', ['name' => 'image', 'file' => 'image_file', 'value' => $page['image'], 'label' => 'Sayfa görseli', 'clear' => 'image_clear', 'hint' => 'Dikey görsel önerilir.']) ?>
    </section>
    <?php endif; ?>
  </aside>
</form>
