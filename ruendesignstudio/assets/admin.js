(function () {
  "use strict";
  var body = document.body;
  var mediaUrl = body.getAttribute("data-media-url");
  var uploadUrl = body.getAttribute("data-upload-url");
  var csrf = body.getAttribute("data-csrf");

  // Silme gibi işlemlerde onay
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-confirm]");
    if (el && !window.confirm(el.getAttribute("data-confirm"))) e.preventDefault();
  });

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // Dosya seçilince önizleme
  document.querySelectorAll("[data-image-field]").forEach(function (box) {
    var file = box.querySelector("[data-file]");
    var preview = box.querySelector("[data-preview]");
    var info = box.querySelector("[data-file-name]");
    if (file) {
      file.addEventListener("change", function () {
        var f = file.files[0];
        if (!f) return;
        preview.innerHTML = '<img alt="" src="' + URL.createObjectURL(f) + '">';
        info.textContent = f.name + " — kaydettiğinizde yüklenecek";
        box.querySelector("[data-path]").value = "";
      });
    }
  });

  // Çoklu galeri yüklemesi bilgisi
  document.querySelectorAll("[data-multi-file]").forEach(function (inp) {
    inp.addEventListener("change", function () {
      var info = inp.parentElement.querySelector("[data-multi-info]");
      if (info) info.textContent = inp.files.length + " görsel seçildi — kaydettiğinizde galeriye eklenecek.";
    });
  });

  // Medya sayfası: seçince otomatik yükle, sürükle-bırak
  document.querySelectorAll("[data-auto-submit]").forEach(function (inp) {
    inp.addEventListener("change", function () { if (inp.files.length) inp.form.submit(); });
  });
  var drop = document.querySelector("[data-drop]");
  if (drop) {
    ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("is-over"); }); });
    ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("is-over"); }); });
    drop.addEventListener("drop", function (e) {
      var inp = drop.querySelector("input[type=file]");
      inp.files = e.dataTransfer.files;
      if (inp.files.length) drop.submit();
    });
  }

  // ---------- Medya kütüphanesi seçici ----------
  var dlg = document.querySelector("[data-picker]");
  if (!dlg) return;
  var grid = dlg.querySelector("[data-picker-grid]");
  var help = dlg.querySelector("[data-picker-help]");
  var foot = dlg.querySelector("[data-picker-foot]");
  var mode = null; // { multi: bool, onPick: fn }
  var selected = [];

  function renderItems(items) {
    if (!items.length) { grid.innerHTML = '<p class="muted">Kütüphane boş. Sağ üstten görsel yükleyin.</p>'; return; }
    grid.innerHTML = items.map(function (m) {
      return '<button type="button" data-path="' + esc(m.path) + '" aria-pressed="false" title="' + esc(m.original_name) + '"><img loading="lazy" alt="" src="/' + esc(m.path) + '"></button>';
    }).join("");
  }
  function load() {
    grid.innerHTML = '<p class="muted">Yükleniyor…</p>';
    fetch(mediaUrl, { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(renderItems)
      .catch(function () { grid.innerHTML = '<p class="muted">Liste alınamadı.</p>'; });
  }
  function open(m) {
    mode = m; selected = [];
    help.textContent = m.multi ? "Bir veya birden fazla görsel seçin." : "Bir görsel seçin.";
    foot.hidden = !m.multi;
    load();
    dlg.showModal();
  }
  grid.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-path]");
    if (!b) return;
    var p = b.getAttribute("data-path");
    if (!mode.multi) { mode.onPick([p]); dlg.close(); return; }
    var on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(on));
    if (on) selected.push(p); else selected = selected.filter(function (x) { return x !== p; });
  });
  dlg.querySelector("[data-picker-done]").addEventListener("click", function () { mode.onPick(selected); dlg.close(); });
  dlg.querySelector("[data-picker-close]").addEventListener("click", function () { dlg.close(); });
  dlg.querySelector("[data-picker-upload]").addEventListener("change", function (e) {
    var files = e.target.files;
    if (!files.length) return;
    var fd = new FormData();
    fd.append("_csrf", csrf);
    fd.append("action", "upload");
    for (var i = 0; i < files.length; i++) fd.append("files[]", files[i]);
    grid.innerHTML = '<p class="muted">Yükleniyor…</p>';
    fetch(uploadUrl, { method: "POST", body: fd, credentials: "same-origin", headers: { "X-Requested-With": "fetch" } })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (res.errors && res.errors.length) alert(res.errors.join("\n")); load(); })
      .catch(function () { alert("Yükleme başarısız."); load(); });
    e.target.value = "";
  });

  // Tekli görsel alanları
  document.querySelectorAll("[data-image-field] [data-pick]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest("[data-image-field]");
      open({
        multi: false,
        onPick: function (paths) {
          box.querySelector("[data-path]").value = paths[0];
          box.querySelector("[data-preview]").innerHTML = '<img alt="" src="/' + esc(paths[0]) + '">';
          var file = box.querySelector("[data-file]");
          if (file) file.value = "";
          var info = box.querySelector("[data-file-name]");
          if (info) info.textContent = "Kütüphaneden seçildi — kaydetmeyi unutmayın.";
        },
      });
    });
  });

  // Galeriye çoklu ekleme
  document.querySelectorAll("[data-pick-multi]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.querySelector('[data-multi-target="' + btn.getAttribute("data-pick-multi") + '"]');
      open({
        multi: true,
        onPick: function (paths) {
          var cur = target.value ? target.value.split(",") : [];
          target.value = cur.concat(paths).join(",");
          var info = btn.parentElement.querySelector("[data-multi-info]");
          if (info) info.textContent = target.value.split(",").length + " görsel kütüphaneden seçildi — kaydettiğinizde galeriye eklenecek.";
        },
      });
    });
  });
})();
