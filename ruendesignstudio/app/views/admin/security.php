<h1 class="page-title">Güvenlik</h1>
<div class="stats">
  <div class="card stat"><div class="stat-top"><p class="stat-label">Hatalı giriş (24 saat)</p><?= icon('shield', 17) ?></div><p class="stat-value"><?= $failed24 ?></p><p class="stat-sub">Bir IP 15 dakikada 8 hatalı denemede kilitlenir</p></div>
</div>
<section class="card overflow mt-6">
  <div class="card-head"><h2>Son giriş denemeleri</h2></div>
  <?php if (!$attempts): ?><p class="empty">Kayıt yok.</p><?php else: ?>
  <table class="table">
    <thead><tr><th>Tarih</th><th>E-posta</th><th>IP</th><th>Sonuç</th></tr></thead>
    <tbody>
    <?php foreach ($attempts as $a): ?>
      <tr>
        <td class="small nowrap"><?= e(tr_date($a['created_at'], true)) ?></td>
        <td><?= e($a['email']) ?></td>
        <td class="muted"><?= e($a['ip']) ?></td>
        <td><?= $a['success'] ? '<span class="badge badge-ok">Başarılı</span>' : '<span class="badge badge-err">Hatalı</span>' ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</section>
