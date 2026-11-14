<?php
$fields = $def['fields'];
$key = $def['key'] ?? 'id';
$hasSort = isset($fields['sort']);
$thumb = fn($p) => '<div class="thumb"><img src="' . e(img($p)) . '" alt="" loading="lazy"></div>';
?>
<div class="page-head">
  <h1 class="page-title"><?= e($def['title']) ?></h1>
  <?php if (empty($def['fixed'])): ?>
    <a class="btn-primary btn-sm" href="<?= e(admin_url($slug . '/yeni')) ?>"><?= icon('plus', 14) ?> Yeni <?= e(mb_strtolower($def['single'])) ?></a>
  <?php endif; ?>
</div>

<form class="toolbar" method="get">
  <input class="field" type="search" name="q" value="<?= e($search) ?>" placeholder="Ara">
  <?php if ($filterOptions): ?>
    <select class="field" name="f">
      <option value="0">Tümü</option>
      <?php foreach ($filterOptions as $k => $v): ?><option value="<?= e($k) ?>"<?= $fval == $k ? ' selected' : '' ?>><?= e($v) ?></option><?php endforeach; ?>
    </select>
  <?php endif; ?>
  <button class="btn-outline btn-sm" type="submit">Filtrele</button>
</form>

<form method="post" class="card overflow">
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="reorder">
  <?php if (!$items): ?>
    <p class="empty">Kayıt bulunamadı.</p>
  <?php else: ?>
  <table class="table">
    <thead><tr>
      <?php foreach ($def['list'] as $col => $label): ?><th class="<?= $label === '' ? 'w-thumb' : ($col === 'sort' ? 'w-sort' : '') ?>"><?= e($label) ?></th><?php endforeach; ?>
      <th></th>
    </tr></thead>
    <tbody>
    <?php foreach ($items as $it): $edit = admin_url($slug . '/' . rawurlencode((string) $it[$key])); ?>
      <tr>
        <?php foreach ($def['list'] as $col => $label): $v = $it[$col] ?? ''; $type = $fields[$col]['type'] ?? ''; ?>
          <td>
            <?php if ($type === 'image'): ?>
              <?= $thumb($v) ?>
            <?php elseif ($col === $def['label']): ?>
              <a href="<?= e($edit) ?>"><strong><?= e($v ?: '—') ?></strong></a>
            <?php elseif ($col === 'published' || $col === 'active'): ?>
              <?= $v ? '<span class="badge badge-ok">' . ($col === 'active' ? 'Aktif' : 'Yayında') . '</span>' : '<span class="badge">' . ($col === 'active' ? 'Pasif' : 'Taslak') . '</span>' ?>
            <?php elseif ($col === 'sort' && $hasSort): ?>
              <input class="field field-sm" type="number" name="sort[<?= e($it[$key]) ?>]" value="<?= (int) $v ?>">
            <?php elseif (isset($relMaps[$col])): ?>
              <span class="muted"><?= e($relMaps[$col][$v] ?? '—') ?></span>
            <?php elseif ($col === 'updated_at'): ?>
              <span class="muted small"><?= e(tr_date($v, true)) ?></span>
            <?php elseif ($col === 'slug'): ?>
              <span class="muted">/<?= e($v) ?></span>
            <?php else: ?>
              <?= e($v) ?>
            <?php endif; ?>
          </td>
        <?php endforeach; ?>
        <td class="right nowrap">
          <a class="btn-ghost btn-sm" href="<?= e($edit) ?>">Düzenle</a>
          <?php if (!empty($def['url']) && (($it['published'] ?? 1) || ($it['active'] ?? 1))): ?>
            <a class="btn-ghost btn-sm" href="<?= e(str_replace('{slug}', (string) ($it['slug'] ?? ''), $def['url'])) ?>" target="_blank" rel="noopener" title="Sitede gör"><?= icon('external', 14) ?></a>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php if ($hasSort && isset($def['list']['sort'])): ?>
  <div class="card-foot">
    <p class="help">Sıra numarası küçük olan önce görünür.</p>
    <button class="btn-outline btn-sm" type="submit">Sıralamayı kaydet</button>
  </div>
  <?php endif; ?>
  <?php endif; ?>
</form>
