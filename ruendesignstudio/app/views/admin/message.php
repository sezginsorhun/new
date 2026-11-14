<div class="page-head">
  <div>
    <a class="back" href="<?= e(admin_url('mesajlar')) ?>">← Mesajlar</a>
    <h1 class="page-title"><?= e($m['name']) ?></h1>
  </div>
  <div class="row-gap">
    <a class="btn-primary btn-sm" href="mailto:<?= e($m['email']) ?>?subject=<?= rawurlencode('Re: ' . ($m['subject'] ?: setting('site_name'))) ?>"><?= icon('mail', 14) ?> Yanıtla</a>
    <form method="post"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $m['id'] ?>"><input type="hidden" name="action" value="unread"><button class="btn-outline btn-sm" type="submit">Okunmadı yap</button></form>
    <form method="post"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $m['id'] ?>"><input type="hidden" name="action" value="delete"><button class="btn-ghost btn-sm danger" type="submit" data-confirm="Mesaj silinsin mi?"><?= icon('trash', 14) ?> Sil</button></form>
  </div>
</div>
<div class="form-grid">
  <section class="card pad">
    <div class="message-body"><?= nl2br(e($m['body'])) ?></div>
  </section>
  <aside class="card pad side">
    <dl class="dl">
      <dt>E-posta</dt><dd><a href="mailto:<?= e($m['email']) ?>"><?= e($m['email']) ?></a></dd>
      <?php if ($m['phone']): ?><dt>Telefon</dt><dd><a href="tel:<?= e(preg_replace('/[^0-9+]/', '', $m['phone'])) ?>"><?= e($m['phone']) ?></a></dd><?php endif; ?>
      <dt>Tür</dt><dd><?= e(MESSAGE_TYPES[$m['type']] ?? $m['type']) ?></dd>
      <dt>Konu</dt><dd><?= e($m['subject'] ?: '—') ?></dd>
      <?php if ($m['meta']): ?><dt>Ek bilgi</dt><dd><?= nl2br(e($m['meta'])) ?></dd><?php endif; ?>
      <dt>Tarih</dt><dd><?= e(tr_date($m['created_at'], true)) ?></dd>
      <dt>IP</dt><dd class="muted"><?= e($m['ip']) ?></dd>
    </dl>
  </aside>
</div>
