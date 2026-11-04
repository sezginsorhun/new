import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import RegisterForm from "@/components/shop/RegisterForm";

export const metadata: Metadata = {
  title: "Üye Ol",
  robots: { index: false, follow: false },
};

export default async function RegisterPage(props: PageProps<"/kayit">) {
  const session = await getSession();
  const query = await props.searchParams;
  const next = typeof query.next === "string" ? query.next : "";

  if (session) redirect(next || "/hesabim");

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-[480px]">
        <header className="mb-8 text-center">
          <h1 className="text-[28px]">Üye Ol</h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-ink-soft)]">
            Zaten hesabın var mı?{" "}
            <Link
              href={next ? `/giris?next=${encodeURIComponent(next)}` : "/giris"}
              className="text-[color:var(--color-brand)] underline"
            >
              Giriş yap
            </Link>
          </p>
        </header>

        <RegisterForm next={next} />
      </div>
    </div>
  );
}
