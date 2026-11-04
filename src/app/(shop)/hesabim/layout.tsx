import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, LogOut, MapPin, Package, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

const MENU = [
  { href: "/hesabim", label: "Hesap Bilgilerim", icon: User },
  { href: "/hesabim/siparisler", label: "Siparişlerim", icon: Package },
  { href: "/hesabim/adresler", label: "Adreslerim", icon: MapPin },
  { href: "/hesabim/favoriler", label: "Favorilerim", icon: Heart },
];

export default async function AccountLayout({ children }: LayoutProps<"/hesabim">) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/hesabim");

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-[28px]">Merhaba {user.firstName}</h1>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <aside>
          <nav className="card overflow-hidden">
            {MENU.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 border-b border-[color:var(--color-line)] px-4 py-3.5 text-[13.5px] transition-colors last:border-0 hover:bg-[color:var(--color-cream)]"
              >
                <Icon size={16} strokeWidth={1.5} className="text-[color:var(--color-brand)]" />
                {label}
              </Link>
            ))}
          </nav>

          <form action={logoutAction} className="mt-4">
            <button type="submit" className="btn-outline btn-sm w-full">
              <LogOut size={14} strokeWidth={1.5} />
              Çıkış Yap
            </button>
          </form>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
