import Link from "next/link";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/shop/PasswordResetForms";

export const metadata: Metadata = {
  title: "Yeni Şifre Belirle",
  robots: { index: false, follow: false },
  // Jetonlu adres başka sitelere "referer" olarak sızmasın.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage(props: PageProps<"/sifre-sifirla">) {
  const query = await props.searchParams;
  const token = typeof query.t === "string" ? query.t : "";

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-[420px]">
        <header className="mb-8 text-center">
          <h1 className="text-[28px]">Yeni Şifre Belirle</h1>
        </header>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="card p-6 text-center text-[14px]">
            Bağlantı eksik. <Link href="/sifremi-unuttum" className="underline">Yeni bağlantı iste</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
