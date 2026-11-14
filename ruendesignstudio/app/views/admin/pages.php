<h1 class="page-title">Sayfalar</h1>
<div class="card overflow">
  <table class="table">
    <thead><tr><th>Sayfa</th><th>Adres</th><th>Son güncelleme</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($pages as $pg): ?>
      <tr>
        <td><a href="<?= e(admin_url('sayfalar/' . $pg['slug'])) ?>"><strong><?= e($pg['title']) ?></strong></a></td>
        <td class="muted">/<?= e($pg['slug']) ?></td>
        <td class="muted small"><?= e(tr_date($pg['updated_at'], true)) ?></td>
        <td class="right nowrap"><a class="btn-ghost btn-sm" href="<?= e(admin_url('sayfalar/' . $pg['slug'])) ?>">Düzenle</a><a class="btn-ghost btn-sm" href="/<?= e($pg['slug']) ?>" target="_blank" rel="noopener"><?= icon('external', 14) ?></a></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>
