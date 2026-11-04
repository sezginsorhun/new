/* NİLSER — sayfa etkileşimleri (bağımlılık yok, ~6 KB) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Üst bilgi gölgesi */
  const header = $(".header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobil menü */
  const menuBtn = $(".menu-btn");
  if (menuBtn) {
    const setMenu = (open) => {
      root.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    menuBtn.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
    $$(".drawer a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  }

  /* Görünür olunca belirme */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add("is-in"));

  /* Koleksiyon dizini: imleci izleyen görsel */
  const preview = $(".index-preview");
  if (preview && matchMedia("(hover: hover) and (min-width: 901px)").matches) {
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      preview.style.left = cx + "px"; preview.style.top = cy + "px";
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    $$(".index__item a").forEach((a) => {
      a.addEventListener("mouseenter", (e) => {
        x = cx = e.clientX; y = cy = e.clientY;
        $$("img", preview).forEach((img) => img.classList.toggle("is-on", img.dataset.key === a.dataset.key));
        preview.classList.add("is-on");
      });
      a.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
      a.addEventListener("mouseleave", () => preview.classList.remove("is-on"));
    });
  }

  /* Sekme grupları: [data-tabs] içindeki [role=tab] -> aria-controls paneli */
  $$("[data-tabs]").forEach((group) => {
    const tabs = $$("[role=tab]", group);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) { panel.hidden = !on; if (on) { panel.classList.remove("fade-in"); void panel.offsetWidth; panel.classList.add("fade-in"); } }
        const img = t.dataset.img && document.getElementById(t.dataset.img);
        if (img) img.classList.toggle("is-on", on);
      });
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* Yatay şerit okları */
  $$("[data-rail]").forEach((wrap) => {
    const rail = $(".rail", wrap);
    $$("[data-dir]", wrap).forEach((b) => b.addEventListener("click", () => {
      const card = rail.firstElementChild;
      const step = card ? card.getBoundingClientRect().width + 20 : 300;
      rail.scrollBy({ left: step * Number(b.dataset.dir), behavior: reduced ? "auto" : "smooth" });
    }));
  });

  /* Duşakabin filtresi */
  const filters = $$(".filter");
  if (filters.length) {
    filters.forEach((f) => f.addEventListener("click", () => {
      filters.forEach((x) => x.setAttribute("aria-pressed", String(x === f)));
      const key = f.dataset.filter;
      $$(".model-grid .model").forEach((m) => { m.hidden = key !== "hepsi" && m.dataset.type !== key; });
    }));
  }

  /* Model büyütme (lightbox) */
  const lb = $("#lightbox");
  if (lb && typeof lb.showModal === "function") {
    const items = () => $$("[data-lightbox]").filter((m) => !m.hidden && m.offsetParent !== null);
    let current = 0;
    const show = (i) => {
      const list = items(); if (!list.length) return;
      current = (i + list.length) % list.length;
      const d = list[current].dataset;
      $("img", lb).src = d.src; $("img", lb).alt = d.title;
      $("[data-lb-no]", lb).textContent = "DK-" + d.no;
      $("[data-lb-title]", lb).textContent = d.title;
      $("[data-lb-text]", lb).textContent = d.text;
      $("[data-lb-plan]", lb).textContent = "Planlama: " + d.plan;
      $("[data-lb-quote]", lb).href = "/iletisim/?urun=dusakabin&model=DK-" + d.no + "#teklif";
    };
    $$("[data-lightbox]").forEach((m) => m.addEventListener("click", () => { show(items().indexOf(m)); lb.showModal(); }));
    $("[data-lb-close]", lb).addEventListener("click", () => lb.close());
    $("[data-lb-prev]", lb).addEventListener("click", () => show(current - 1));
    $("[data-lb-next]", lb).addEventListener("click", () => show(current + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") show(current + 1); if (e.key === "ArrowLeft") show(current - 1); });
  }

  /* Harita: tıklanınca yükle (hız + KVKK) */
  $$("[data-map]").forEach((btn) => btn.addEventListener("click", () => {
    const box = btn.closest(".map");
    const f = document.createElement("iframe");
    f.src = btn.dataset.map; f.title = "Konum haritası"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
    box.innerHTML = ""; box.appendChild(f);
  }));

  /* Teklif sihirbazı */
  const quote = $("#teklif-form");
  if (quote) {
    const sets = $$("fieldset", quote);
    const marks = $$(".quote__step", quote);
    const back = $("[data-q-back]", quote), next = $("[data-q-next]", quote), sendRow = $("[data-q-send]", quote);
    const summary = $(".quote__summary", quote);
    const msg = $(".form-msg", quote);
    const waNumber = quote.dataset.wa;
    let step = 0;

    const val = (n) => { const el = quote.elements[n]; return el ? (el.value || "").trim() : ""; };
    const typesBox = $("[data-q-types]", quote);
    const types = JSON.parse(quote.dataset.types || "{}");
    const renderTypes = (pick) => {
      const p = val("urun");
      typesBox.innerHTML = (types[p] || []).map((t, i) =>
        `<label class="pill"><input type="radio" name="tip" value="${t}"${(pick ? t === pick : i === 0) ? " checked" : ""}><span>${t}</span></label>`).join("");
    };

    const text = () => {
      const urun = $$("input[name=urun]", quote).find((i) => i.checked);
      const detail = [
        "Ürün: " + (urun ? urun.dataset.label : "-") + (val("tip") ? " / " + val("tip") : ""),
        val("model") && "Model: " + val("model"),
        (val("en") || val("boy")) && "Ölçü (yaklaşık): " + (val("en") || "?") + " x " + (val("boy") || "?") + " cm",
        val("adet") && "Adet: " + val("adet"),
        val("ilce") && "Konum: " + val("ilce"),
        val("not") && "Not: " + val("not"),
      ].filter(Boolean).join("\n");
      const who = ["Ad Soyad: " + val("ad"), "Telefon: " + val("telefon"), val("eposta") && "E-posta: " + val("eposta")].filter(Boolean).join("\n");
      return ["Merhaba, NİLSER web sitesinden teklif istiyorum.", detail, who].join("\n\n");
    };

    const validate = () => {
      const fs = sets[step];
      const bad = $$("input,select,textarea", fs).find((el) => !el.checkValidity());
      if (bad) { bad.reportValidity(); return false; }
      return true;
    };

    const go = (n) => {
      step = Math.max(0, Math.min(sets.length - 1, n));
      sets.forEach((s, i) => (s.hidden = i !== step));
      marks.forEach((m, i) => { m.classList.toggle("is-on", i === step); m.classList.toggle("is-done", i < step); });
      back.hidden = step === 0;
      next.hidden = step === sets.length - 1;
      sendRow.hidden = step !== sets.length - 1;
      if (step === sets.length - 1) summary.textContent = text();
      msg.hidden = true;
    };

    $$("input[name=urun]", quote).forEach((r) => r.addEventListener("change", () => renderTypes()));
    quote.addEventListener("input", () => { if (step === sets.length - 1) summary.textContent = text(); });
    next.addEventListener("click", () => { if (validate()) go(step + 1); });
    back.addEventListener("click", () => go(step - 1));

    /* URL'den ön seçim: /iletisim/?urun=cam-balkon&tip=Katlanır&model=DK-05 */
    const q = new URLSearchParams(location.search);
    const pre = q.get("urun");
    if (pre) { const r = $(`input[name=urun][value="${CSS.escape(pre)}"]`, quote); if (r) r.checked = true; }
    renderTypes(q.get("tip"));
    if (q.get("model") && quote.elements.model) quote.elements.model.value = q.get("model").slice(0, 20);
    go(0);

    const say = (t, err) => { msg.textContent = t; msg.hidden = false; msg.classList.toggle("is-error", !!err); };

    $("[data-q-wa]", quote).addEventListener("click", () => {
      if (!validate()) return;
      window.open("https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text()), "_blank", "noopener");
    });

    quote.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validate()) return;
      const btn = $("button[type=submit]", quote);
      btn.disabled = true;
      try {
        const fd = new FormData(quote);
        fd.set("mesaj", text());
        const res = await fetch(quote.action, { method: "POST", body: fd, headers: { Accept: "application/json" } });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          quote.reset(); renderTypes(); go(0);
          say("Teşekkürler, talebiniz bize ulaştı. En kısa sürede sizi arayacağız.");
        } else say(data.error || "Gönderilemedi. Lütfen WhatsApp veya telefonla ulaşın.", true);
      } catch {
        say("Bağlantı kurulamadı. Lütfen WhatsApp veya telefonla ulaşın.", true);
      } finally { btn.disabled = false; }
    });
  }
})();
