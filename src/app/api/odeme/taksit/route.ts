/**
 * TAKSİT SORGULAMA
 * Ödeme formunda kart numarasının ilk 6 hanesi girilince çağrılır.
 * Kartın bankasına göre geçerli taksit seçeneklerini döner.
 */

import { getPaymentProvider } from "@/lib/payment";
import { getCartTotals } from "@/lib/cart";
import { getNumericSetting } from "@/lib/settings";
import { toProviderPrice } from "@/lib/money";
import { createId } from "@/lib/id";

export async function POST(request: Request) {
  let binNumber = "";
  let couponCode: string | null = null;
  try {
    const body = (await request.json()) as { binNumber?: string; couponCode?: string | null };
    binNumber = String(body.binNumber ?? "").replace(/\D/g, "").slice(0, 8);
    couponCode = body.couponCode ?? null;
  } catch {
    return Response.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  if (binNumber.length < 6) {
    return Response.json({ ok: false, error: "En az 6 hane gerekli." }, { status: 400 });
  }

  // Tutar sunucudan alınır — tarayıcıdan gelen tutara güvenilmez
  const totals = await getCartTotals(couponCode);
  if (totals.grandTotal <= 0) {
    return Response.json({ ok: false, error: "Sepet boş." }, { status: 400 });
  }

  const provider = getPaymentProvider();

  // Sağlayıcı yok, anahtar yok ya da taksit desteklemiyorsa: tek çekim göster.
  if (!provider.isConfigured() || !provider.supportsInstallments) {
    return Response.json({
      ok: true,
      configured: false,
      options: [{ installmentNumber: 1, installmentPrice: toProviderPrice(totals.grandTotal), totalPrice: toProviderPrice(totals.grandTotal) }],
    });
  }

  const maxInstallment = await getNumericSetting("max_installment");
  const result = await provider.retrieveInstallments(
    binNumber,
    toProviderPrice(totals.grandTotal),
    createId(16),
  );

  if (!result.ok || !result.detail) {
    return Response.json({ ok: false, error: result.error ?? "Sorgulanamadı." });
  }

  const options = result.detail.installmentPrices
    .filter((option) => option.installmentNumber <= (maxInstallment || 12))
    .sort((a, b) => a.installmentNumber - b.installmentNumber);

  return Response.json({
    ok: true,
    configured: true,
    bankName: result.detail.bankName ?? null,
    cardFamily: result.detail.cardFamilyName ?? null,
    cardAssociation: result.detail.cardAssociation ?? null,
    force3ds: result.detail.force3ds ?? 1,
    options,
  });
}
