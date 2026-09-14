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

function layout(title: string, body: string) {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Alenora";
  return `<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#faf7f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2b2321">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:32px;border:1px solid #efe6e1">
      <p style="margin:0 0 24px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#a4785f">${siteName}</p>
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
        `<tr><td style="padding:8px 0;font-size:14px">${i.productName}<br><span style="color:#8a7c75;font-size:12px">${i.variantInfo} · ${i.quantity} adet</span></td>
         <td style="padding:8px 0;text-align:right;font-size:14px;white-space:nowrap">${formatPrice(i.lineTotal)}</td></tr>`,
    )
    .join("");

  await send(
    order.email,
    `Siparişiniz alındı — ${order.orderNumber}`,
    layout(
      `Teşekkürler ${order.customerName}!`,
      `<p style="margin:0 0 20px;font-size:14px;line-height:1.6">
         <strong>${order.orderNumber}</strong> numaralı siparişiniz başarıyla alındı ve hazırlanmaya başlıyor.
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
      `<p style="font-size:14px">Sipariş: <strong>${order.orderNumber}</strong><br>
       Müşteri: ${order.customerName} (${order.email})<br>
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
      `<p style="font-size:14px;line-height:1.6"><strong>${orderNumber}</strong> numaralı siparişiniz
       <strong>${company}</strong> ile kargoya verildi.<br>
       Takip numarası: <strong>${tracking}</strong></p>`,
    ),
  );
}
