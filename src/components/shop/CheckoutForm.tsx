"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Banknote, CreditCard, Lock, Truck } from "lucide-react";
import type { Address } from "@/db/schema";
import type { CartTotals } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import { TR_CITIES } from "@/lib/utils";
import { submitCheckout } from "@/actions/checkout";

type InstallmentOption = {
  installmentNumber: number;
  installmentPrice: string;
  totalPrice: string;
};

export default function CheckoutForm({
  cart,
  couponCode,
  savedAddresses,
  defaultEmail,
  defaultPhone,
  cardEnabled,
  cardConfigured,
  transferEnabled,
  codEnabled,
  codFee,
  bankAccounts,
  maxInstallment,
}: {
  cart: CartTotals;
  couponCode: string | null;
  savedAddresses: Address[];
  defaultEmail: string;
  defaultPhone: string;
  cardEnabled: boolean;
  cardConfigured: boolean;
  transferEnabled: boolean;
  codEnabled: boolean;
  codFee: number;
  bankAccounts: string;
  maxInstallment: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const firstMethod = cardEnabled
    ? "CREDIT_CARD"
    : transferEnabled
      ? "BANK_TRANSFER"
      : "CASH_ON_DELIVERY";

  const [method, setMethod] = useState(firstMethod);
  const [sameBilling, setSameBilling] = useState(true);
  const [billCorporate, setBillCorporate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threeDSHtml, setThreeDSHtml] = useState<string | null>(null);

  // Kayıtlı adres seçimi
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses.find((a) => a.isDefault)?.id ?? savedAddresses[0]?.id ?? "new",
  );
  const chosen = savedAddresses.find((a) => a.id === selectedAddressId) ?? null;

  // Taksit
  const [cardNumber, setCardNumber] = useState("");
  const [installments, setInstallments] = useState<InstallmentOption[]>([]);
  const [installment, setInstallment] = useState(1);
  const [cardInfo, setCardInfo] = useState<{ bank?: string; family?: string } | null>(null);

  const total = method === "CASH_ON_DELIVERY" ? cart.grandTotal + codFee : cart.grandTotal;

  // Kart numarasının ilk 6 hanesi girilince taksit sorgula
  useEffect(() => {
    const bin = cardNumber.replace(/\D/g, "").slice(0, 6);
    let cancelled = false;

    // Kart numarası eksikse ya da kredi kartı seçili değilse taksit
    // listesi temizlenir. setState doğrudan effect gövdesinde değil,
    // zamanlayıcı içinde çağrılır (gereksiz zincirleme render olmasın).
    if (method !== "CREDIT_CARD" || bin.length < 6 || !cardConfigured) {
      const reset = setTimeout(() => {
        if (cancelled) return;
        setInstallments([]);
        setCardInfo(null);
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(reset);
      };
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/odeme/taksit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ binNumber: bin, couponCode }),
        });
        const data = await response.json();
        if (cancelled) return;
        if (data.ok && Array.isArray(data.options)) {
          setInstallments(data.options);
          setCardInfo({ bank: data.bankName, family: data.cardFamily });
          setInstallment(1);
        } else {
          setInstallments([]);
        }
      } catch {
        if (!cancelled) setInstallments([]);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cardNumber, method, cardConfigured, couponCode]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitCheckout(formData);
      if (!result.ok) {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (result.kind === "3ds") {
        setThreeDSHtml(result.html);
      } else {
        router.push(`/odeme/sonuc?durum=basarili&siparis=${result.orderNumber}`);
      }
    });
  }

  /* --- Banka 3D Secure ekranı --- */
  if (threeDSHtml) {
    return (
      <div className="mx-auto max-w-[620px]">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-[color:var(--color-line)] bg-[color:var(--color-cream)] px-4 py-3">
            <Lock size={15} strokeWidth={1.5} className="text-[color:var(--color-success)]" />
            <p className="text-[13px]">
              Bankanızın <strong>3D Secure</strong> doğrulama ekranı — telefonunuza gelen kodu girin.
            </p>
          </div>
          <iframe
            title="3D Secure doğrulama"
            srcDoc={threeDSHtml}
            className="h-[620px] w-full border-0"
            sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
          />
        </div>
        <p className="mt-4 text-center text-[12px] text-[color:var(--color-muted)]">
          Bu pencereyi kapatmayın. Doğrulama tamamlanınca otomatik yönlendirileceksiniz.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:gap-12">
      <input type="hidden" name="couponCode" value={couponCode ?? ""} />
      <input type="hidden" name="paymentMethod" value={method} />
      <input type="hidden" name="sameBilling" value={sameBilling ? "on" : ""} />

      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="border border-[color:var(--color-sale)] bg-red-50 px-4 py-3 text-[13px] text-[color:var(--color-sale)]"
          >
            {error}
          </div>
        )}

        {/* ---------------------- 1. İLETİŞİM ---------------------- */}
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2.5 text-[16px]">
            <Step n={1} /> İletişim Bilgileri
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="co-email">E-posta *</label>
              <input
                id="co-email"
                name="email"
                type="email"
                required
                defaultValue={defaultEmail}
                className="field"
              />
              <p className="help">Sipariş bilgileri buraya gönderilir.</p>
            </div>
            <div>
              <label className="label" htmlFor="co-phone">Telefon *</label>
              <input
                id="co-phone"
                name="phone"
                type="tel"
                required
                defaultValue={defaultPhone}
                placeholder="05XXXXXXXXX"
                className="field"
              />
            </div>
          </div>
          {!defaultEmail && (
            <p className="mt-3 text-[12.5px] text-[color:var(--color-ink-soft)]">
              Hesabın var mı?{" "}
              <Link href="/giris?next=/odeme" className="text-[color:var(--color-brand)] underline">
                Giriş yap
              </Link>{" "}
              — kayıtlı adreslerin otomatik gelir.
            </p>
          )}
        </section>

        {/* ---------------------- 2. TESLİMAT ---------------------- */}
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2.5 text-[16px]">
            <Step n={2} /> Teslimat Adresi
          </h2>

          {savedAddresses.length > 0 && (
            <div className="mb-5 space-y-2">
              {savedAddresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer items-start gap-3 border p-3.5 transition-colors ${
                    selectedAddressId === address.id
                      ? "border-[color:var(--color-ink)] bg-[color:var(--color-cream)]"
                      : "border-[color:var(--color-line)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1 accent-[color:var(--color-brand)]"
                  />
                  <span className="text-[13px]">
                    <strong>{address.title}</strong> — {address.firstName} {address.lastName}
                    <br />
                    <span className="text-[color:var(--color-ink-soft)]">
                      {address.line1}, {address.district} / {address.city}
                    </span>
                  </span>
                </label>
              ))}
              <label
                className={`flex cursor-pointer items-center gap-3 border p-3.5 text-[13px] transition-colors ${
                  selectedAddressId === "new"
                    ? "border-[color:var(--color-ink)] bg-[color:var(--color-cream)]"
                    : "border-[color:var(--color-line)]"
                }`}
              >
                <input
                  type="radio"
                  name="savedAddress"
                  value="new"
                  checked={selectedAddressId === "new"}
                  onChange={() => setSelectedAddressId("new")}
                  className="accent-[color:var(--color-brand)]"
                />
                Yeni adres gir
              </label>
            </div>
          )}

          <AddressFields prefix="ship" source={selectedAddressId === "new" ? null : chosen} />
        </section>

        {/* ---------------------- 3. FATURA ------------------------ */}
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2.5 text-[16px]">
            <Step n={3} /> Fatura Adresi
          </h2>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
            <input
              type="checkbox"
              checked={sameBilling}
              onChange={(event) => setSameBilling(event.target.checked)}
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Fatura adresim teslimat adresimle aynı
          </label>

          {!sameBilling && (
            <div className="mt-5 space-y-4">
              <AddressFields prefix="bill" source={null} />

              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  name="bill_isCorporate"
                  checked={billCorporate}
                  onChange={(event) => setBillCorporate(event.target.checked)}
                  className="h-4 w-4 accent-[color:var(--color-brand)]"
                />
                Kurumsal fatura istiyorum
              </label>

              {billCorporate && (
                <div className="space-y-4 border-l-2 border-[color:var(--color-brand)] pl-4">
                  <div>
                    <label className="label" htmlFor="bill-company">Firma adı *</label>
                    <input id="bill-company" name="bill_companyName" className="field" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="bill-taxoffice">Vergi dairesi *</label>
                      <input id="bill-taxoffice" name="bill_taxOffice" className="field" />
                    </div>
                    <div>
                      <label className="label" htmlFor="bill-taxno">Vergi no *</label>
                      <input id="bill-taxno" name="bill_taxNumber" className="field" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ---------------------- 4. ÖDEME ------------------------- */}
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2.5 text-[16px]">
            <Step n={4} /> Ödeme Yöntemi
          </h2>

          <div className="space-y-2.5">
            {cardEnabled && (
              <MethodOption
                active={method === "CREDIT_CARD"}
                onSelect={() => setMethod("CREDIT_CARD")}
                icon={<CreditCard size={17} strokeWidth={1.5} />}
                title="Kredi / Banka Kartı"
                subtitle="3D Secure ile güvenli ödeme, taksit imkânı"
              />
            )}
            {transferEnabled && (
              <MethodOption
                active={method === "BANK_TRANSFER"}
                onSelect={() => setMethod("BANK_TRANSFER")}
                icon={<Banknote size={17} strokeWidth={1.5} />}
                title="Havale / EFT"
                subtitle="Ödemeni yaptıktan sonra siparişin hazırlanır"
              />
            )}
            {codEnabled && (
              <MethodOption
                active={method === "CASH_ON_DELIVERY"}
                onSelect={() => setMethod("CASH_ON_DELIVERY")}
                icon={<Truck size={17} strokeWidth={1.5} />}
                title="Kapıda Ödeme"
                subtitle={`Kuryeye nakit veya kartla ödeme — ${formatPrice(codFee)} hizmet bedeli`}
              />
            )}
          </div>

          {/* Kart formu */}
          {method === "CREDIT_CARD" && (
            <div className="mt-6 space-y-4 border-t border-[color:var(--color-line)] pt-5">
              <div>
                <label className="label" htmlFor="cc-name">Kart üzerindeki isim *</label>
                <input
                  id="cc-name"
                  name="cardHolderName"
                  required
                  autoComplete="cc-name"
                  className="field"
                />
              </div>

              <div>
                <label className="label" htmlFor="cc-number">Kart numarası *</label>
                <input
                  id="cc-number"
                  name="cardNumber"
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
                    setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
                  }}
                  className="field tracking-[0.08em]"
                />
                {cardInfo?.bank && (
                  <p className="help">
                    {cardInfo.bank}
                    {cardInfo.family ? ` — ${cardInfo.family}` : ""}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label" htmlFor="cc-month">Ay *</label>
                  <select id="cc-month" name="expireMonth" required className="field">
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(
                      (month) => (
                        <option key={month} value={month}>{month}</option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="cc-year">Yıl *</label>
                  <select id="cc-year" name="expireYear" required className="field">
                    {Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i)).map(
                      (year) => (
                        <option key={year} value={year}>{year}</option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="cc-cvc">CVC *</label>
                  <input
                    id="cc-cvc"
                    name="cvc"
                    required
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="cc-csc"
                    placeholder="000"
                    className="field"
                  />
                </div>
              </div>

              {/* Taksit seçenekleri */}
              {installments.length > 1 && (
                <div>
                  <span className="label">Taksit seçenekleri</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {installments.map((option) => (
                      <label
                        key={option.installmentNumber}
                        className={`flex cursor-pointer items-center justify-between gap-2 border px-3.5 py-2.5 text-[13px] transition-colors ${
                          installment === option.installmentNumber
                            ? "border-[color:var(--color-ink)] bg-[color:var(--color-cream)]"
                            : "border-[color:var(--color-line)]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="installment"
                            value={option.installmentNumber}
                            checked={installment === option.installmentNumber}
                            onChange={() => setInstallment(option.installmentNumber)}
                            className="accent-[color:var(--color-brand)]"
                          />
                          {option.installmentNumber === 1
                            ? "Tek çekim"
                            : `${option.installmentNumber} taksit`}
                        </span>
                        <span className="text-right text-[12px] text-[color:var(--color-ink-soft)]">
                          {option.installmentNumber > 1 && (
                            <>
                              {option.installmentPrice} TL x {option.installmentNumber}
                              <br />
                            </>
                          )}
                          <strong>{option.totalPrice} TL</strong>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {installments.length <= 1 && (
                <input type="hidden" name="installment" value={1} />
              )}

              <div>
                <label className="label" htmlFor="cc-tckn">TC Kimlik No</label>
                <input
                  id="cc-tckn"
                  name="identityNumber"
                  inputMode="numeric"
                  maxLength={11}
                  className="field sm:max-w-[220px]"
                />
                <p className="help">
                  Bankalar bazı işlemlerde talep eder. Boş bırakabilirsin.
                </p>
              </div>

              <p className="flex items-start gap-2 text-[12px] text-[color:var(--color-muted)]">
                <Lock size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                Kart bilgileriniz sitemizde saklanmaz; doğrudan lisanslı ödeme kuruluşu
                iyzico&apos;ya iletilir ve 3D Secure ile doğrulanır.
              </p>
            </div>
          )}

          {/* Havale bilgileri */}
          {method === "BANK_TRANSFER" && (
            <div className="mt-5 border border-[color:var(--color-line)] bg-[color:var(--color-cream)] p-4 text-[13px]">
              <p className="font-medium">Havale/EFT bilgileri</p>
              <p className="mt-2 whitespace-pre-line text-[color:var(--color-ink-soft)]">
                {bankAccounts}
              </p>
              <p className="mt-3 text-[12.5px] text-[color:var(--color-ink-soft)]">
                Açıklama kısmına <strong>sipariş numaranı</strong> yazmayı unutma. Ödemen
                onaylandığında siparişin hazırlanmaya başlar.
              </p>
            </div>
          )}

          {method === "CASH_ON_DELIVERY" && (
            <div className="mt-5 border border-[color:var(--color-line)] bg-[color:var(--color-cream)] p-4 text-[13px] text-[color:var(--color-ink-soft)]">
              Kapıda ödemede {formatPrice(codFee)} hizmet bedeli eklenir. Kuryeye nakit veya
              kredi kartı ile ödeme yapabilirsin.
            </div>
          )}
        </section>

        {/* ---------------------- 5. NOT & ONAY -------------------- */}
        <section className="card p-5">
          <div>
            <label className="label" htmlFor="co-note">Sipariş notu (opsiyonel)</label>
            <textarea
              id="co-note"
              name="customerNote"
              rows={3}
              maxLength={500}
              placeholder="Kapıcıya bırakılabilir, hediye paketi olsun..."
              className="field"
            />
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[12.5px] text-[color:var(--color-ink-soft)]">
            <input
              type="checkbox"
              name="acceptsTerms"
              required
              className="mt-0.5 h-4 w-4 accent-[color:var(--color-brand)]"
            />
            <span>
              <Link href="/sayfa/mesafeli-satis-sozlesmesi" target="_blank" className="underline">
                Mesafeli satış sözleşmesini
              </Link>{" "}
              ve ön bilgilendirme formunu okudum, onaylıyorum. *
            </span>
          </label>
        </section>
      </div>

      {/* ------------------------- ÖZET -------------------------- */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-5">
          <h2 className="text-[16px]">Siparişin</h2>

          <ul className="mt-4 space-y-3 border-b border-[color:var(--color-line)] pb-4">
            {cart.lines.map((line) => (
              <li key={line.itemId} className="flex gap-3">
                <div className="relative h-[62px] w-[46px] shrink-0 overflow-hidden bg-[#f3ece8]">
                  {line.imageUrl && (
                    <Image src={line.imageUrl} alt="" fill sizes="46px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium">{line.productName}</p>
                  <p className="text-[11.5px] text-[color:var(--color-muted)]">
                    {line.colorName} / {line.size} · {line.quantity} adet
                  </p>
                </div>
                <p className="shrink-0 text-[12.5px] font-semibold">
                  {formatPrice(line.lineTotal)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-[color:var(--color-ink-soft)]">Ara toplam</dt>
              <dd>{formatPrice(cart.subtotal)}</dd>
            </div>
            {cart.discountTotal > 0 && (
              <div className="flex justify-between text-[color:var(--color-success)]">
                <dt>İndirim {cart.couponCode ? `(${cart.couponCode})` : ""}</dt>
                <dd>-{formatPrice(cart.discountTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[color:var(--color-ink-soft)]">Kargo</dt>
              <dd>
                {cart.shippingTotal === 0 ? (
                  <span className="text-[color:var(--color-success)]">Ücretsiz</span>
                ) : (
                  formatPrice(cart.shippingTotal)
                )}
              </dd>
            </div>
            {method === "CASH_ON_DELIVERY" && codFee > 0 && (
              <div className="flex justify-between">
                <dt className="text-[color:var(--color-ink-soft)]">Kapıda ödeme bedeli</dt>
                <dd>{formatPrice(codFee)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-[color:var(--color-line)] pt-3 text-[16px] font-semibold">
              <dt>Toplam</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          <button type="submit" disabled={pending} className="btn-primary mt-5 w-full">
            <Lock size={14} strokeWidth={1.5} />
            {pending ? "İşleniyor..." : "Siparişi Tamamla"}
          </button>

          {!cardConfigured && (
            <p className="mt-3 text-[11.5px] text-[color:var(--color-muted)]">
              Not: iyzico anahtarları .env dosyasında tanımlanmadığı için kartla ödeme
              kapalı. Havale/EFT ve kapıda ödeme çalışıyor.
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}

/* ----------------------------- YARDIMCILAR ------------------------------ */

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-ink)] text-[11px] font-semibold text-white">
      {n}
    </span>
  );
}

function MethodOption({
  active,
  onSelect,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex w-full items-start gap-3 border p-3.5 text-left transition-colors ${
        active
          ? "border-[color:var(--color-ink)] bg-[color:var(--color-cream)]"
          : "border-[color:var(--color-line)] hover:border-[color:var(--color-line-strong)]"
      }`}
    >
      <span className="mt-0.5 text-[color:var(--color-brand)]">{icon}</span>
      <span>
        <span className="block text-[13.5px] font-medium">{title}</span>
        <span className="block text-[12px] text-[color:var(--color-muted)]">{subtitle}</span>
      </span>
    </button>
  );
}

function AddressFields({
  prefix,
  source,
}: {
  prefix: "ship" | "bill";
  source: Address | null;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${prefix}-first`}>Ad *</label>
          <input
            id={`${prefix}-first`}
            name={`${prefix}_firstName`}
            required
            key={`${prefix}-first-${source?.id ?? "new"}`}
            defaultValue={source?.firstName ?? ""}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor={`${prefix}-last`}>Soyad *</label>
          <input
            id={`${prefix}-last`}
            name={`${prefix}_lastName`}
            required
            key={`${prefix}-last-${source?.id ?? "new"}`}
            defaultValue={source?.lastName ?? ""}
            className="field"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${prefix}-phone`}>Telefon *</label>
          <input
            id={`${prefix}-phone`}
            name={`${prefix}_phone`}
            type="tel"
            required
            placeholder="05XXXXXXXXX"
            key={`${prefix}-phone-${source?.id ?? "new"}`}
            defaultValue={source?.phone ?? ""}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor={`${prefix}-zip`}>Posta kodu</label>
          <input
            id={`${prefix}-zip`}
            name={`${prefix}_zipCode`}
            key={`${prefix}-zip-${source?.id ?? "new"}`}
            defaultValue={source?.zipCode ?? ""}
            className="field"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${prefix}-city`}>İl *</label>
          <select
            id={`${prefix}-city`}
            name={`${prefix}_city`}
            required
            key={`${prefix}-city-${source?.id ?? "new"}`}
            defaultValue={source?.city ?? ""}
            className="field"
          >
            <option value="">Seç...</option>
            {TR_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`${prefix}-district`}>İlçe *</label>
          <input
            id={`${prefix}-district`}
            name={`${prefix}_district`}
            required
            key={`${prefix}-district-${source?.id ?? "new"}`}
            defaultValue={source?.district ?? ""}
            className="field"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`${prefix}-line1`}>Açık adres *</label>
        <textarea
          id={`${prefix}-line1`}
          name={`${prefix}_line1`}
          rows={3}
          required
          placeholder="Mahalle, sokak, bina no, daire no"
          key={`${prefix}-line1-${source?.id ?? "new"}`}
          defaultValue={source?.line1 ?? ""}
          className="field"
        />
      </div>
    </div>
  );
}
