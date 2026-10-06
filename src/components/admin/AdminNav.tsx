"use client";

import { adminUrl } from "@/lib/admin-path";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  UserCog,
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
  Images,
  LayoutTemplate,
  ShieldCheck,
  Mail,
  FileText,
  Settings,
  UserCog,
} as const;

const GROUPS: {
  title: string;
  items: { href: string; label: string; icon: keyof typeof ICONS }[];
}[] = [
  {
    title: "Genel",
    items: [
      { href: adminUrl(), label: "Panel", icon: "LayoutDashboard" },
      { href: adminUrl("siparisler"), label: "Siparişler", icon: "ShoppingCart" },
      { href: adminUrl("musteriler"), label: "Müşteriler", icon: "Users" },
      { href: adminUrl("kullanicilar"), label: "Kullanıcılar", icon: "UserCog" },
    ],
  },
  {
    title: "Katalog",
    items: [
      { href: adminUrl("urunler"), label: "Ürünler", icon: "Package" },
      { href: adminUrl("kategoriler"), label: "Kategoriler", icon: "Tag" },
      { href: adminUrl("stok"), label: "Stok Durumu", icon: "BarChart3" },
      { href: adminUrl("yorumlar"), label: "Yorumlar", icon: "Star" },
    ],
  },
  {
    title: "Görünüm",
    items: [
      { href: adminUrl("anasayfa"), label: "Ana Sayfa Düzeni", icon: "LayoutTemplate" },
      { href: adminUrl("bannerlar"), label: "Carousel", icon: "ImageIcon" },
      { href: adminUrl("medya"), label: "Medya", icon: "Images" },
      { href: adminUrl("sayfalar"), label: "Sayfalar", icon: "FileText" },
    ],
  },
  {
    title: "Pazarlama",
    items: [
      { href: adminUrl("kuponlar"), label: "Kuponlar", icon: "Tag" },
      { href: adminUrl("mesajlar"), label: "Mesajlar", icon: "Mail" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: adminUrl("hesabim"), label: "Hesabım", icon: "UserCog" },
      { href: adminUrl("ayarlar"), label: "Ayarlar", icon: "Settings" },
      { href: adminUrl("guvenlik"), label: "Güvenlik", icon: "ShieldCheck" },
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
            // pathname gizli yolu gösterir (/yonetim-xxxx/...), item.href de öyle.
            const root = adminUrl();
            const active =
              item.href === root
                ? pathname === root || pathname === `${root}/`
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
