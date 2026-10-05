import { adminUrl, ADMIN_PATH } from "@/lib/admin-path";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { LogOut } from "lucide-react";
import { adminSessionState } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import AdminNav from "@/components/admin/AdminNav";

const MOBILE_LINKS = [
  { href: adminUrl(), label: "Panel" },
  { href: adminUrl("siparisler"), label: "Siparişler" },
  { href: adminUrl("urunler"), label: "Ürünler" },
  { href: adminUrl("stok"), label: "Stok" },
  { href: adminUrl("kategoriler"), label: "Kategoriler" },
  { href: adminUrl("kuponlar"), label: "Kuponlar" },
  { href: adminUrl("musteriler"), label: "Müşteriler" },
  { href: adminUrl("yorumlar"), label: "Yorumlar" },
  { href: adminUrl("anasayfa"), label: "Ana Sayfa" },
  { href: adminUrl("bannerlar"), label: "Carousel" },
  { href: adminUrl("medya"), label: "Medya" },
  { href: adminUrl("mesajlar"), label: "Mesajlar" },
  { href: adminUrl("sayfalar"), label: "Sayfalar" },
  { href: adminUrl("ayarlar"), label: "Ayarlar" },
  { href: adminUrl("guvenlik"), label: "Güvenlik" },
];

export const metadata = {
  title: "Yönetim Paneli",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // İkinci savunma hattı: proxy'yi atlatan bir istek buraya gelse bile
  // panel açılmaz. Üç durum ayrı ayrı ele alınır.
  const state = await adminSessionState();

  if (state.state === "anonymous") redirect(`/giris?next=/${ADMIN_PATH}`);
  if (state.state === "not-admin") notFound(); // panelin varlığını sızdırma
  if (state.state === "needs-2fa") redirect("/dogrulama");

  const user = state.user;

  return (
    <div className="flex min-h-screen bg-[color:var(--color-cream)]">
      {/* Kenar çubuğu */}
      <aside className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col border-r border-[color:var(--color-line)] bg-white lg:flex">
        <div className="border-b border-[color:var(--color-line)] px-5 py-4">
          <Link href={adminUrl()} className="block">
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
            <Link href={adminUrl()} className="font-[family-name:var(--font-display)] text-[18px]">
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
