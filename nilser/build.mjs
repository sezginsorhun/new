#!/usr/bin/env node
/**
 * NİLSER — statik site derleyici
 *
 *   node build.mjs          → dist/ klasörünü üretir
 *
 * Hiçbir npm paketi gerektirmez. Çıktı düz HTML/CSS/JS'tir; Hostinger'da
 * public_html klasörüne yüklenir ve PHP dışında sunucu tarafı gerektirmez.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as D from "./src/data.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "dist");
const { site } = D;
const BUILD = Date.now().toString(36);

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** WebP boyutunu dosya başlığından okur (width/height öznitelikleri → CLS yok). */
const dims = {};
function webpSize(file) {
  const b = readFileSync(file);
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  if (chunk === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  throw new Error("WebP okunamadı: " + file);
}
for (const f of readdirSync(join(SRC, "assets/img"))) {
  if (f.endsWith(".webp")) dims[f.replace(/\.webp$/, "")] = webpSize(join(SRC, "assets/img", f));
}

/** <img> etiketi. eager=true yalnızca ekranın üstündeki ilk görsel için. */
function img(name, alt, { eager = false, cls = "", sizes = "", id = "", attrs = "" } = {}) {
  const d = dims[name];
  if (!d) throw new Error("Görsel bulunamadı: " + name);
  return `<img src="/assets/img/${name}.webp" alt="${esc(alt)}" width="${d[0]}" height="${d[1]}"${
    eager ? ' fetchpriority="high"' : ' loading="lazy"'
  } decoding="async"${cls ? ` class="${cls}"` : ""}${id ? ` id="${id}"` : ""}${sizes ? ` sizes="${sizes}"` : ""}${attrs ? " " + attrs : ""}>`;
}

const I = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 16 16 3l5 5L8 21zM7 12l2 2M10 9l2 2M13 6l2 2"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.47 15.03L2.5 21.5l4.6-1.05A9.9 9.9 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-2.73.62.65-2.66-.2-.31a8.2 8.2 0 1 1 6.76 3.68zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.17.25-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.31c-.23.25-.86.84-.86 2.05s.88 2.37 1 2.54c.12.16 1.73 2.64 4.2 3.7.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>',
};

const waLink = (text = "Merhaba, NİLSER web sitesinden ulaşıyorum.") =>
  `https://wa.me/${site.primaryPhone.wa}?text=${encodeURIComponent(text)}`;

/* ------------------------------------------------------------------ */
/* Sayfa iskeleti                                                       */
/* ------------------------------------------------------------------ */

const css = readFileSync(join(SRC, "styles.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{}:;,>])\s*/g, "$1")
  .replace(/;}/g, "}")
  .trim();

const orgLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: site.name,
  legalName: site.legal,
  url: site.url,
  logo: site.url + "/assets/img/logo-ink.svg",
  image: site.url + "/assets/img/og.jpg",
  email: site.email,
  telephone: site.primaryPhone.tel,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address,
    addressLocality: site.district,
    addressRegion: site.city,
    addressCountry: "TR",
  },
  areaServed: { "@type": "City", name: "Antalya" },
  contactPoint: site.contacts.map((c) => ({ "@type": "ContactPoint", telephone: c.tel, name: c.name, contactType: "sales", areaServed: "TR", availableLanguage: "Turkish" })),
  makesOffer: D.collection.map((c) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: c.title } })),
};

function layout({ path, title, description, body, ld = [] }) {
  const full = path === "/" ? `${site.name} | Sineklik, Plise Perde, Cam Balkon, Duşakabin — Antalya` : `${title} | ${site.name}`;
  const canonical = site.url + path;
  const navHtml = D.nav
    .map((n) => `<a href="${n.href}"${path === n.href ? ' aria-current="page"' : ""}>${n.label}</a>`)
    .join("");
  const drawer = D.nav
    .map((n, i) => `<a href="${n.href}"${path === n.href ? ' aria-current="page"' : ""}>${n.label}<small>0${i + 1}</small></a>`)
    .join("");
  const ldAll = [orgLd, ...ld].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("");

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description || site.description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#f6f3ec">
<meta property="og:type" content="website">
<meta property="og:locale" content="tr_TR">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description || site.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${site.url}/assets/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/cormorant-garamond-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${css}</style>
<script>document.documentElement.classList.add("js")</script>
<script src="/assets/main.js?v=${BUILD}" defer></script>
${ldAll}
</head>
<body>
<a class="skip" href="#icerik">İçeriğe geç</a>
<header class="header">
  <div class="wrap header__in">
    <a class="brand" href="/" aria-label="${esc(site.name)} — ana sayfa"><img src="/assets/img/logo-ink.svg" alt="NİLSER Alüminyum Sistemleri" width="470" height="138"></a>
    <nav class="nav" aria-label="Ana menü">${navHtml}</nav>
    <div class="header__cta">
      <a class="header__phone" href="tel:${site.primaryPhone.tel}">${I.phone}${site.primaryPhone.label}</a>
      <a class="btn" href="/iletisim/#teklif">Keşif iste</a>
    </div>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Menüyü aç/kapat"><span></span></button>
  </div>
</header>
<div class="drawer" id="drawer">
  ${drawer}
  <div class="drawer__foot">
    <a class="btn btn--block" href="/iletisim/#teklif" style="font-family:var(--sans);font-size:15px;color:#fff;border:0;padding:0">Yerinde keşif iste</a>
  </div>
</div>
<main id="icerik">
${body}
</main>
${footer()}
<nav class="dock" aria-label="Hızlı iletişim">
  <a href="tel:${site.primaryPhone.tel}">${I.phone}Ara</a>
  <a class="wa" href="${waLink()}" target="_blank" rel="noopener">${I.wa}WhatsApp</a>
  <a href="/iletisim/#teklif">${I.ruler}Teklif al</a>
</nav>
<a class="fab" href="${waLink()}" target="_blank" rel="noopener" aria-label="WhatsApp ile yazın">${I.wa}</a>
</body>
</html>
`;
}

function footer() {
  const year = new Date().getFullYear();
  return `<footer class="footer">
  <div class="wrap">
    <div class="footer__top">
      <div class="footer__brand">
        <img src="/assets/img/logo-light.svg" alt="NİLSER Alüminyum Sistemleri" width="470" height="138" loading="lazy">
        <p>Pencere ve kapı doğramaları, balkon açıklıkları ve duş alanları için sistemleri; profil, cam, tül, kumaş ve donanım seçenekleriyle birlikte değerlendiririz.</p>
      </div>
      <div>
        <h2>Koleksiyon</h2>
        <ul>${D.collection.map((c) => `<li><a href="/${c.slug}/">${c.title}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h2>İletişim</h2>
        <ul>
          ${site.contacts.map((c) => `<li><a href="tel:${c.tel}">${c.phone}</a> <span style="color:#86827a">· ${c.name}</span></li>`).join("")}
          <li><a href="mailto:${site.email}">${site.email}</a></li>
        </ul>
      </div>
      <div>
        <h2>Adres</h2>
        <address>${site.address}<br>${site.district} / ${site.city}</address>
        <p style="margin-top:14px"><a class="link-arrow" href="${site.mapsUrl}" target="_blank" rel="noopener">Yol tarifi ${I.arrow}</a></p>
      </div>
    </div>
    <div class="footer__big" aria-hidden="true">NİLSER</div>
    <div class="footer__bottom">
      <span>© ${year} ${site.legal}</span>
      <span><a href="/kvkk/">KVKK aydınlatma metni</a></span>
    </div>
  </div>
</footer>`;
}

/* Ortak bloklar ------------------------------------------------------- */

const crumbs = (items) =>
  `<nav class="crumbs" aria-label="Sayfa yolu"><a href="/">Ana sayfa</a>${items
    .map((c) => `<span aria-hidden="true">/</span>${c.href ? `<a href="${c.href}">${c.label}</a>` : `<span aria-current="page">${c.label}</span>`}`)
    .join("")}</nav>`;

const breadcrumbLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Ana sayfa", href: "/" }, ...items].map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.label || c.name,
    item: site.url + c.href,
  })),
});

function ctaBand({ title = "Ölçüyü birlikte alalım.", text = "Yerinde keşif ile açıklığınızı, doğramanızı ve kullanım alışkanlıklarınızı inceleyip size uygun sistemi teklifte netleştirelim.", product = "" } = {}) {
  const q = product ? `?urun=${product}` : "";
  return `<section class="cta-band bg-night section">
  <div class="cta-band__bg" aria-hidden="true">${img("bina-cephe", "")}</div>
  <div class="wrap cta-band__in">
    <div class="reveal">
      <span class="eyebrow">Ölçü / Sistem / Uygulama</span>
      <h2 class="h2" style="margin-top:18px">${title}</h2>
      <p class="lead" style="margin-top:20px">${text}</p>
    </div>
    <div class="cta-band__actions reveal" data-d="1">
      <a class="btn btn--gold" href="/iletisim/${q}#teklif">${I.ruler}Yerinde keşif iste</a>
      <a class="btn btn--light" href="${waLink()}" target="_blank" rel="noopener">${I.wa}WhatsApp'tan yazın</a>
      <a class="btn btn--light" href="tel:${site.primaryPhone.tel}">${I.phone}${site.primaryPhone.label}</a>
    </div>
  </div>
</section>`;
}

const modelCard = (m, { rail = false } = {}) => `<button type="button" class="model${rail ? "" : " reveal"}" data-type="${m.type}" data-lightbox data-no="${m.no}" data-title="${esc(m.title)}" data-text="${esc(m.text)}" data-plan="${esc(m.plan)}" data-src="/assets/img/dk-${m.no}.webp" aria-label="DK-${m.no} ${esc(m.title)} modelini büyüt">
  <div class="model__img">${img("dk-" + m.no, `DK-${m.no} ${m.title} duşakabin`)}<span class="model__tag">DK-${m.no}</span></div>
  <div class="model__body"><span class="model__no">${m.no}</span><div><h3>${m.title}</h3><p>${m.text}</p>${rail ? "" : `<p class="model__plan">Planlama: ${m.plan}</p>`}</div></div>
</button>`;

const lightbox = `<dialog class="lightbox" id="lightbox" aria-label="Model görünümü">
  <button class="lightbox__close" type="button" data-lb-close aria-label="Kapat">${I.close}</button>
  <div class="lightbox__in">
    <img src="" alt="" width="362" height="435">
    <div>
      <span class="eyebrow" data-lb-no></span>
      <h3 data-lb-title></h3>
      <p data-lb-text></p>
      <p class="label" data-lb-plan></p>
      <div class="lightbox__nav">
        <button type="button" data-lb-prev aria-label="Önceki model">${I.left}</button>
        <button type="button" data-lb-next aria-label="Sonraki model">${I.arrow}</button>
        <a class="btn btn--gold" data-lb-quote href="/iletisim/#teklif" style="margin-left:8px">Bu model için teklif</a>
      </div>
    </div>
  </div>
</dialog>`;

/* ------------------------------------------------------------------ */
/* Sayfalar                                                             */
/* ------------------------------------------------------------------ */

const pages = [];
const page = (p) => pages.push(p);

/* ANA SAYFA ----------------------------------------------------------- */
page({
  path: "/",
  title: "Ana sayfa",
  body: `
<section class="hero">
  <div class="wrap hero__grid">
    <div class="hero__text">
      <span class="eyebrow">Antalya · Alüminyum sistemleri</span>
      <h1 class="display">Mekânın <em>ölçüsünde.</em></h1>
      <p class="lead">Sineklik, plise perde, cam balkon ve duşakabin. Bir sistem seçerken yalnızca görünümüne bakmayız; açıklığın ölçüsü, günlük kullanım ve mevcut yapı uygulamanın nasıl çözüleceğini belirler.</p>
      <div class="hero__actions">
        <a class="btn" href="/iletisim/#teklif">${I.ruler}Yerinde keşif iste</a>
        <a class="btn btn--ghost" href="#koleksiyon">Koleksiyonu incele</a>
      </div>
      <div class="hero__facts">
        <div><strong>4</strong><span>sistem ailesi</span></div>
        <div><strong>10</strong><span>duşakabin modeli</span></div>
        <div><strong>Yerinde</strong><span>ölçü ve keşif</span></div>
      </div>
    </div>
    <div class="hero__media">
      <div class="hero__frame">${img("villa-cam", "Siyah alüminyum doğramalı cam cephe ve profil kesiti", { eager: true })}</div>
      <div class="hero__badge"><img src="/assets/img/mark-light.svg" alt="" width="34" height="47"><div><strong>Ölçüden montaja tek ekip</strong><span>${site.district}, ${site.city}</span></div></div>
    </div>
  </div>
</section>

<div class="marquee" aria-hidden="true"><div class="marquee__track">${Array(2)
    .fill(["Plise sineklik", "Sürme sineklik", "Plise perde", "Katlanır cam balkon", "Isıcamlı", "Motorlu giyotin", "Duşakabin"].map((t) => `<span>${t}</span>`).join(""))
    .join("")}</div></div>

<section class="section" id="koleksiyon">
  <div class="wrap">
    <div class="index-head">
      <div class="reveal"><span class="eyebrow">Koleksiyon</span><h2 class="h2" style="margin-top:16px">Dört sistem, tek yaklaşım.</h2></div>
      <p class="lead reveal" data-d="1" style="max-width:44ch">Profil, cam, tül, kumaş ve donanım seçeneklerini açıklığınızla birlikte değerlendiririz.</p>
    </div>
    <ul class="index">
      ${D.collection
        .map(
          (c) => `<li class="index__item reveal"><a href="/${c.slug}/" data-key="${c.slug}">
        <span class="index__no">${c.no}</span>
        ${img(c.img, "", { cls: "index__thumb" })}
        <span class="index__title">${c.title}</span>
        <span class="index__sub">${c.sub}</span>
        <span class="index__go">${I.arrow}</span>
      </a></li>`
        )
        .join("")}
    </ul>
  </div>
  <div class="index-preview" aria-hidden="true">${D.collection.map((c) => img(c.img, "", { attrs: `data-key="${c.slug}"` })).join("")}</div>
</section>

<section class="section bg-cream">
  <div class="wrap split split--wide-media">
    <figure class="split__media reveal" style="margin:0;aspect-ratio:3/2">${img("balkon-teras", "Ahşap zeminli terasta çerçevesiz cam balkon")}</figure>
    <div class="reveal" data-d="1">
      <span class="eyebrow">Yaklaşımımız</span>
      <h2 class="h2" style="margin:18px 0 24px">Önce yapı, sonra sistem.</h2>
      <p class="lead">Açıklığın ölçüsü, günlük kullanım ve mevcut yapı; uygulamanın nasıl çözüleceğini belirler.</p>
      <hr class="rule">
      <p class="muted">Pencere ve kapı doğramaları, balkon açıklıkları ve duş alanları için ürünleri; profil, cam, tül, kumaş ve donanım seçenekleriyle birlikte değerlendiririz.</p>
      <a class="link-arrow mt-s" href="/cam-balkon/">Cam balkon sistemleri ${I.arrow}</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">Ürün seçimi</span><h2 class="h2" style="margin-top:16px">Nereden başlamalı?</h2>
    <p class="lead" style="margin-top:18px">İhtiyacınızı seçin; size uygun sistemi ve ölçüde neyin kontrol edileceğini gösterelim.</p></div>
    <div class="picker" data-tabs>
      <div class="picker__opts" role="tablist" aria-label="İhtiyaç">
        ${D.collection
          .map(
            (c, i) => `<button class="picker__opt" role="tab" id="pt-${c.slug}" aria-controls="pp-${c.slug}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
          <span class="num">${c.no}</span><span><strong>${c.need}</strong><span>${c.title}</span></span></button>`
          )
          .join("")}
      </div>
      <div>
        ${D.collection
          .map(
            (c, i) => `<div class="picker__panel" role="tabpanel" id="pp-${c.slug}" aria-labelledby="pt-${c.slug}"${i ? " hidden" : ""}>
          ${img(c.img, c.title)}
          <div class="picker__body">
            <span class="eyebrow">Önerimiz</span>
            <h3 class="h3" style="color:var(--teal)">${c.title}</h3>
            <p class="muted" style="margin:0">${c.pitch}</p>
            <dl><div><dt>İhtiyaç</dt><dd>${c.need}</dd></div><div><dt>Ölçüde kontrol</dt><dd>${c.check}</dd></div></dl>
            <div class="actions"><a class="btn" href="/${c.slug}/">İncele ${I.arrow}</a><a class="btn btn--ghost" href="/iletisim/?urun=${c.slug}#teklif">Teklif al</a></div>
          </div>
        </div>`
          )
          .join("")}
      </div>
    </div>
    <p class="muted mt-m" style="font-size:13px">Nihai ölçü, renk, cam ve donanım; onaylanan teklif ve uygulama detaylarıyla belirlenir.</p>
  </div>
</section>

<section class="section bg-night">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">03 / Cam balkon</span><h2 class="h2" style="margin-top:16px">Açılır, katlanır, kapanır.</h2></div>
    <div data-tabs>
      <div class="tabs" role="tablist" aria-label="Cam balkon sistemleri">
        ${D.camBalkonSystems
          .map((s, i) => `<button class="tab" role="tab" id="ct-${s.key}" aria-controls="cp-${s.key}" data-img="ci-${s.key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${s.title}</button>`)
          .join("")}
      </div>
      <div class="showcase">
        <div class="showcase__media">${D.camBalkonSystems.map((s, i) => img(s.img, `${s.title} cam balkon uygulaması`, { id: `ci-${s.key}`, cls: i === 0 ? "is-on" : "" })).join("")}</div>
        <div class="showcase__text">
          ${D.camBalkonSystems
            .map(
              (s, i) => `<div role="tabpanel" id="cp-${s.key}" aria-labelledby="ct-${s.key}"${i ? " hidden" : ""}>
            <h3 class="h3" style="color:#f4efe5;font-size:44px">${s.title}</h3>
            <p class="lead" style="margin-top:16px">${s.text}</p>
            <p class="showcase__note">${I.check}${s.note}</p>
          </div>`
            )
            .join("")}
          <a class="btn btn--light mt-m" href="/cam-balkon/">Tüm cam balkon detayları ${I.arrow}</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" data-rail>
  <div class="wrap">
    <div class="rail-head">
      <div class="reveal"><span class="eyebrow">04 / Duşakabin</span><h2 class="h2" style="margin-top:16px">On model, tek ölçü: banyonuz.</h2></div>
      <div class="rail-ctrl"><button type="button" data-dir="-1" aria-label="Önceki">${I.left}</button><button type="button" data-dir="1" aria-label="Sonraki">${I.arrow}</button></div>
    </div>
    <div class="rail">${D.dkModels.map((m) => modelCard(m, { rail: true })).join("")}</div>
    <a class="link-arrow mt-m" href="/dusakabin/">Koleksiyonun tamamı ve yerleşim rehberi ${I.arrow}</a>
  </div>
  ${lightbox}
</section>

<section class="section bg-cream">
  <div class="wrap process">
    <div class="process__sticky reveal">
      <span class="eyebrow">Keşiften uygulamaya</span>
      <h2 class="h2" style="margin-top:16px">Birlikte netleştirelim.</h2>
      <div class="process__img">${img("surec-uygulama", "Uygulaması tamamlanmış dikey sistem")}</div>
    </div>
    <ol class="steps">
      ${D.steps.map((s, i) => `<li class="step reveal" data-d="${i % 3}"><span class="num">${s.no}</span><div><h3>${s.title}</h3><p>${s.text}</p></div></li>`).join("")}
    </ol>
  </div>
</section>

${ctaBand()}
`,
});

/* SİNEKLİK ----------------------------------------------------------- */
page({
  path: "/sineklik/",
  title: "Sineklik sistemleri — Plise, sürme, menteşeli, stor",
  description: "Antalya'da plise, sürme, sabit/menteşeli ve stor sineklik. İçten veya dıştan takma, doğramaya uygun donanım ve yerinde ölçü.",
  ld: [breadcrumbLd([{ label: "Sineklik", href: "/sineklik/" }])],
  body: `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([{ label: "Sineklik" }])}
    <div class="page-hero__grid">
      <div>
        <span class="eyebrow">01 / Sineklik sistemleri</span>
        <h1 class="h1">Havalandırın, geçin, toplayın.</h1>
        <p class="lead">Balkon ve teras kapıları ile pencere açıklıklarında; açılır kanat için yer ayrılmak istenmeyen alanlarda tül, hareket biçimine göre seçilir.</p>
        <div class="page-hero__chips"><span class="chip">Plise</span><span class="chip">Sürme</span><span class="chip">Sabit / menteşeli</span><span class="chip">Stor</span></div>
        <div class="hero__actions"><a class="btn" href="/iletisim/?urun=sineklik#teklif">${I.ruler}Ölçü için keşif iste</a></div>
      </div>
      <figure class="page-hero__media" style="margin:0">${img("sineklik-plise-salon", "Teras kapısında katlanarak toplanan plise sineklik", { eager: true })}<figcaption style="position:absolute;left:0;bottom:0;background:var(--night);color:#ece7dd;font-size:13px;padding:12px 18px">Katlanarak kenarda toplanan tül</figcaption></figure>
    </div>
  </div>
</section>

<section class="section bg-cream">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">Hareket seçenekleri</span><h2 class="h2" style="margin-top:16px">Günlük kullanıma göre</h2></div>
    <div class="grid grid--4 mt-l">
      ${D.sineklikTypes
        .map((t, i) => `<article class="card reveal" data-d="${i % 4}"><div class="card__img">${img(t.img, t.title + " sineklik")}</div><h3>${t.title}</h3><p>${t.text}</p><a class="label" href="/iletisim/?urun=sineklik&tip=${encodeURIComponent(t.title)}#teklif">Teklif al →</a></article>`)
        .join("")}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="reveal">
      <span class="eyebrow">Öne çıkan</span>
      <h2 class="h2" style="margin:16px 0 28px">Plise sineklik</h2>
      <div class="facts">
        <div class="fact"><h3>Çalışma biçimi</h3><p>Plise tül yatay hareketle toplanır. Geçiş gerektiğinde hareketli profil yana alınır.</p></div>
        <div class="fact"><h3>Nerede kullanılır?</h3><p>Balkon ve teras kapıları ile pencere açıklıklarında; açılır kanat için yer ayrılmak istenmeyen alanlarda.</p></div>
        <div class="fact"><h3>Seçimde önemli</h3><p>Tek veya çift kanat kararı açıklık ölçüsüne göre verilir. Tül ve donanım aynı seriyle eşleştirilir.</p></div>
      </div>
    </div>
    <figure class="split__media reveal" data-d="1" style="margin:0;aspect-ratio:4/5">${img("sineklik-plise", "Plise sineklik detay")}</figure>
  </div>
</section>

<section class="section bg-cream">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">Yerleşim</span><h2 class="h2" style="margin-top:16px">Doğramayla uyum</h2></div>
    <div class="grid grid--2 mt-l">
      <article class="card reveal"><div class="card__img card__img--wide" style="aspect-ratio:480/245">${img("montaj-icten", "İçten takma sineklik şematik gösterim")}</div><h3>İçten takma</h3><p>Uygun doğramalarda içeriden takma ve sökme olanağı sunar. Klips ve çerçeve, pencerenin profil yapısına göre seçilir.</p><span class="label">Kol, conta ve kanat hareketi kontrol edilir.</span></article>
      <article class="card reveal" data-d="1"><div class="card__img card__img--wide" style="aspect-ratio:480/245">${img("montaj-distan", "Dıştan takma sineklik şematik gösterim")}</div><h3>Dıştan takma</h3><p>Çerçeve doğramanın dış yüzeyine yerleştirilir. Panjur, denizlik ve sabitleme noktaları birlikte değerlendirilir.</p><span class="label">Temizlik ve bakım için erişim planlanır.</span></article>
    </div>
    <p class="muted mt-m" style="font-size:13px">Slim plise: profil derinliği ve tülün toplanma payı, dar montaj alanıyla birlikte kontrol edilir. Görseller şematiktir.</p>
  </div>
</section>

<section class="section bg-sand">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">Donanım</span><h2 class="h2" style="margin-top:16px">Sistemi tamamlayan parçalar</h2></div>
    <div class="grid grid--2 mt-l">
      <article class="kit reveal"><div class="kit__img">${img("set-plise", "Plise sineklik donanım seti")}</div><div class="kit__body"><h3>Plise seti</h3><span class="label">4 köşe takozu · 2 teker · 2 ip sabitleme pimi</span><p>18 mm örnek set. Köşe parçaları hizalamayı, teker ve ip parçaları hareket düzenini tamamlar.</p></div></article>
      <article class="kit reveal" data-d="1"><div class="kit__img">${img("set-surme", "Sürme sineklik donanım seti")}</div><div class="kit__body"><h3>Sürme seti</h3><span class="label">4 köşe takozu · 2 çavuş · 2 alt teker · 2 üst kılavuz · 2 yan kilit</span><p>Örnek set. Alt teker hareketi, üst kılavuz yönlendirmeyi, yan kilit kapanmayı destekler.</p></div></article>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">Malzeme rehberi</span><h2 class="h2" style="margin-top:16px">Detayların işlevi</h2></div>
    <div class="grid grid--3 mt-l" style="row-gap:0">
      ${D.sineklikMaterials.map((m) => `<div class="part reveal">${img(m.img, m.title)}<div><h3>${m.title}</h3><p>${m.text}</p></div></div>`).join("")}
    </div>
  </div>
</section>

${ctaBand({ title: "Doğramanıza uygun sineklik.", text: "Pencere ve kapınızın profil yapısını, panjur ve denizlik durumunu yerinde inceleyip içten mi dıştan mı takılacağını birlikte belirleyelim.", product: "sineklik" })}
`,
});

/* PLİSE PERDE -------------------------------------------------------- */
page({
  path: "/plise-perde/",
  title: "Plise perde — Tül ve gece-gündüz sistemleri",
  description: "Pencere ve cam balkonlar için plise perde. Gece-gündüz sistemiyle ışık ve mahremiyet kontrolü; her panel kendi ölçüsüyle.",
  ld: [breadcrumbLd([{ label: "Plise perde", href: "/plise-perde/" }])],
  body: `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([{ label: "Plise perde" }])}
    <div class="page-hero__grid">
      <div>
        <span class="eyebrow">02 / Plise perde</span>
        <h1 class="h1">Kumaş, ışık, mahremiyet.</h1>
        <p class="lead">Kumaş katlanarak hareketli profilin yanında toplanır. Pencere ve cam balkon uygulamalarında her panel, kendi ölçüsüyle değerlendirilir.</p>
        <div class="page-hero__chips"><span class="chip">Pencere</span><span class="chip">Cam balkon</span><span class="chip">Gece-gündüz</span></div>
        <div class="hero__actions"><a class="btn" href="/iletisim/?urun=plise-perde#teklif">${I.ruler}Keşif iste</a></div>
      </div>
      <figure class="page-hero__media" style="margin:0;background:#fff;display:grid;place-items:center">${img("plise-gece-gunduz", "Gece-gündüz plise perde sistem örneği", { eager: true, attrs: 'style="width:auto;height:92%;object-fit:contain"' })}</figure>
    </div>
  </div>
</section>

<section class="section bg-cream">
  <div class="wrap split">
    <figure class="split__media reveal" style="margin:0;aspect-ratio:1;background:#fff">${img("plise-kumas-detay", "Plise kumaş ve profil detayı")}</figure>
    <div class="reveal" data-d="1">
      <span class="eyebrow">Kumaş seçimi</span>
      <h2 class="h2" style="margin:16px 0 28px">Günün farklı saatleri</h2>
      <div class="facts">
        <div class="fact"><h3>Gün ışığı</h3><p>Tül etkili kumaş gün ışığını yumuşatır. Geçirgenlik, kumaşın dokusuna ve yapısına bağlıdır.</p></div>
        <div class="fact"><h3>Mahremiyet</h3><p>Gece-gündüz sisteminde ikinci kumaş daha örtücü bir etki sağlar. Karartma düzeyini montaj ve kenar boşlukları da etkiler.</p></div>
        <div class="fact"><h3>Bakım</h3><p>Kumaşa uygun temizlik yöntemi uygulanır; sert kimyasallardan kaçınılır.</p></div>
      </div>
      <p class="muted mt-m" style="font-size:13px">Renk ve doku numuneyle seçilir; baskı ve ekran görünümü değişebilir.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="reveal">
      <span class="eyebrow">Montajdan önce</span>
      <h2 class="h2" style="margin:16px 0 24px">Her panel kendi ölçüsüyle.</h2>
      <p class="lead">Camın açılma hareketi, tutamak konumu ve perde profilinin toplanma alanı kontrol edilir.</p>
      <a class="link-arrow mt-m" href="/cam-balkon/">Cam balkonlarda plise ${I.arrow}</a>
    </div>
    <figure class="split__media reveal" data-d="1" style="margin:0;aspect-ratio:16/10">${img("cam-balkon-salon", "Panoramik cam balkonlu yaşam alanı")}</figure>
  </div>
</section>

${ctaBand({ title: "Numune ile seçelim.", text: "Kumaş rengini ve dokusunu yerinde, kendi ışığınızda görün. Ölçüyü alıp panel bazlı teklif hazırlayalım.", product: "plise-perde" })}
`,
});

/* CAM BALKON --------------------------------------------------------- */
page({
  path: "/cam-balkon/",
  title: "Cam balkon — Katlanır, sürme, ısıcamlı, motorlu giyotin",
  description: "Antalya'da katlanır, sürme, ısıcamlı ve motorlu giyotin cam balkon. Balkon, teras ve ticari açıklıklar için proje bazlı uygulama.",
  ld: [breadcrumbLd([{ label: "Cam balkon", href: "/cam-balkon/" }])],
  body: `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([{ label: "Cam balkon" }])}
    <div class="page-hero__grid">
      <div>
        <span class="eyebrow">03 / Cam balkon</span>
        <h1 class="h1">Cam balkon</h1>
        <p class="lead">Balkon, teras ve ticari açıklıklarda; panel hareketi, geçiş alanı ve kullanım alışkanlıkları birlikte planlanır.</p>
        <div class="page-hero__chips">${D.camBalkonSystems.map((s) => `<a class="chip" href="#${s.key}">${s.title}</a>`).join("")}</div>
        <div class="hero__actions"><a class="btn" href="/iletisim/?urun=cam-balkon#teklif">${I.ruler}Keşif iste</a></div>
      </div>
      <figure class="page-hero__media" style="margin:0;aspect-ratio:4/5">${img("cam-balkon-kapak", "Ahşap profilli katlanır cam balkon uygulaması", { eager: true })}</figure>
    </div>
  </div>
</section>

<section class="section bg-cream">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">Panel hareketi</span><h2 class="h2" style="margin-top:16px">Katlanır ve sürme sistemler</h2></div>
    <div class="grid grid--2 mt-l">
      ${D.camBalkonSystems
        .slice(0, 2)
        .map((s, i) => `<article class="card reveal" id="${s.key}" data-d="${i}"><div class="card__img card__img--wide">${img(s.img, s.title + " cam balkon")}</div><h3 style="font-size:40px">${s.title}</h3><p>${s.text}</p><a class="label" href="/iletisim/?urun=cam-balkon&tip=${encodeURIComponent(s.title)}#teklif">${s.title} için teklif al →</a></article>`)
        .join("")}
    </div>
    <p class="muted mt-m" style="font-size:13px">Görseller çalışma biçimini ve uygulama görünümünü gösterir.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">Sistem seçimi</span><h2 class="h2" style="margin-top:16px">Cam ve hareket donanımı</h2></div>
    <div class="grid grid--2 mt-l">
      ${D.camBalkonSystems
        .slice(2)
        .map((s, i) => `<article class="card reveal" id="${s.key}" data-d="${i}"><div class="card__img card__img--wide">${img(s.img, s.title + " cam balkon")}</div><h3 style="font-size:40px">${s.title === "Isıcamlı" ? "Isıcamlı seçenekler" : s.title}</h3><p>${s.text}</p><span class="label">${s.note}</span></article>`)
        .join("")}
    </div>
  </div>
</section>

<section class="section bg-night">
  <div class="wrap split split--wide-media">
    <figure class="split__media reveal" style="margin:0;aspect-ratio:16/10">${img("cam-balkon-salon", "Kavisli cam balkonla genişletilmiş salon")}</figure>
    <div class="reveal" data-d="1">
      <span class="eyebrow">Uygulamalar</span>
      <h2 class="h2" style="margin:16px 0 24px">Cephe üzerinde</h2>
      <div class="facts"><div class="fact"><h3 style="color:var(--gold-2)">Renk ve panel bölünmesi</h3><p>Mevcut cephe, açıklık ve geçiş ihtiyacına göre değerlendirilir.</p></div></div>
      <div style="margin-top:28px;aspect-ratio:3/4;max-width:260px;overflow:hidden">${img("cam-balkon-cephe", "Bina köşesinde cam balkon uygulaması")}</div>
    </div>
  </div>
</section>

${ctaBand({ title: "Balkonunuzu yerinde ölçelim.", text: "Eşik, panel parkı ve bağlantı yüzeyini kontrol edip katlanır, sürme, ısıcamlı veya giyotin seçeneklerinden size uygun olanı birlikte belirleyelim.", product: "cam-balkon" })}
`,
});

/* DUŞAKABİN ---------------------------------------------------------- */
const dkCounts = Object.fromEntries(D.dkFilters.map((f) => [f.key, f.key === "hepsi" ? D.dkModels.length : D.dkModels.filter((m) => m.type === f.key).length]));
page({
  path: "/dusakabin/",
  title: "Duşakabin — 10 model koleksiyon",
  description: "Düz cephe, köşe, niş ve sabit panel duşakabin modelleri. Çizgili, füme, koyu çerçeveli ve minimal seçenekler; banyonuza göre yerleşim.",
  ld: [
    breadcrumbLd([{ label: "Duşakabin", href: "/dusakabin/" }]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "NİLSER duşakabin koleksiyonu",
      itemListElement: D.dkModels.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: `DK-${m.no} ${m.title}`, image: `${site.url}/assets/img/dk-${m.no}.webp` })),
    },
  ],
  body: `
<section class="page-hero">
  <div class="wrap">
    ${crumbs([{ label: "Duşakabin" }])}
    <div class="page-hero__grid">
      <div>
        <span class="eyebrow">04 / Duşakabin</span>
        <h1 class="h1">Duş alanları</h1>
        <p class="lead">Düz cephe, köşe, niş ve sabit panel seçenekleri. Cam görünümü, profil ve kapı hareketi, banyonun yerleşimiyle birlikte seçilir.</p>
        <div class="hero__facts" style="margin-top:28px"><div><strong>10</strong><span>model</span></div><div><strong>4</strong><span>yerleşim tipi</span></div></div>
      </div>
      <figure class="page-hero__media" style="margin:0;aspect-ratio:4/5">${img("dusakabin-kapak", "DK-05 koyu çerçeveli duşakabin", { eager: true })}<figcaption style="position:absolute;left:18px;bottom:16px;color:#fff;font-size:12px;letter-spacing:.14em;font-weight:700">DK-05 / KOYU ÇERÇEVELİ</figcaption></figure>
    </div>
  </div>
</section>

<section class="section bg-cream" id="modeller">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">Model koleksiyonu</span><h2 class="h2" style="margin-top:16px">Banyonuza göre filtreleyin</h2></div>
    <div class="filters" role="group" aria-label="Yerleşim tipine göre filtrele">
      ${D.dkFilters.map((f, i) => `<button type="button" class="filter" data-filter="${f.key}" aria-pressed="${i === 0}">${f.label}<small>${dkCounts[f.key]}</small></button>`).join("")}
    </div>
    <div class="model-grid">${D.dkModels.map((m) => modelCard(m)).join("")}</div>
  </div>
  ${lightbox}
</section>

<section class="section">
  <div class="wrap split">
    <figure class="split__media reveal" style="margin:0;aspect-ratio:1">${img("dusakabin-yerlesim", "Mermer banyoda sabit panel duşakabin")}</figure>
    <div class="reveal" data-d="1">
      <span class="eyebrow">Planlama</span>
      <h2 class="h2" style="margin:16px 0 28px">Yerleşim notları</h2>
      <div class="facts">
        <div class="fact"><h3>01 / Giriş</h3><p>Kapı açılımı, yaklaşma mesafesi ve banyo içindeki dolaşım alanı birlikte değerlendirilir.</p></div>
        <div class="fact"><h3>02 / Duvar ve zemin</h3><p>Nişlerde farklı noktalardan ölçü alınır. Sabit panelde duş başlığı, sıçrama yönü ve zemin eğimi kontrol edilir.</p></div>
        <div class="fact"><h3>03 / Görünüm</h3><p>Cam ve profil tonu; banyo ışığı, seramik ve metal detaylarla birlikte seçilir.</p></div>
      </div>
    </div>
  </div>
</section>

${ctaBand({ title: "Banyonuzu ölçelim.", text: "Duvar düşeyliği, zemin eğimi ve kapı hareketini yerinde kontrol edip seçtiğiniz model için net teklif hazırlayalım.", product: "dusakabin" })}
`,
});

/* İLETİŞİM / TEKLİF -------------------------------------------------- */
const typesJson = esc(JSON.stringify(Object.fromEntries(D.quoteProducts.map((p) => [p.key, p.types]))));
const productThumb = { sineklik: "sineklik-surme", "plise-perde": "plise-kumas-detay", "cam-balkon": "cam-balkon-katlanir", dusakabin: "dk-09" };
page({
  path: "/iletisim/",
  title: "İletişim ve keşif talebi",
  description: `NİLSER Alüminyum iletişim: ${site.contacts.map((c) => c.phone).join(", ")}. ${site.address}, ${site.district} / ${site.city}. Online teklif ve yerinde keşif talebi.`,
  ld: [breadcrumbLd([{ label: "İletişim", href: "/iletisim/" }])],
  body: `
<section class="page-hero" style="padding-bottom:0">
  <div class="wrap">
    ${crumbs([{ label: "İletişim" }])}
    <span class="eyebrow">İletişim</span>
    <h1 class="h1" style="margin:18px 0 22px">Birlikte netleştirelim.</h1>
    <p class="lead">Ölçüleri bilmiyorsanız sorun değil — yaklaşık değer yazın, yerinde keşifte birlikte ölçelim.</p>
  </div>
</section>

<section class="section--tight" style="padding-top:clamp(40px,5vw,72px)">
  <div class="wrap contact-grid">
    <div>
      ${site.contacts
        .map(
          (c) => `<div class="person">
        <strong>${c.name}</strong>
        <a class="tel" href="tel:${c.tel}">${c.phone}</a><br>
        <a class="mail" href="mailto:${c.email}">${c.email}</a>
        <div class="row"><a href="tel:${c.tel}">${I.phone}Ara</a><a href="https://wa.me/${c.tel.replace("+", "")}" target="_blank" rel="noopener">${I.wa}WhatsApp</a></div>
      </div>`
        )
        .join("")}
      <div class="person">
        <strong>Genel</strong>
        <a class="mail" href="mailto:${site.email}">${site.email}</a>
        <address style="font-style:normal;margin-top:10px;color:var(--muted)">${site.address}<br>${site.district} / ${site.city}</address>
      </div>
      <div class="map">
        <div class="map__ph">${I.pin}<p>Harita, tıkladığınızda Google Haritalar'dan yüklenir.</p>
          <button class="btn btn--ghost" type="button" data-map="${site.mapsEmbed}">Haritayı göster</button>
          <a class="link-arrow" href="${site.mapsUrl}" target="_blank" rel="noopener">Yol tarifi al ${I.arrow}</a>
        </div>
      </div>
    </div>

    <form class="quote" id="teklif-form" action="/iletisim.php" method="post" data-wa="${site.primaryPhone.wa}" data-types="${typesJson}" novalidate>
      <span id="teklif" style="position:relative;top:calc(-1 * var(--header) - 24px)"></span>
      <div class="quote__head" aria-hidden="true">
        <div class="quote__step"><b>1</b>Ürün</div>
        <div class="quote__step"><b>2</b>Ölçü</div>
        <div class="quote__step"><b>3</b>İletişim</div>
      </div>
      <div class="quote__body">
        <fieldset>
          <legend>Ne düşünüyorsunuz?</legend>
          <p class="hint">Bir ürün seçin, ardından tipini belirleyin.</p>
          <div class="choice-grid">
            ${D.quoteProducts
              .map((p, i) => `<label class="choice"><input type="radio" name="urun" value="${p.key}" data-label="${p.label}" required${i === 0 ? " checked" : ""}><span>${img(productThumb[p.key], "")}${p.label}</span></label>`)
              .join("")}
          </div>
          <div class="field mt-m"><span class="flabel">Tip</span><div class="pills" data-q-types></div></div>
          <input type="hidden" name="model">
        </fieldset>

        <fieldset hidden>
          <legend>Ölçü ve konum</legend>
          <p class="hint">Yaklaşık değerler yeterli; kesin ölçüyü keşifte biz alırız.</p>
          <div class="fields">
            <div class="field"><label for="q-en">Genişlik (cm)</label><input id="q-en" name="en" type="number" inputmode="numeric" min="10" max="5000" placeholder="örn. 240"></div>
            <div class="field"><label for="q-boy">Yükseklik (cm)</label><input id="q-boy" name="boy" type="number" inputmode="numeric" min="10" max="1000" placeholder="örn. 220"></div>
            <div class="field"><label for="q-adet">Adet</label><input id="q-adet" name="adet" type="number" inputmode="numeric" min="1" max="200" value="1"></div>
            <div class="field"><label for="q-ilce">İlçe / semt</label><input id="q-ilce" name="ilce" type="text" maxlength="80" placeholder="örn. Konyaaltı" autocomplete="address-level2"></div>
            <div class="field field--full"><label for="q-not">Not</label><textarea id="q-not" name="not" maxlength="1000" placeholder="Kat, cephe, mevcut doğrama, renk tercihi…"></textarea></div>
          </div>
        </fieldset>

        <fieldset hidden>
          <legend>Size nasıl ulaşalım?</legend>
          <p class="hint">Talebinizi WhatsApp'tan iletebilir veya form ile gönderebilirsiniz.</p>
          <div class="quote__summary" aria-live="polite"></div>
          <div class="fields">
            <div class="field"><label for="q-ad">Ad Soyad *</label><input id="q-ad" name="ad" type="text" required minlength="3" maxlength="80" autocomplete="name"></div>
            <div class="field"><label for="q-tel">Telefon *</label><input id="q-tel" name="telefon" type="tel" required pattern="[0-9 +()\\-]{10,20}" maxlength="20" autocomplete="tel" placeholder="05xx xxx xx xx"></div>
            <div class="field field--full"><label for="q-mail">E-posta</label><input id="q-mail" name="eposta" type="email" maxlength="120" autocomplete="email"></div>
            <label class="consent field--full"><input type="checkbox" name="kvkk" value="1" required><span><a href="/kvkk/" target="_blank">KVKK aydınlatma metnini</a> okudum; talebim için benimle iletişime geçilmesini kabul ediyorum.</span></label>
          </div>
          <div class="hp" aria-hidden="true"><label>Web sitesi<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        </fieldset>

        <div class="quote__foot">
          <button class="btn btn--ghost" type="button" data-q-back>${I.left}Geri</button>
          <button class="btn" type="button" data-q-next style="margin-left:auto">Devam ${I.arrow}</button>
        </div>
        <div class="quote__send" data-q-send hidden>
          <button class="btn btn--wa" type="button" data-q-wa>${I.wa}WhatsApp'tan gönder</button>
          <button class="btn" type="submit">${I.mail}Form ile gönder</button>
        </div>
        <p class="form-msg" role="status" hidden></p>
        <noscript><p class="form-msg">Form için JavaScript gerekir. Lütfen bizi <a href="tel:${site.primaryPhone.tel}">${site.primaryPhone.label}</a> numarasından arayın.</p></noscript>
      </div>
    </form>
  </div>
</section>

<section class="section bg-cream">
  <div class="wrap">
    <div class="reveal"><span class="eyebrow">Ürün seçimi</span><h2 class="h2" style="margin-top:16px">Nereden başlamalı?</h2></div>
    <table class="guide">
      <thead><tr><th></th><th>Ürün</th><th>İhtiyaç</th><th>Ölçüde kontrol</th></tr></thead>
      <tbody>${D.collection.map((c) => `<tr><td><span class="num">${c.no}</span></td><td class="t"><a href="/${c.slug}/">${c.title}</a></td><td>${c.need}</td><td>${c.check}</td></tr>`).join("")}</tbody>
    </table>
    <p class="muted mt-m" style="font-size:13px">Nihai ölçü, renk, cam ve donanım; onaylanan teklif ve uygulama detaylarıyla belirlenir.</p>
  </div>
</section>
`,
});

/* KVKK --------------------------------------------------------------- */
page({
  path: "/kvkk/",
  title: "KVKK aydınlatma metni",
  description: "NİLSER Alüminyum kişisel verilerin korunması aydınlatma metni.",
  body: `
<section class="section--tight">
  <div class="wrap legal">
    ${crumbs([{ label: "KVKK aydınlatma metni" }])}
    <h1 class="h1" style="font-size:clamp(40px,5vw,64px)">KVKK aydınlatma metni</h1>
    <p class="lead mt-m">6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, veri sorumlusu sıfatıyla ${site.legal} ("NİLSER") olarak sizi bilgilendiririz.</p>
    <h2>İşlenen veriler</h2>
    <p>Teklif ve iletişim formunda paylaştığınız ad soyad, telefon, e-posta, ilçe/semt bilgisi ile ürün ve ölçüye ilişkin notlarınız.</p>
    <h2>İşleme amacı ve hukuki sebep</h2>
    <p>Verileriniz; talebinize dönüş yapılması, keşif randevusunun planlanması ve teklif hazırlanması amacıyla, KVKK m.5/2-c (sözleşmenin kurulması) ve açık rızanız kapsamında işlenir.</p>
    <h2>Aktarım</h2>
    <p>Verileriniz pazarlama amacıyla üçüncü kişilerle paylaşılmaz. Form, sitemizin barındırıldığı sunucudaki e-posta altyapısı ile iletilir. WhatsApp ile gönderim seçeneğini kullanmanız hâlinde mesajınız WhatsApp hizmeti üzerinden iletilir.</p>
    <h2>Saklama süresi</h2>
    <p>Talebiniz sonuçlandıktan sonra, yasal yükümlülükler saklı kalmak kaydıyla, makul süre sonunda silinir.</p>
    <h2>Haklarınız</h2>
    <p>KVKK m.11 kapsamındaki taleplerinizi <a href="mailto:${site.email}">${site.email}</a> adresine veya ${site.address}, ${site.district} / ${site.city} adresine iletebilirsiniz.</p>
    <h2>Çerezler</h2>
    <p>Bu site reklam veya izleme çerezi kullanmaz. Harita yalnızca "Haritayı göster" butonuna tıkladığınızda Google Haritalar'dan yüklenir.</p>
  </div>
</section>`,
});

/* TEŞEKKÜRLER (JS'siz form gönderimi sonrası) ------------------------ */
page({
  path: "/tesekkurler/",
  title: "Teşekkürler",
  description: "Talebiniz alındı.",
  noindex: true,
  body: `
<section class="section">
  <div class="wrap center">
    <span class="eyebrow">Talebiniz alındı</span>
    <h1 class="h1" style="margin:18px 0">Teşekkürler.</h1>
    <p class="lead" style="margin-inline:auto">En kısa sürede sizi arayacağız. Acil durumlar için <a href="tel:${site.primaryPhone.tel}" style="text-decoration:underline">${site.primaryPhone.label}</a>.</p>
    <a class="btn mt-m" href="/">Ana sayfaya dön</a>
  </div>
</section>`,
});

/* 404 ---------------------------------------------------------------- */
page({
  path: "/404.html",
  title: "Sayfa bulunamadı",
  noindex: true,
  body: `
<section class="section">
  <div class="wrap center">
    <span class="eyebrow">404</span>
    <h1 class="h1" style="margin:18px 0">Bu ölçü tutmadı.</h1>
    <p class="lead" style="margin-inline:auto">Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p>
    <div class="hero__actions" style="justify-content:center"><a class="btn" href="/">Ana sayfa</a><a class="btn btn--ghost" href="/iletisim/">İletişim</a></div>
  </div>
</section>`,
});

/* ------------------------------------------------------------------ */
/* Yazdırma                                                            */
/* ------------------------------------------------------------------ */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const p of pages) {
  let html = layout(p);
  if (p.noindex) html = html.replace("<meta name=\"viewport\"", '<meta name="robots" content="noindex">\n<meta name="viewport"');
  const file = p.path.endsWith(".html") ? join(OUT, p.path) : join(OUT, p.path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });
writeFileSync(join(OUT, "assets/main.js"), readFileSync(join(SRC, "main.js"), "utf8"));
cpSync(join(ROOT, "public"), OUT, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const indexable = pages.filter((p) => !p.noindex);
writeFileSync(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable
    .map((p) => `  <url><loc>${site.url}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.path === "/" ? "1.0" : "0.8"}</priority></url>`)
    .join("\n")}\n</urlset>\n`
);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /iletisim.php\n\nSitemap: ${site.url}/sitemap.xml\n`);

const size = (f) => (readFileSync(f).length / 1024).toFixed(1) + " KB";
console.log(`✓ ${pages.length} sayfa üretildi → dist/`);
console.log(`  ana sayfa HTML: ${size(join(OUT, "index.html"))}, CSS (gömülü): ${(css.length / 1024).toFixed(1)} KB`);
if (!existsSync(join(OUT, ".htaccess"))) console.warn("⚠ .htaccess bulunamadı");
