<div class="page-head">
  <div>
    <a class="back" href="<?= e(admin_url('projeler')) ?>">← Projeler</a>
    <h1 class="page-title"><?= e($p['id'] ? $p['title'] : 'Yeni proje') ?></h1>
  </div>
  <?php if ($p['id'] && $p['published']): ?>
    <a class="btn-outline btn-sm" href="/projeler/<?= e($p['slug']) ?>" target="_blank" rel="noopener"><?= icon('eye', 14) ?> Sitede gör</a>
  <?php endif; ?>
</div>

<form method="post" enctype="multipart/form-data" class="form-grid" id="project-form">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="save">

  <div class="stack">
    <section class="card pad stack">
      <h2>Genel Bilgiler</h2>
      <div>
        <label class="label" for="title">Proje adı *</label>
        <input class="field" id="title" name="title" value="<?= e($p['title']) ?>" required>
      </div>
      <div class="grid-3">
        <div>
          <label class="label" for="category_id">Kategori</label>
          <select class="field" id="category_id" name="category_id">
            <option value="">—</option>
            <?php foreach ($categories as $c): ?><option value="<?= $c['id'] ?>"<?= $p['category_id'] == $c['id'] ? ' selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach; ?>
          </select>
        </div>
        <div>
          <label class="label" for="location">Konum</label>
          <input class="field" id="location" name="location" value="<?= e($p['location']) ?>" placeholder="İstanbul, Bebek">
        </div>
        <div class="grid-2 tight">
          <div>
            <label class="label" for="year">Yıl</label>
            <input class="field" id="year" name="year" value="<?= e($p['year']) ?>">
          </div>
          <div>
            <label class="label" for="area">Ölçek</label>
            <input class="field" id="area" name="area" value="<?= e($p['area']) ?>" placeholder="240 m²">
          </div>
        </div>
      </div>
      <div>
        <label class="label" for="summary">Kısa açıklama</label>
        <textarea class="field" id="summary" name="summary" rows="2"><?= e($p['summary']) ?></textarea>
        <p class="help">Proje sayfasında başlığın altında görünür.</p>
      </div>
      <div>
        <label class="label" for="body">Proje metni</label>
        <textarea class="field" id="body" name="body" rows="10"><?= e($p['body']) ?></textarea>
        <p class="help">Paragrafları boş satırla ayırın. “## Başlık” yazan satır ara başlık olur.</p>
      </div>
    </section>

    <section class="card pad stack" id="galeri">
      <div class="card-head flat">
        <h2>Galeri</h2>
        <span class="muted small"><?= count($images) ?> görsel</span>
      </div>
      <?php if ($images): ?>
      <div class="gallery-admin">
        <?php foreach ($images as $im): ?>
          <div class="gallery-admin-item">
            <div class="thumb thumb-md"><img src="<?= e(img($im['path'])) ?>" alt=""></div>
            <input class="field field-sm" name="img[<?= $im['id'] ?>][caption]" value="<?= e($im['caption']) ?>" placeholder="Açıklama (isteğe bağlı)">
            <div class="row-between">
              <label class="small muted">Sıra <input class="field field-xs" type="number" name="img[<?= $im['id'] ?>][sort]" value="<?= (int) $im['sort'] ?>"></label>
              <button class="btn-ghost btn-sm danger" type="submit" form="del-img-<?= $im['id'] ?>" title="Kaldır"><?= icon('trash', 14) ?></button>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>
      <div class="dropzone">
        <label class="btn-outline btn-sm" for="gallery_files"><?= icon('upload', 14) ?> Görsel yükle</label>
        <input id="gallery_files" type="file" name="gallery_files[]" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden data-multi-file>
        <button type="button" class="btn-ghost btn-sm" data-pick-multi="gallery_pick"><?= icon('images', 14) ?> Kütüphaneden ekle</button>
        <input type="hidden" name="gallery_pick" value="" data-multi-target="gallery_pick">
        <p class="help" data-multi-info>Birden fazla görsel seçebilirsiniz. Kaydettiğinizde galeriye eklenir.</p>
      </div>
    </section>

    <section class="card pad stack">
      <h2>SEO</h2>
      <div>
        <label class="label" for="slug">Adres</label>
        <div class="prefix"><span>/projeler/</span><input class="field" id="slug" name="slug" value="<?= e($p['slug']) ?>" placeholder="otomatik"></div>
      </div>
      <div>
        <label class="label" for="seo_title">Sayfa başlığı</label>
        <input class="field" id="seo_title" name="seo_title" value="<?= e($p['seo_title']) ?>" placeholder="<?= e($p['title']) ?>">
      </div>
      <div>
        <label class="label" for="seo_description">Arama motoru açıklaması</label>
        <textarea class="field" id="seo_description" name="seo_description" rows="2" placeholder="Boş bırakılırsa kısa açıklama kullanılır"><?= e($p['seo_description']) ?></textarea>
      </div>
    </section>
  </div>

  <aside class="stack side">
    <section class="card pad stack">
      <h2>Yayın</h2>
      <label class="check-inline"><input type="checkbox" name="published" value="1"<?= $p['published'] ? ' checked' : '' ?>> Sitede yayında</label>
      <label class="check-inline"><input type="checkbox" name="featured" value="1"<?= $p['featured'] ? ' checked' : '' ?>> Ana sayfada öne çıkar</label>
      <div>
        <label class="label" for="sort">Sıra</label>
        <input class="field" id="sort" type="number" name="sort" value="<?= (int) $p['sort'] ?>">
      </div>
      <button class="btn-primary w-full" type="submit">Kaydet</button>
    </section>

    <section class="card pad">
      <?= view('admin/_image', ['name' => 'cover', 'file' => 'cover_file', 'value' => $p['cover'], 'label' => 'Kapak görseli', 'clear' => 'cover_clear', 'hint' => 'Yatay, en az 2000 px genişlik önerilir.']) ?>
    </section>

    <?php if ($p['id']): ?>
    <section class="card pad">
      <button class="btn-ghost btn-sm danger w-full" type="submit" form="del-project" data-confirm="Bu proje ve galerisi kalıcı olarak silinecek. Emin misiniz?"><?= icon('trash', 14) ?> Projeyi sil</button>
    </section>
    <?php endif; ?>
  </aside>
</form>

<?php if ($p['id']): ?>
  <form method="post" id="del-project"><?= csrf_field() ?><input type="hidden" name="action" value="delete"></form>
  <?php foreach ($images as $im): ?>
    <form method="post" id="del-img-<?= $im['id'] ?>"><?= csrf_field() ?><input type="hidden" name="action" value="delete_image"><input type="hidden" name="image_id" value="<?= $im['id'] ?>"></form>
  <?php endforeach; ?>
<?php endif; ?>
