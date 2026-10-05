import { adminUrl } from "@/lib/admin-path";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/shop/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/giris">) {
  const session = await getSession();
  const query = await props.searchParams;
  const next = typeof query.next === "string" ? query.next : "";

  if (session) redirect(next || (session.role === "ADMIN" ? adminUrl() : "/hesabim"));

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-[420px]">
        <header className="mb-8 text-center">
          <h1 className="text-[28px]">Giriş Yap</h1>
          <p className="mt-2 text-[13.5px] text-[color:var(--color-ink-soft)]">
            Hesabın yok mu?{" "}
            <Link
              href={next ? `/kayit?next=${encodeURIComponent(next)}` : "/kayit"}
              className="text-[color:var(--color-brand)] underline"
            >
              Hemen üye ol
            </Link>
          </p>
        </header>

        <LoginForm next={next} />
      </div>
    </div>
  );
}
