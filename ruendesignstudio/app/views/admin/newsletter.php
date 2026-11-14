<div class="page-head">
  <h1 class="page-title">Bülten</h1>
  <?php if ($items): ?><a class="btn-outline btn-sm" href="<?= e(admin_url('bulten?csv=1')) ?>"><?= icon('download', 14) ?> CSV indir</a><?php endif; ?>
</div>
<p class="help mb-4">Sitenin alt bilgisindeki bülten formundan kaydolan adresler. CSV dosyasını e-posta servisinize (Mailchimp, Brevo vb.) aktarabilirsiniz.</p>
<div class="card overflow">
  <?php if (!$items): ?>
    <p class="empty">Henüz abone yok.</p>
  <?php else: ?>
  <table class="table">
    <thead><tr><th>E-posta</th><th>Tarih</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($items as $n): ?>
      <tr>
        <td><a href="mailto:<?= e($n['email']) ?>"><?= e($n['email']) ?></a></td>
        <td class="muted small"><?= e(tr_date($n['created_at'], true)) ?></td>
        <td class="right"><form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= $n['id'] ?>"><button class="btn-ghost btn-sm danger" type="submit" data-confirm="Abone silinsin mi?"><?= icon('trash', 14) ?></button></form></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>
