/**
 * Teklif / iletişim formu → e-posta
 *
 * Hostinger → uygulama → Environment variables:
 *   SMTP_HOST   smtp.hostinger.com
 *   SMTP_PORT   465
 *   SMTP_USER   info@nilseraluminyum.com
 *   SMTP_PASS   o e-posta hesabının şifresi
 *   MAIL_TO     (isteğe bağlı) talebin gideceği adres; boşsa info@nilseraluminyum.com
 *
 * SMTP tanımlı değilse form anlaşılır bir hata verir; ziyaretçi WhatsApp
 * butonuyla göndermeye devam edebilir.
 */
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "nilseraluminyum.com";
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

function reply(request, ok, error = "", status = 200) {
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  if (wantsJson) return Response.json(ok ? { ok: true } : { ok: false, error }, { status });
  if (ok) return Response.redirect(new URL("/tesekkurler/", request.url), 303);
  return new Response(`${error} — /iletisim/ sayfasına dönün.`, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

const clean = (v, max) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
const oneLine = (v) => v.replace(/[\r\n]+/g, " ").trim();

export async function POST(request) {
  /* Başka sitelerden gönderimi engelle */
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  if (origin) {
    let host = "";
    try {
      host = new URL(origin).hostname.toLowerCase();
    } catch {}
    const own = (request.headers.get("host") || "").replace(/:\d+$/, "").toLowerCase();
    if (host !== SITE && host !== "www." + SITE && host !== own) return reply(request, false, "Geçersiz kaynak.", 403);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return reply(request, false, "Geçersiz istek.", 400);
  }

  /* Bal küpü: botlar gizli alanı doldurur */
  if (clean(form.get("website"), 200)) return reply(request, true);

  /* Basit hız sınırı (IP başına) */
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => t > now - WINDOW_MS);
  if (list.length >= LIMIT) return reply(request, false, "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin veya bizi arayın.", 429);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();

  const ad = oneLine(clean(form.get("ad"), 80));
  const telefon = oneLine(clean(form.get("telefon"), 20));
  const eposta = oneLine(clean(form.get("eposta"), 120));
  let mesaj = clean(form.get("mesaj"), 3000);
  const kvkk = form.get("kvkk") === "1";

  if (ad.length < 3) return reply(request, false, "Lütfen adınızı yazın.", 422);
  if (!/^[0-9 +()\-]{10,20}$/.test(telefon)) return reply(request, false, "Lütfen geçerli bir telefon numarası yazın.", 422);
  if (eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) return reply(request, false, "E-posta adresi geçersiz.", 422);
  if (!kvkk) return reply(request, false, "Lütfen KVKK onayını işaretleyin.", 422);

  if (!mesaj) {
    // JavaScript kapalıysa özet tarayıcıda üretilemez; alanlardan oluştur
    const labels = { urun: "Ürün", tip: "Tip", model: "Model", en: "Genişlik (cm)", boy: "Yükseklik (cm)", adet: "Adet", ilce: "Konum", not: "Not" };
    mesaj = Object.entries(labels)
      .map(([k, l]) => [l, clean(form.get(k), 1000)])
      .filter(([, v]) => v)
      .map(([l, v]) => `${l}: ${v}`)
      .concat([`Ad Soyad: ${ad}`, `Telefon: ${telefon}`, eposta && `E-posta: ${eposta}`])
      .filter(Boolean)
      .join("\n");
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("[teklif] SMTP ayarlı değil — talep e-postayla gönderilemedi:\n" + mesaj);
    return reply(request, false, "Form şu an e-posta gönderemiyor. Lütfen WhatsApp veya telefonla ulaşın.", 503);
  }

  const port = Number(SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const urun = oneLine(clean(form.get("urun"), 40));
  try {
    await transport.sendMail({
      from: { name: "NİLSER Web", address: SMTP_USER },
      to: process.env.MAIL_TO || "info@" + SITE,
      replyTo: eposta ? { name: ad, address: eposta } : undefined,
      subject: `Web teklif talebi${urun ? ` (${urun})` : ""} — ${ad}`,
      text: `${mesaj}\n\n------------------------------\nTarih : ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}\nIP    : ${ip}\nKaynak: https://${SITE}/iletisim/\n`,
    });
  } catch (err) {
    console.error("[teklif] e-posta gönderilemedi:", err?.message);
    return reply(request, false, "E-posta gönderilemedi. Lütfen WhatsApp veya telefonla ulaşın.", 502);
  }

  return reply(request, true);
}
