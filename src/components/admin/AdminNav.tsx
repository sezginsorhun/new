"use client";

import { adminUrl } from "@/lib/admin-path";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { can, type Permission } from "@/lib/permissions";
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
  Palette,
  ListTree,
  Search,
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
  Palette,
  ListTree,
  Search,
} as const;

/**
 * Her menü öğesi hangi yetkiyi gerektirdiğini kendisi söyler. Yetkisi
 * olmayan kullanıcı bağlantıyı görmez.
 *
 * DİKKAT: bu yalnızca kolaylıktır, güvenlik değildir — adres elle
 * yazılabilir. Asıl engel sayfadaki requirePermission() çağrısıdır.
 * `permission` alanı boş olanlar (Panel, Hesabım) panele girebilen
 * herkese açıktır.
 */
const GROUPS: {
  title: string;
  items: { href: string; label: string; icon: keyof typeof ICONS; permission?: Permission }[];
}[] = [
  {
    title: "Genel",
    items: [
      { href: adminUrl(), label: "Panel", icon: "LayoutDashboard" },
      { href: adminUrl("siparisler"), label: "Siparişler", icon: "ShoppingCart", permission: "orders.view" },
      { href: adminUrl("musteriler"), label: "Müşteriler", icon: "Users", permission: "customers.view" },
      { href: adminUrl("kullanicilar"), label: "Kullanıcılar", icon: "UserCog", permission: "users.manage" },
    ],
  },
  {
    title: "Katalog",
    items: [
      { href: adminUrl("urunler"), label: "Ürünler", icon: "Package", permission: "products.manage" },
      { href: adminUrl("kategoriler"), label: "Kategoriler", icon: "Tag", permission: "categories.manage" },
      { href: adminUrl("stok"), label: "Stok Durumu", icon: "BarChart3", permission: "stock.manage" },
      { href: adminUrl("yorumlar"), label: "Yorumlar", icon: "Star", permission: "reviews.moderate" },
    ],
  },
  {
    title: "Görünüm",
    items: [
      { href: adminUrl("anasayfa"), label: "Ana Sayfa Düzeni", icon: "LayoutTemplate", permission: "content.manage" },
      { href: adminUrl("menu"), label: "Menü", icon: "ListTree", permission: "content.manage" },
      { href: adminUrl("tema"), label: "Tema", icon: "Palette", permission: "content.manage" },
      { href: adminUrl("bannerlar"), label: "Carousel", icon: "ImageIcon", permission: "content.manage" },
      { href: adminUrl("medya"), label: "Medya", icon: "Images", permission: "content.manage" },
      { href: adminUrl("sayfalar"), label: "Sayfalar", icon: "FileText", permission: "content.manage" },
    ],
  },
  {
    title: "Pazarlama",
    items: [
      { href: adminUrl("kuponlar"), label: "Kuponlar", icon: "Tag", permission: "coupons.manage" },
      { href: adminUrl("mesajlar"), label: "Mesajlar", icon: "Mail", permission: "messages.manage" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: adminUrl("hesabim"), label: "Hesabım", icon: "UserCog" },
      { href: adminUrl("ayarlar"), label: "Ayarlar", icon: "Settings", permission: "settings.manage" },
      { href: adminUrl("seo"), label: "SEO", icon: "Search", permission: "settings.manage" },
      { href: adminUrl("guvenlik"), label: "Güvenlik", icon: "ShieldCheck", permission: "security.view" },
    ],
  },
];

export default function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();

  // Yetkisi olmayan öğeleri çıkar; hepsi çıkarsa grup başlığı da görünmesin.
  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || can(role, item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Yönetim menüsü">
      {groups.map((group) => (
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
