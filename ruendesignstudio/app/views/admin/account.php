<h1 class="page-title">Hesabım</h1>
<div class="grid-2">
  <form method="post" class="card pad stack">
    <?= csrf_field() ?><input type="hidden" name="action" value="profile">
    <h2>Bilgilerim</h2>
    <div><label class="label" for="n">Ad</label><input class="field" id="n" name="name" value="<?= e($user['name']) ?>"></div>
    <div><label class="label" for="em">E-posta (giriş adı)</label><input class="field" id="em" type="email" name="email" value="<?= e($user['email']) ?>" required></div>
    <div><button class="btn-primary btn-sm" type="submit">Kaydet</button></div>
  </form>

  <form method="post" class="card pad stack">
    <?= csrf_field() ?><input type="hidden" name="action" value="password">
    <h2>Şifre değiştir</h2>
    <div><label class="label" for="c">Mevcut şifre</label><input class="field" id="c" type="password" name="current" autocomplete="current-password" required></div>
    <div><label class="label" for="nw">Yeni şifre</label><input class="field" id="nw" type="password" name="new" autocomplete="new-password" minlength="10" required></div>
    <div><label class="label" for="nw2">Yeni şifre (tekrar)</label><input class="field" id="nw2" type="password" name="new2" autocomplete="new-password" minlength="10" required></div>
    <p class="help">En az 10 karakter. Değiştirdiğinizde diğer cihazlardaki oturumlar kapanır.</p>
    <div><button class="btn-primary btn-sm" type="submit">Şifreyi değiştir</button></div>
  </form>
</div>

<section class="card overflow mt-6">
  <div class="card-head"><h2>Yöneticiler</h2></div>
  <table class="table">
    <thead><tr><th>Ad</th><th>E-posta</th><th>Son giriş</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($users as $u): ?>
      <tr>
        <td><?= e($u['name'] ?: '—') ?><?= (int) $u['id'] === (int) $user['id'] ? ' <span class="badge">Siz</span>' : '' ?></td>
        <td><?= e($u['email']) ?></td>
        <td class="muted small"><?= e($u['last_login_at'] ? tr_date($u['last_login_at'], true) : '—') ?></td>
        <td class="right">
          <?php if ((int) $u['id'] !== (int) $user['id']): ?>
          <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="delete_user"><input type="hidden" name="id" value="<?= $u['id'] ?>"><button class="btn-ghost btn-sm danger" type="submit" data-confirm="Bu yönetici silinsin mi?"><?= icon('trash', 14) ?></button></form>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <form method="post" class="inline-form">
    <?= csrf_field() ?><input type="hidden" name="action" value="add_user">
    <input class="field" name="name" placeholder="Ad">
    <input class="field" type="email" name="email" placeholder="E-posta" required>
    <input class="field" type="password" name="password" placeholder="Şifre (en az 10)" minlength="10" autocomplete="new-password" required>
    <button class="btn-outline btn-sm" type="submit"><?= icon('plus', 14) ?> Yönetici ekle</button>
  </form>
</section>
