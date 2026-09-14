"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Users,
} from "lucide-react";

const ICONS = {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Tag,
  BarChart3,
  Star,
  ImageIcon,
  Mail,
  FileText,
  Settings,
} as const;

const GROUPS: {
  title: string;
  items: { href: string; label: string; icon: keyof typeof ICONS }[];
}[] = [
  {
    title: "Genel",
    items: [
      { href: "/admin", label: "Panel", icon: "LayoutDashboard" },
      { href: "/admin/siparisler", label: "Siparişler", icon: "ShoppingCart" },
      { href: "/admin/musteriler", label: "Müşteriler", icon: "Users" },
    ],
  },
  {
    title: "Katalog",
    items: [
      { href: "/admin/urunler", label: "Ürünler", icon: "Package" },
      { href: "/admin/kategoriler", label: "Kategoriler", icon: "Tag" },
      { href: "/admin/stok", label: "Stok Durumu", icon: "BarChart3" },
      { href: "/admin/yorumlar", label: "Yorumlar", icon: "Star" },
    ],
  },
  {
    title: "Pazarlama",
    items: [
      { href: "/admin/kuponlar", label: "Kuponlar", icon: "Tag" },
      { href: "/admin/bannerlar", label: "Bannerlar", icon: "ImageIcon" },
      { href: "/admin/mesajlar", label: "Mesajlar", icon: "Mail" },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/sayfalar", label: "Sayfalar", icon: "FileText" },
      { href: "/admin/ayarlar", label: "Ayarlar", icon: "Settings" },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Yönetim menüsü">
      {GROUPS.map((group) => (
        <div key={group.title} className="mb-5">
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
            {group.title}
          </p>
          {group.items.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded px-3 py-2 text-[13px] transition-colors ${
                  active
                    ? "bg-[color:var(--color-ink)] text-white"
                    : "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-cream)]"
                }`}
              >
                <Icon size={15} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
