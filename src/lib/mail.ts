/**
 * E-POSTA BİLDİRİMLERİ
 * SMTP bilgileri .env'de tanımlı değilse sessizce atlanır (geliştirme kolaylığı).
 */

import "server-only";
import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/money";

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function send(to: string, subject: string, html: string) {
  const transport = getTransport();
  if (!transport) {
    console.info(`[mail atlandı — SMTP tanımsız] ${to} / ${subject}`);
    return;
  }
  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("[mail hatası]", (error as Error).message);
  }
}

/**
 * E-postaya basılan her dış değer kaçışlanır. Müşteri adını
 * `<a href="...">Hesabını doğrula</a>` yazarsa, sitenin kendi e-postasının
 * içine oltalama bağlantısı yerleştirmiş olurdu.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, body: string) {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Alenora";
  return `<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#faf7f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2b2321">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:32px;border:1px solid #efe6e1">
      <p style="margin:0 0 24px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#a4785f">${esc(siteName)}</p>
      <h1 style="margin:0 0 16px;font-size:21px;font-weight:600">${title}</h1>
      ${body}
      <hr style="border:none;border-top:1px solid #efe6e1;margin:28px 0 16px">
      <p style="margin:0;font-size:12px;color:#8a7c75">Bu e-posta ${siteName} siparişiniz için gönderildi.</p>
    </div></body></html>`;
}

export type OrderMailData = {
  orderNumber: string;
  email: string;
  customerName: string;
  grandTotal: number;
  items: { productName: string; variantInfo: string; quantity: number; lineTotal: number }[];
};

/** Müşteriye sipariş onay maili */
export async function sendOrderConfirmation(order: OrderMailData) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;font-size:14px">${esc(i.productName)}<br><span style="color:#8a7c75;font-size:12px">${esc(i.variantInfo)} · ${esc(i.quantity)} adet</span></td>
         <td style="padding:8px 0;text-align:right;font-size:14px;white-space:nowrap">${formatPrice(i.lineTotal)}</td></tr>`,
    )
    .join("");

  await send(
    order.email,
    `Siparişiniz alındı — ${order.orderNumber}`,
    layout(
      `Teşekkürler ${esc(order.customerName)}!`,
      `<p style="margin:0 0 20px;font-size:14px;line-height:1.6">
         <strong>${esc(order.orderNumber)}</strong> numaralı siparişiniz başarıyla alındı ve hazırlanmaya başlıyor.
         Kargoya verildiğinde takip numarasını size ileteceğiz.</p>
       <table style="width:100%;border-collapse:collapse">${rows}
         <tr><td style="padding:14px 0 0;border-top:1px solid #efe6e1;font-weight:600">Toplam</td>
         <td style="padding:14px 0 0;border-top:1px solid #efe6e1;text-align:right;font-weight:600">${formatPrice(order.grandTotal)}</td></tr>
       </table>`,
    ),
  );
}

/** Yöneticiye yeni sipariş bildirimi */
export async function sendAdminOrderNotice(order: OrderMailData) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return;
  await send(
    to,
    `Yeni sipariş: ${order.orderNumber} — ${formatPrice(order.grandTotal)}`,
    layout(
      "Yeni sipariş geldi",
      `<p style="font-size:14px">Sipariş: <strong>${esc(order.orderNumber)}</strong><br>
       Müşteri: ${esc(order.customerName)} (${esc(order.email)})<br>
       Tutar: <strong>${formatPrice(order.grandTotal)}</strong><br>
       Ürün sayısı: ${order.items.reduce((s, i) => s + i.quantity, 0)}</p>`,
    ),
  );
}

/** Kargo bildirimi */
export async function sendShippingNotice(
  email: string,
  orderNumber: string,
  company: string,
  tracking: string,
) {
  await send(
    email,
    `Siparişiniz kargoya verildi — ${orderNumber}`,
    layout(
      "Siparişiniz yolda",
      `<p style="font-size:14px;line-height:1.6"><strong>${esc(orderNumber)}</strong> numaralı siparişiniz
       <strong>${esc(company)}</strong> ile kargoya verildi.<br>
       Takip numarası: <strong>${esc(tracking)}</strong></p>`,
    ),
  );
}

/* ========================================================================== */
/*  GÜVENLİK E-POSTALARI                                                      */
/* ========================================================================== */

/** Yönetici girişinde iki adımlı doğrulama kodu */
export async function sendTwoFactorCode(params: {
  to: string;
  name: string;
  code: string;
  minutes: number;
}) {
  await send(
    params.to,
    `Yönetim paneli doğrulama kodu: ${params.code}`,
    layout(
      "Giriş doğrulama kodu",
      `<p style="font-size:14px;line-height:1.6">Merhaba ${esc(params.name)},<br>
       Yönetim paneline giriş için doğrulama kodun:</p>
       <p style="margin:22px 0;font-size:34px;font-weight:700;letter-spacing:.3em;
          text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${params.code}</p>
       <p style="font-size:13px;color:#6b5d57;line-height:1.6">
         Kod <strong>${params.minutes} dakika</strong> geçerlidir ve yalnızca bir kez kullanılabilir.<br>
         Bu girişi sen yapmadıysan şifreni hemen değiştir — birisi şifreni biliyor olabilir.</p>`,
    ),
  );
}

/** Yeni cihazdan giriş bildirimi */
export async function sendNewLoginNotice(params: {
  to: string;
  name: string;
  device: string;
  ip: string;
  at: Date;
}) {
  await send(
    params.to,
    "Hesabına yeni bir cihazdan giriş yapıldı",
    layout(
      "Yeni giriş bildirimi",
      `<p style="font-size:14px;line-height:1.6">Merhaba ${esc(params.name)},<br>
       Hesabına yeni bir cihazdan giriş yapıldı.</p>
       <p style="font-size:13px;color:#6b5d57;line-height:1.8">
         Cihaz: <strong>${esc(params.device)}</strong><br>
         IP: ${esc(params.ip)}<br>
         Zaman: ${params.at.toLocaleString("tr-TR")}</p>
       <p style="font-size:13px;color:#6b5d57">Bu sen değilsen şifreni değiştir ve
       hesap ayarlarından tüm oturumları kapat.</p>`,
    ),
  );
}

/** Şifre sıfırlama bağlantısı */
export async function sendPasswordReset(params: { to: string; name: string; url: string }) {
  await send(
    params.to,
    "Şifre sıfırlama bağlantın",
    layout(
      "Şifreni sıfırla",
      `<p style="font-size:14px;line-height:1.6">Merhaba ${esc(params.name)},<br>
       Hesabın için şifre sıfırlama isteği aldık. Yeni şifreni belirlemek için aşağıdaki düğmeye tıkla.</p>
       <p style="margin:24px 0;text-align:center">
         <a href="${esc(params.url)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;
            padding:13px 26px;border-radius:6px;font-size:14px;font-weight:600">Yeni şifre belirle</a></p>
       <p style="font-size:13px;color:#6b5d57;line-height:1.6">
         Bağlantı <strong>30 dakika</strong> geçerlidir ve yalnızca bir kez kullanılabilir.<br>
         Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.</p>`,
    ),
  );
}
