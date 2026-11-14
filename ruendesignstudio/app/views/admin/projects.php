<div class="page-head">
  <h1 class="page-title">Projeler</h1>
  <a class="btn-primary btn-sm" href="<?= e(admin_url('projeler/yeni')) ?>"><?= icon('plus', 14) ?> Yeni proje</a>
</div>

<form class="toolbar" method="get">
  <input class="field" type="search" name="q" value="<?= e($search) ?>" placeholder="Proje adı veya konum ara">
  <select class="field" name="kategori">
    <option value="0">Tüm kategoriler</option>
    <?php foreach ($categories as $c): ?><option value="<?= $c['id'] ?>"<?= $cat == $c['id'] ? ' selected' : '' ?>><?= e($c['name']) ?></option><?php endforeach; ?>
  </select>
  <button class="btn-outline btn-sm" type="submit">Filtrele</button>
</form>

<form method="post" class="card overflow">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="reorder">
  <?php if (!$projects): ?>
    <p class="empty">Proje bulunamadı.</p>
  <?php else: ?>
  <table class="table">
    <thead><tr><th class="w-thumb"></th><th>Proje</th><th>Kategori</th><th>Galeri</th><th>Durum</th><th class="w-sort">Sıra</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($projects as $p): ?>
      <tr>
        <td><div class="thumb"><img src="<?= e(img($p['cover'], (int) $p['id'])) ?>" alt=""></div></td>
        <td><a href="<?= e(admin_url('projeler/' . $p['id'])) ?>"><strong><?= e($p['title']) ?></strong></a><div class="muted small"><?= e($p['location']) ?><?= $p['year'] ? ' · ' . e($p['year']) : '' ?></div></td>
        <td><?= e($p['category'] ?? '—') ?></td>
        <td class="muted"><?= (int) $p['image_count'] ?> görsel</td>
        <td>
          <?= $p['published'] ? '<span class="badge badge-ok">Yayında</span>' : '<span class="badge">Taslak</span>' ?>
          <?= $p['featured'] ? '<span class="badge badge-ink">Öne çıkan</span>' : '' ?>
        </td>
        <td><input class="field field-sm" type="number" name="sort[<?= $p['id'] ?>]" value="<?= (int) $p['sort'] ?>"></td>
        <td class="right nowrap">
          <a class="btn-ghost btn-sm" href="<?= e(admin_url('projeler/' . $p['id'])) ?>">Düzenle</a>
          <?php if ($p['published']): ?><a class="btn-ghost btn-sm" href="/projeler/<?= e($p['slug']) ?>" target="_blank" rel="noopener" title="Sitede gör"><?= icon('external', 14) ?></a><?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <div class="card-foot">
    <p class="help">Sıra numarası küçük olan önce görünür.</p>
    <button class="btn-outline btn-sm" type="submit">Sıralamayı kaydet</button>
  </div>
  <?php endif; ?>
</form>
