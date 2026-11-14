(function () {
  "use strict";
  document.documentElement.classList.add("js");

  // Başlık: kaydırınca zemin kazanır
  var header = document.querySelector("[data-header]");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobil menü
  var btn = document.querySelector("[data-menu-btn]");
  var menu = document.querySelector("[data-menu]");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
      document.body.classList.toggle("menu-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) btn.click();
    });
  }

  // Tam ekran görsel geçişi
  var slider = document.querySelector("[data-slider]");
  if (slider) {
    var slides = slider.querySelectorAll(".slide");
    var dots = slider.querySelectorAll("[data-dot]");
    var current = 0;
    var delay = (parseInt(slider.getAttribute("data-interval"), 10) || 6) * 1000;
    var timer = null;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function show(i) {
      slides[current].classList.remove("is-active");
      if (dots[current]) dots[current].setAttribute("aria-selected", "false");
      current = (i + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      if (dots[current]) dots[current].setAttribute("aria-selected", "true");
    }
    function start() {
      if (slides.length < 2 || reduce) return;
      clearInterval(timer);
      timer = setInterval(function () { show(current + 1); }, delay);
    }
    dots.forEach(function (d) {
      d.addEventListener("click", function () { show(parseInt(d.getAttribute("data-dot"), 10)); start(); });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearInterval(timer); else start();
    });
    start();
  }

  // Kaydırınca beliren öğeler
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  // Galeri büyütme
  var lb = document.querySelector("[data-lightbox]");
  if (lb) {
    var lbImg = lb.querySelector("img");
    document.querySelectorAll("[data-full]").forEach(function (b) {
      b.addEventListener("click", function () {
        lbImg.src = b.getAttribute("data-full");
        lbImg.alt = (b.querySelector("img") || {}).alt || "";
        lb.hidden = false;
        document.body.style.overflow = "hidden";
      });
    });
    function close() { lb.hidden = true; lbImg.src = ""; document.body.style.overflow = ""; }
    lb.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) close(); });
  }
})();
