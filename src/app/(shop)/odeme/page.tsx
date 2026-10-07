import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { getCartTotals } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { isCardPaymentAvailable } from "@/lib/payment";
import CheckoutForm from "@/components/shop/CheckoutForm";

export const metadata: Metadata = {
  title: "Ödeme",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage(props: PageProps<"/odeme">) {
  const query = await props.searchParams;
  const couponCode = typeof query.kupon === "string" ? query.kupon : null;

  const [cart, user, settings] = await Promise.all([
    getCartTotals(couponCode),
    getCurrentUser(),
    getSettings(),
  ]);

  if (cart.lines.length === 0) redirect("/sepet");

  const savedAddresses = user
    ? await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, user.id))
        .orderBy(desc(addresses.isDefault), desc(addresses.createdAt))
    : [];

  return (
    <div className="container-page py-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px]">Ödeme</h1>
        <Link href="/sepet" className="text-[12.5px] text-[color:var(--color-brand)] underline">
          Sepete dön
        </Link>
      </div>

      <CheckoutForm
        cart={cart}
        couponCode={couponCode}
        savedAddresses={savedAddresses}
        defaultEmail={user?.email ?? ""}
        defaultPhone={user?.phone ?? ""}
        cardEnabled={settings.payment_credit_card === "1" && isCardPaymentAvailable()}
        cardConfigured={isCardPaymentAvailable()}
        transferEnabled={settings.payment_bank_transfer === "1"}
        codEnabled={settings.payment_cod === "1"}
        codFee={Number(settings.cod_fee) || 0}
        bankAccounts={settings.bank_accounts}
        maxInstallment={Number(settings.max_installment) || 1}
      />
    </div>
  );
}
