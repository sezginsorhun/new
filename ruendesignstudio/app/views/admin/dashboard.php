<h1 class="page-title">Panel</h1>

<?php $unreadN = (int) val('SELECT COUNT(*) FROM messages WHERE is_read = 0'); ?>
<?php if ($unreadN || $demoImages): ?>
<div class="alerts">
  <?php if ($unreadN): ?>
    <a class="alert-chip" href="<?= e(admin_url('mesajlar?tur=okunmamis')) ?>"><?= $unreadN ?> okunmamış mesaj <?= icon('arrow', 13) ?></a>
  <?php endif; ?>
  <?php if ($demoImages): ?>
    <a class="alert-chip" href="<?= e(admin_url('projeler')) ?>"><?= $demoImages ?> proje/ürün hâlâ demo görsel kullanıyor <?= icon('arrow', 13) ?></a>
  <?php endif; ?>
</div>
<?php endif; ?>

<div class="stats">
  <?php foreach ($stats as [$label, $value, $sub, $ic, $link]): ?>
    <a class="card stat" href="<?= e(admin_url($link)) ?>">
      <div class="stat-top"><p class="stat-label"><?= e($label) ?></p><?= icon($ic, 17) ?></div>
      <p class="stat-value"><?= (int) $value ?></p>
      <p class="stat-sub"><?= e($sub) ?></p>
    </a>
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
            <td><a href="<?= e(admin_url('mesajlar/' . $m['id'])) ?>"><strong><?= e($m['name']) ?></strong></a><div class="muted small"><?= e(MESSAGE_TYPES[$m['type']] ?? '') ?> · <?= e(excerpt($m['body'], 60)) ?></div></td>
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
          <td class="w-thumb"><div class="thumb"><img src="<?= e(img($p['cover'])) ?>" alt="" loading="lazy"></div></td>
          <td><a href="<?= e(admin_url('projeler/' . $p['id'])) ?>"><strong><?= e($p['title']) ?></strong></a><div class="muted small"><?= e($p['category'] ?? '—') ?> · <?= e($p['location']) ?></div></td>
          <td class="right"><?= $p['published'] ? '<span class="badge badge-ok">Yayında</span>' : '<span class="badge">Taslak</span>' ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </section>
</div>

<section class="card pad mt-6">
  <h2>Hızlı erişim</h2>
  <div class="quick">
    <a class="btn-outline btn-sm" href="<?= e(admin_url('projeler/yeni')) ?>"><?= icon('plus', 14) ?> Proje</a>
    <a class="btn-outline btn-sm" href="<?= e(admin_url('urunler/yeni')) ?>"><?= icon('plus', 14) ?> Ürün</a>
    <a class="btn-outline btn-sm" href="<?= e(admin_url('gunce/yeni')) ?>"><?= icon('plus', 14) ?> Günce yazısı</a>
    <a class="btn-outline btn-sm" href="<?= e(admin_url('anasayfa')) ?>"><?= icon('layout', 14) ?> Ana sayfa</a>
    <a class="btn-outline btn-sm" href="<?= e(admin_url('medya')) ?>"><?= icon('upload', 14) ?> Görsel yükle</a>
  </div>
</section>
