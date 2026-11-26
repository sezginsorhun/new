import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/shop/PasswordResetForms";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-[420px]">
        <header className="mb-8 text-center">
          <h1 className="text-[28px]">Şifremi Unuttum</h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-ink-soft)]">
            Üye olurken kullandığın e-posta adresini yaz; şifreni sıfırlaman için bir bağlantı gönderelim.
          </p>
        </header>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-[13px]">
          <Link href="/giris" className="underline">Girişe dön</Link>
        </p>
      </div>
    </div>
  );
}
