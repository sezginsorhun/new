import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import AdminNav from "@/components/admin/AdminNav";

const MOBILE_LINKS = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/siparisler", label: "Siparişler" },
  { href: "/admin/urunler", label: "Ürünler" },
  { href: "/admin/stok", label: "Stok" },
  { href: "/admin/kategoriler", label: "Kategoriler" },
  { href: "/admin/kuponlar", label: "Kuponlar" },
  { href: "/admin/musteriler", label: "Müşteriler" },
  { href: "/admin/yorumlar", label: "Yorumlar" },
  { href: "/admin/bannerlar", label: "Bannerlar" },
  { href: "/admin/mesajlar", label: "Mesajlar" },
  { href: "/admin/sayfalar", label: "Sayfalar" },
  { href: "/admin/ayarlar", label: "Ayarlar" },
];

export const metadata = {
  title: "Yönetim Paneli",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/admin");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-[color:var(--color-cream)]">
      {/* Kenar çubuğu */}
      <aside className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col border-r border-[color:var(--color-line)] bg-white lg:flex">
        <div className="border-b border-[color:var(--color-line)] px-5 py-4">
          <Link href="/admin" className="block">
            <p className="font-[family-name:var(--font-display)] text-[20px] leading-none">
              Alenora
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Yönetim
            </p>
          </Link>
        </div>

        <AdminNav />

        <div className="border-t border-[color:var(--color-line)] p-3">
          <p className="mb-2 px-2 text-[11px] text-[color:var(--color-muted)]">
            {user.firstName} {user.lastName}
          </p>
          <Link href="/" className="btn-ghost w-full justify-start">
            Siteyi görüntüle →
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost w-full justify-start">
              <LogOut size={14} strokeWidth={1.5} />
              Çıkış
            </button>
          </form>
        </div>
      </aside>

      {/* İçerik */}
      <div className="min-w-0 flex-1">
        {/* Mobil üst bar */}
        <div className="sticky top-0 z-30 border-b border-[color:var(--color-line)] bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="font-[family-name:var(--font-display)] text-[18px]">
              Alenora Yönetim
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost">Çıkış</button>
            </form>
          </div>
          <div className="no-scrollbar mt-2 flex gap-1 overflow-x-auto">
            {MOBILE_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded border border-[color:var(--color-line)] px-2.5 py-1.5 text-[11.5px]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
