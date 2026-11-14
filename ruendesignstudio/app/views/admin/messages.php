<div class="page-head">
  <h1 class="page-title">Mesajlar</h1>
  <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="read_all"><button class="btn-outline btn-sm" type="submit">Tümünü okundu say</button></form>
</div>
<nav class="tabs">
  <a href="<?= e(admin_url('mesajlar')) ?>"<?= $filter !== 'okunmamis' ? ' aria-current="page"' : '' ?>>Tümü</a>
  <a href="<?= e(admin_url('mesajlar?durum=okunmamis')) ?>"<?= $filter === 'okunmamis' ? ' aria-current="page"' : '' ?>>Okunmamış</a>
</nav>
<div class="card overflow">
  <?php if (!$messages): ?>
    <p class="empty">Mesaj yok.</p>
  <?php else: ?>
  <table class="table">
    <thead><tr><th>Gönderen</th><th>Konu</th><th>Mesaj</th><th>Tarih</th></tr></thead>
    <tbody>
    <?php foreach ($messages as $m): ?>
      <tr class="<?= $m['is_read'] ? '' : 'is-unread' ?>">
        <td><a href="<?= e(admin_url('mesajlar/' . $m['id'])) ?>"><strong><?= e($m['name']) ?></strong></a><div class="muted small"><?= e($m['email']) ?></div></td>
        <td><?= e($m['subject'] ?: '—') ?></td>
        <td class="muted"><?= e(excerpt($m['body'], 90)) ?></td>
        <td class="muted small nowrap"><?= e(tr_date($m['created_at'], true)) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>
