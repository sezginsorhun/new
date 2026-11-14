<h1 class="page-title">Panel</h1>

<?php if ($stats['unread'] || $noCover): ?>
<div class="alerts">
  <?php if ($stats['unread']): ?>
    <a class="alert-chip" href="<?= e(admin_url('mesajlar?durum=okunmamis')) ?>"><?= $stats['unread'] ?> okunmamış mesaj <?= icon('arrow', 13) ?></a>
  <?php endif; ?>
  <?php if ($noCover): ?>
    <a class="alert-chip" href="<?= e(admin_url('projeler')) ?>"><?= $noCover ?> projenin kapak görseli yok <?= icon('arrow', 13) ?></a>
  <?php endif; ?>
</div>
<?php endif; ?>

<div class="stats">
  <?php foreach ([
      ['Proje', $stats['projects'], $stats['published'] . ' yayında', 'folder'],
      ['Mesaj', $stats['messages'], $stats['unread'] . ' okunmamış', 'mail'],
      ['Medya', $stats['media'], 'yüklenen görsel', 'images'],
      ['Basın', $stats['press'], 'yayın kaydı', 'newspaper'],
  ] as [$label, $value, $sub, $ic]): ?>
    <div class="card stat">
      <div class="stat-top"><p class="stat-label"><?= e($label) ?></p><?= icon($ic, 17) ?></div>
      <p class="stat-value"><?= (int) $value ?></p>
      <p class="stat-sub"><?= e($sub) ?></p>
    </div>
  <?php endforeach; ?>
</div>

<div class="grid-2 mt-6">
  <section class="card overflow">
    <div class="card-head">
      <h2>Son Mesajlar</h2>
      <a href="<?= e(admin_url('mesajlar')) ?>" class="link">Tümü →</a>
    </div>
    <?php if (!$recentMessages): ?>
      <p class="empty">Henüz mesaj yok.</p>
    <?php else: ?>
      <table class="table">
        <tbody>
        <?php foreach ($recentMessages as $m): ?>
          <tr class="<?= $m['is_read'] ? '' : 'is-unread' ?>">
            <td><a href="<?= e(admin_url('mesajlar/' . $m['id'])) ?>"><strong><?= e($m['name']) ?></strong></a><div class="muted small"><?= e(excerpt($m['body'], 70)) ?></div></td>
            <td class="right muted small nowrap"><?= e(tr_date($m['created_at'], true)) ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </section>

  <section class="card overflow">
    <div class="card-head">
      <h2>Son Güncellenen Projeler</h2>
      <a href="<?= e(admin_url('projeler/yeni')) ?>" class="link">+ Yeni proje</a>
    </div>
    <table class="table">
      <tbody>
      <?php foreach ($recentProjects as $p): ?>
        <tr>
          <td class="w-thumb"><div class="thumb"><img src="<?= e(img($p['cover'], (int) $p['id'])) ?>" alt=""></div></td>
          <td><a href="<?= e(admin_url('projeler/' . $p['id'])) ?>"><strong><?= e($p['title']) ?></strong></a><div class="muted small"><?= e($p['category'] ?? '—') ?> · <?= e($p['location']) ?></div></td>
          <td class="right"><?= $p['published'] ? '<span class="badge badge-ok">Yayında</span>' : '<span class="badge">Taslak</span>' ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </section>
</div>
