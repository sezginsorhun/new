/**
 * IYZICO 3D SECURE GERİ DÖNÜŞ (CALLBACK)
 *
 * Banka, müşteri SMS kodunu girdikten sonra bu adrese POST eder.
 * Akış:
 *   1. mdStatus kontrolü (1 = doğrulama başarılı)
 *   2. /payment/3dsecure/auth ile ödemeyi kesinleştir
 *   3. Sipariş PAID -> stok düş, sepeti boşalt, mail gönder
 *   4. Tarayıcıyı sonuç sayfasına yönlendir (iframe'den çıkarak)
 *
 * ÖNEMLİ: Bu adres iyzico tarafından çağrılır, kullanıcı oturumu YOKTUR.
 * Bu yüzden siparişi conversationId üzerinden buluyoruz.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { getPaymentProvider } from "@/lib/payment";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";
import { sendAdminOrderNotice, sendOrderConfirmation } from "@/lib/mail";
import { getOrderItems } from "@/lib/orders";

/** iframe içinden üst pencereyi yönlendiren küçük HTML sayfası */
function redirectPage(targetPath: string) {
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>Yönlendiriliyor…</title>
<style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#fbf8f6;color:#2b2321}
.box{text-align:center}.s{width:28px;height:28px;margin:0 auto 14px;border:2px solid #ece2dd;
border-top-color:#a4785f;border-radius:50%;animation:r .8s linear infinite}
@keyframes r{to{transform:rotate(360deg)}}</style></head>
<body><div class="box"><div class="s"></div><p>Ödeme sonucu hazırlanıyor…</p></div>
<script>
(function(){
  var url = ${JSON.stringify(targetPath)};
  try { if (window.top && window.top !== window.self) { window.top.location.replace(url); return; } } catch (e) {}
  window.location.replace(url);
})();
</script></body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let conversationId = "";
  let paymentId = "";
  let conversationData = "";
  let mdStatus = "";
  let status = "";

  try {
    const form = await request.formData();
    conversationId = String(form.get("conversationId") ?? "");
    paymentId = String(form.get("paymentId") ?? "");
    conversationData = String(form.get("conversationData") ?? "");
    mdStatus = String(form.get("mdStatus") ?? "");
    status = String(form.get("status") ?? "");
  } catch {
    return redirectPage("/odeme/sonuc?durum=hata&mesaj=Ge%C3%A7ersiz%20yan%C4%B1t");
  }

  // Ödeme kaydını ve siparişi bul
  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.conversationId, conversationId))
    .limit(1);

  const paymentRecord = paymentRows[0];
  if (!paymentRecord) {
    return redirectPage("/odeme/sonuc?durum=hata&mesaj=Ödeme%20kaydı%20bulunamadı");
  }

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, paymentRecord.orderId))
    .limit(1);
  const order = orderRows[0];
  if (!order) {
    return redirectPage("/odeme/sonuc?durum=hata&mesaj=Sipariş%20bulunamadı");
  }

  const provider = getPaymentProvider();

  /* --- 1. adım: 3D doğrulama sonucu --- */
  if (status !== "success" || mdStatus !== "1") {
    const reason =
      provider.verificationMessages[mdStatus] ?? "3D Secure doğrulaması tamamlanamadı.";
    await db
      .update(payments)
      .set({ status: "FAILED", errorCode: mdStatus, errorMessage: reason })
      .where(eq(payments.id, paymentRecord.id));
    await markOrderFailed(order.id, reason);
    return redirectPage(
      `/odeme/sonuc?durum=basarisiz&siparis=${order.orderNumber}&mesaj=${encodeURIComponent(reason)}`,
    );
  }

  /* --- 2. adım: ödemeyi kesinleştir --- */
  const result = await provider.complete3DSecure(conversationId, paymentId, conversationData);

  if (!result.ok) {
    await db
      .update(payments)
      .set({
        status: "FAILED",
        errorCode: result.errorCode ?? null,
        errorMessage: result.error,
        rawResponse: (result.raw ?? null) as object | null,
      })
      .where(eq(payments.id, paymentRecord.id));
    await markOrderFailed(order.id, result.error);
    return redirectPage(
      `/odeme/sonuc?durum=basarisiz&siparis=${order.orderNumber}&mesaj=${encodeURIComponent(result.error)}`,
    );
  }

  /* --- 3. adım: siparişi tamamla --- */
  await db
    .update(payments)
    .set({
      status: "SUCCESS",
      provider: provider.id,
      providerPaymentId: result.paymentId,
      providerTransactionId: result.transactionId ?? null,
      installment: result.installment,
      cardFamily: result.cardFamily ?? null,
      cardAssociation: result.cardAssociation ?? null,
      lastFourDigits: result.lastFourDigits ?? null,
      binNumber: result.binNumber ?? null,
      rawResponse: result.raw as object,
    })
    .where(eq(payments.id, paymentRecord.id));

  try {
    await markOrderPaid(order.id);
  } catch (error) {
    console.error("[odeme] sipariş işlenemedi:", error);
  }

  // Sepeti boşalt — callback'te kullanıcı çerezi olmadığı için
  // siparişin sepetini doğrudan kullanıcı üzerinden temizliyoruz.
  try {
    const { carts, cartItems } = await import("@/db/schema");
    if (order.userId) {
      const cartRows = await db
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.userId, order.userId))
        .limit(1);
      if (cartRows[0]) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cartRows[0].id));
      }
    }
  } catch (error) {
    console.error("[odeme] sepet temizlenemedi:", error);
  }

  // Bildirim mailleri
  try {
    const items = await getOrderItems(order.id);
    const shipping = order.shippingAddress as { firstName?: string };
    const mailData = {
      orderNumber: order.orderNumber,
      email: order.email,
      customerName: shipping.firstName ?? "Değerli müşterimiz",
      grandTotal: order.grandTotal,
      items: items.map((item) => ({
        productName: item.productName,
        variantInfo: item.variantInfo,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    };
    await sendOrderConfirmation(mailData);
    await sendAdminOrderNotice(mailData);
  } catch (error) {
    console.error("[odeme] mail gönderilemedi:", error);
  }

  return redirectPage(`/odeme/sonuc?durum=basarili&siparis=${order.orderNumber}`);
}

/** Bazı bankalar GET ile döner. */
export async function GET() {
  return redirectPage("/odeme/sonuc?durum=hata&mesaj=Ge%C3%A7ersiz%20istek");
}
