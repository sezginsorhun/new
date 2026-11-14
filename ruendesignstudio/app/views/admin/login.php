<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Giriş — Yönetim</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="<?= e(asset('admin.css')) ?>">
</head>
<body class="login-body">
  <main class="login-box card">
    <div class="login-brand">
      <p class="brand-name"><?= e(setting('logo_line1', 'RUEN')) ?></p>
      <p class="brand-sub"><?= e(setting('logo_line2', 'DESIGN STUDIO')) ?> · Yönetim</p>
    </div>
    <?php if ($error): ?><div class="flash flash-error" role="alert"><?= e($error) ?></div><?php endif; ?>
    <form method="post" action="<?= e(admin_url('giris')) ?>" class="stack">
      <?= csrf_field() ?>
      <div>
        <label class="label" for="email">E-posta</label>
        <input class="field" id="email" type="email" name="email" value="<?= e($email) ?>" autocomplete="username" required autofocus>
      </div>
      <div>
        <label class="label" for="password">Şifre</label>
        <input class="field" id="password" type="password" name="password" autocomplete="current-password" required>
      </div>
      <button class="btn-primary w-full" type="submit">Giriş yap</button>
    </form>
  </main>
</body>
</html>
