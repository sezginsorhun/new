<div class="page-head">
  <h1 class="page-title">Ana Sayfa</h1>
  <a class="btn-outline btn-sm" href="/" target="_blank" rel="noopener"><?= icon('eye', 14) ?> Ana sayfayı gör</a>
</div>

<section class="card overflow">
  <div class="card-head"><h2>Tam ekran görseller</h2><span class="muted small">Sırayla geçiş yapar</span></div>
  <form method="post">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="save_slides">
    <?php if (!$slides): ?><p class="empty">Henüz görsel yok. Aşağıdan ekleyin.</p><?php endif; ?>
    <div class="slide-list">
    <?php foreach ($slides as $s): ?>
      <div class="slide-row">
        <?= view('admin/_image', ['name' => 'slide[' . $s['id'] . '][image]', 'value' => $s['image'], 'label' => '']) ?>
        <div class="grid-2">
          <div><label class="label">Başlık</label><input class="field" name="slide[<?= $s['id'] ?>][title]" value="<?= e($s['title']) ?>"></div>
          <div><label class="label">Alt yazı</label><input class="field" name="slide[<?= $s['id'] ?>][subtitle]" value="<?= e($s['subtitle']) ?>"></div>
          <div><label class="label">Bağlantı</label><input class="field" name="slide[<?= $s['id'] ?>][link]" value="<?= e($s['link']) ?>" list="project-links" placeholder="/projeler/..."></div>
          <div class="grid-2 tight">
            <div><label class="label">Sıra</label><input class="field" type="number" name="slide[<?= $s['id'] ?>][sort]" value="<?= (int) $s['sort'] ?>"></div>
            <div class="end"><label class="check-inline"><input type="checkbox" name="slide[<?= $s['id'] ?>][active]" value="1"<?= $s['active'] ? ' checked' : '' ?>> Aktif</label></div>
          </div>
        </div>
        <button class="btn-ghost btn-sm danger" type="submit" form="del-slide-<?= $s['id'] ?>" data-confirm="Bu görsel kaldırılsın mı?"><?= icon('trash', 14) ?></button>
      </div>
    <?php endforeach; ?>
    </div>
    <?php if ($slides): ?><div class="card-foot"><span></span><button class="btn-primary btn-sm" type="submit">Görselleri kaydet</button></div><?php endif; ?>
  </form>
</section>

<datalist id="project-links">
  <?php foreach ($projects as $pr): ?><option value="/projeler/<?= e($pr['slug']) ?>"><?= e($pr['title']) ?></option><?php endforeach; ?>
</datalist>

<div class="form-grid mt-6">
  <form method="post" class="card pad stack">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="texts">
    <h2>Giriş metni</h2>
    <div><label class="label" for="tagline">Üst etiket</label><input class="field" id="tagline" name="tagline" value="<?= e(setting('tagline')) ?>"></div>
    <div><label class="label" for="intro_title">Başlık</label><input class="field" id="intro_title" name="intro_title" value="<?= e(setting('intro_title')) ?>"></div>
    <div><label class="label" for="intro_text">Metin</label><textarea class="field" id="intro_text" name="intro_text" rows="7"><?= e(setting('intro_text')) ?></textarea><p class="help">Paragrafları boş satırla ayırın.</p></div>
    <div class="grid-2">
      <div><label class="label" for="hft">Proje bölümü başlığı</label><input class="field" id="hft" name="home_featured_title" value="<?= e(setting('home_featured_title')) ?>"></div>
      <div><label class="label" for="si">Geçiş süresi (saniye)</label><input class="field" id="si" type="number" min="3" max="20" name="slide_interval" value="<?= e(setting('slide_interval', '6')) ?>"></div>
    </div>
    <p class="help">Ana sayfadaki projeler, proje düzenleme ekranında “Ana sayfada öne çıkar” işaretli olanlardır.</p>
    <div><button class="btn-primary btn-sm" type="submit">Kaydet</button></div>
  </form>

  <form method="post" enctype="multipart/form-data" class="card pad stack side">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="add_slide">
    <h2>Görsel ekle</h2>
    <?= view('admin/_image', ['name' => 'image', 'file' => 'image_file', 'value' => '', 'label' => '', 'hint' => 'Yatay, en az 2400 px genişlik önerilir.']) ?>
    <div><label class="label">Başlık</label><input class="field" name="title" placeholder="Proje adı"></div>
    <div><label class="label">Alt yazı</label><input class="field" name="subtitle" placeholder="Konum"></div>
    <div><label class="label">Bağlantı</label><input class="field" name="link" list="project-links" placeholder="/projeler/..."></div>
    <button class="btn-primary w-full" type="submit">Ekle</button>
  </form>
</div>

<?php foreach ($slides as $s): ?>
  <form method="post" id="del-slide-<?= $s['id'] ?>"><?= csrf_field() ?><input type="hidden" name="action" value="delete_slide"><input type="hidden" name="id" value="<?= $s['id'] ?>"></form>
<?php endforeach; ?>
