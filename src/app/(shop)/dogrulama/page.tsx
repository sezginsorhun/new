import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { readPendingUserId } from "@/lib/auth";
import TwoFactorForm from "@/components/shop/TwoFactorForm";

export const metadata: Metadata = {
  title: "Güvenlik doğrulaması",
  robots: { index: false, follow: false },
};

/**
 * İKİNCİ ADIM
 * Şifre doğru girildikten sonra buraya gelinir. Burada henüz oturum YOKTUR;
 * sadece 10 dakikalık geçici bir bilet vardır.
 */
export default async function TwoFactorPage() {
  const pendingUserId = await readPendingUserId();
  if (!pendingUserId) redirect("/giris");

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-[420px]">
        <header className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-2)]">
            <ShieldCheck size={22} strokeWidth={1.5} />
          </span>
          <h1 className="text-[26px]">Güvenlik doğrulaması</h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-ink-soft)]">
            E-posta adresine 6 haneli bir kod gönderdik. Kod 10 dakika geçerli.
          </p>
        </header>

        <TwoFactorForm />
      </div>
    </div>
  );
}
