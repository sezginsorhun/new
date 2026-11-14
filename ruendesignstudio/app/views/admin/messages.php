<div class="page-head">
  <h1 class="page-title">Mesajlar</h1>
  <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="read_all"><button class="btn-outline btn-sm" type="submit">Tümünü okundu say</button></form>
</div>
<nav class="tabs">
  <a href="<?= e(admin_url('mesajlar')) ?>"<?= $filter === '' ? ' aria-current="page"' : '' ?>>Tümü</a>
  <a href="<?= e(admin_url('mesajlar?tur=okunmamis')) ?>"<?= $filter === 'okunmamis' ? ' aria-current="page"' : '' ?>>Okunmamış</a>
  <?php foreach (MESSAGE_TYPES as $k => $lab): ?>
    <a href="<?= e(admin_url('mesajlar?tur=' . $k)) ?>"<?= $filter === $k ? ' aria-current="page"' : '' ?>><?= e($lab) ?></a>
  <?php endforeach; ?>
</nav>
<div class="card overflow">
  <?php if (!$messages): ?>
    <p class="empty">Mesaj yok.</p>
  <?php else: ?>
  <table class="table">
    <thead><tr><th>Gönderen</th><th>Tür</th><th>Konu</th><th>Mesaj</th><th>Tarih</th></tr></thead>
    <tbody>
    <?php foreach ($messages as $m): ?>
      <tr class="<?= $m['is_read'] ? '' : 'is-unread' ?>">
        <td><a href="<?= e(admin_url('mesajlar/' . $m['id'])) ?>"><strong><?= e($m['name']) ?></strong></a><div class="muted small"><?= e($m['email']) ?></div></td>
        <td><span class="badge"><?= e(MESSAGE_TYPES[$m['type']] ?? $m['type']) ?></span></td>
        <td><?= e($m['subject'] ?: '—') ?></td>
        <td class="muted"><?= e(excerpt($m['body'], 80)) ?></td>
        <td class="muted small nowrap"><?= e(tr_date($m['created_at'], true)) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>
