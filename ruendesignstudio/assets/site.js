(function () {
  "use strict";
  var doc = document;
  doc.documentElement.classList.add("js");
  var body = doc.body;

  /* Ana sayfa: kaydırınca başlık beyaz zemine geçer */
  var header = doc.querySelector("[data-header]");
  if (header && body.classList.contains("is-home")) {
    var onScroll = function () { header.classList.toggle("is-solid", window.scrollY > 44); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Geniş menüler: dokunmatik ekranda ilk dokunuş açar, ikincisi bağlantıya gider */
  doc.querySelectorAll("[data-mega]").forEach(function (item) {
    var link = item.querySelector(".nav-link");
    link.addEventListener("click", function (e) {
      if (window.matchMedia("(hover: none)").matches && !item.classList.contains("is-open")) {
        e.preventDefault();
        doc.querySelectorAll("[data-mega].is-open").forEach(function (o) { o.classList.remove("is-open"); });
        item.classList.add("is-open");
      }
    });
  });
  doc.addEventListener("click", function (e) {
    if (!e.target.closest("[data-mega]")) doc.querySelectorAll("[data-mega].is-open").forEach(function (o) { o.classList.remove("is-open"); });
  });

  /* Mobil menü */
  var burger = doc.querySelector("[data-burger]");
  var mnav = doc.querySelector("[data-mobile-nav]");
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      if (!open) window.scrollTo(0, 0);
      burger.setAttribute("aria-expanded", String(!open));
      mnav.hidden = open;
      body.classList.toggle("nav-open", !open);
    });
  }

  /* Arama katmanı */
  var search = doc.querySelector("[data-search]");
  doc.querySelectorAll("[data-search-open]").forEach(function (b) {
    b.addEventListener("click", function () { search.hidden = false; search.querySelector("input").focus(); });
  });
  if (search) {
    search.querySelector("[data-search-close]").addEventListener("click", function () { search.hidden = true; });
    search.addEventListener("click", function (e) { if (e.target === search) search.hidden = true; });
  }
  doc.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (search && !search.hidden) search.hidden = true;
    if (burger && burger.getAttribute("aria-expanded") === "true") burger.click();
  });

  /* Slaytlar */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.querySelectorAll("[data-slider]").forEach(function (sl) {
    var slides = sl.querySelectorAll(".slide");
    if (slides.length < 2) return;
    var dots = sl.querySelectorAll("[data-dot]");
    var cur = 0, timer;
    function show(i) {
      slides[cur].classList.remove("is-active");
      if (dots[cur]) dots[cur].removeAttribute("aria-current");
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add("is-active");
      if (dots[cur]) dots[cur].setAttribute("aria-current", "true");
    }
    function play() { if (reduce) return; clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 5500); }
    var p = sl.querySelector("[data-prev]"), n = sl.querySelector("[data-next]");
    if (p) p.addEventListener("click", function () { show(cur - 1); play(); });
    if (n) n.addEventListener("click", function () { show(cur + 1); play(); });
    dots.forEach(function (d) { d.addEventListener("click", function () { show(+d.getAttribute("data-dot")); play(); }); });
    play();
  });

  /* Kaydırınca belirme */
  var items = doc.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add("is-in"); });

  /* Ürün görselleri */
  var main = doc.querySelector("[data-pdp-main]");
  doc.querySelectorAll(".pdp-thumb").forEach(function (t) {
    t.addEventListener("click", function () {
      doc.querySelectorAll(".pdp-thumb").forEach(function (o) { o.classList.remove("is-active"); });
      t.classList.add("is-active");
      main.src = t.getAttribute("data-src");
    });
  });

  /* Sekmeler */
  doc.querySelectorAll("[data-tabs]").forEach(function (tabs) {
    var heads = tabs.querySelectorAll("[data-tab]");
    heads.forEach(function (h) {
      h.addEventListener("click", function () {
        heads.forEach(function (o) { o.setAttribute("aria-selected", "false"); });
        h.setAttribute("aria-selected", "true");
        tabs.querySelectorAll("[data-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== h.getAttribute("data-tab"); });
      });
    });
  });

  /* İstek listesi (bu cihazda saklanır) */
  var KEY = "ruen_wishlist";
  function getList() { try { return JSON.parse(localStorage.getItem(KEY) || "[]").map(Number).filter(Boolean); } catch (e) { return []; } }
  function setList(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} updateCount(); }
  function updateCount() {
    var c = doc.querySelector("[data-wl-count]"); if (!c) return;
    var n = getList().length; c.textContent = n; c.hidden = n === 0;
  }
  updateCount();
  doc.querySelectorAll("[data-wl]").forEach(function (b) {
    var id = +b.getAttribute("data-wl");
    b.setAttribute("aria-pressed", String(getList().indexOf(id) > -1));
    b.addEventListener("click", function () {
      var l = getList(), i = l.indexOf(id);
      if (i > -1) l.splice(i, 1); else l.push(id);
      setList(l);
      b.setAttribute("aria-pressed", String(i === -1));
    });
  });
  var wlPage = doc.querySelector("[data-wishlist-page]");
  if (wlPage) {
    fetch("/istek-listesi?partial=1&ids=" + getList().join(","), { credentials: "same-origin" })
      .then(function (r) { return r.text(); })
      .then(function (html) { wlPage.innerHTML = html; wlPage.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); }); })
      .catch(function () { wlPage.innerHTML = '<p class="empty">Liste yüklenemedi.</p>'; });
  }
})();
