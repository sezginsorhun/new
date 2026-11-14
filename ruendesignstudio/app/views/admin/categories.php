<h1 class="page-title">Kategoriler</h1>

<div class="form-grid">
  <form method="post" class="card overflow">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="save">
    <table class="table">
      <thead><tr><th>Ad</th><th>Adres</th><th class="w-sort">Sıra</th><th>Proje</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($categories as $c): ?>
        <tr>
          <td><input class="field field-sm" name="cat[<?= $c['id'] ?>][name]" value="<?= e($c['name']) ?>"></td>
          <td><input class="field field-sm" name="cat[<?= $c['id'] ?>][slug]" value="<?= e($c['slug']) ?>"></td>
          <td><input class="field field-sm" type="number" name="cat[<?= $c['id'] ?>][sort]" value="<?= (int) $c['sort'] ?>"></td>
          <td class="muted"><?= (int) $c['n'] ?></td>
          <td class="right"><button class="btn-ghost btn-sm danger" type="submit" form="del-cat-<?= $c['id'] ?>" data-confirm="“<?= e($c['name']) ?>” silinsin mi? Projeleri silinmez, kategorisiz kalır."><?= icon('trash', 14) ?></button></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <div class="card-foot">
      <p class="help">Projesi olmayan kategoriler sitedeki filtrede görünmez.</p>
      <button class="btn-primary btn-sm" type="submit">Kaydet</button>
    </div>
  </form>

  <form method="post" class="card pad stack side">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="add">
    <h2>Yeni kategori</h2>
    <div><label class="label" for="cn">Ad</label><input class="field" id="cn" name="name" required></div>
    <div><label class="label" for="cs">Sıra</label><input class="field" id="cs" type="number" name="sort" value="<?= count($categories) ?>"></div>
    <button class="btn-primary w-full" type="submit">Ekle</button>
  </form>
</div>

<?php foreach ($categories as $c): ?>
  <form method="post" id="del-cat-<?= $c['id'] ?>"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= $c['id'] ?>"></form>
<?php endforeach; ?>
