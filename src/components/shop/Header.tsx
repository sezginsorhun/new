import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { getCategoryTree } from "@/lib/catalog";
import { getCartTotals } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/money";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";

export default async function Header() {
  const [tree, cart, session, settings] = await Promise.all([
    getCategoryTree(),
    getCartTotals(),
    getSession(),
    getSettings(),
  ]);

  const freeShippingThreshold = Number(settings.free_shipping_threshold) || 0;

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-line)] bg-[color:var(--color-cream)]/95 backdrop-blur">
      {/* Duyuru şeridi */}
      <div className="bg-[color:var(--color-ink)] text-white">
        <div className="container-page flex h-9 items-center justify-center gap-6 text-[11px] tracking-[0.14em] uppercase">
          <span>
            {formatPrice(freeShippingThreshold)} üzeri kargo ücretsiz
          </span>
          <span className="hidden sm:inline opacity-40">•</span>
          <span className="hidden sm:inline">14 gün içinde kolay iade</span>
        </div>
      </div>

      {/* Ana satır */}
      <div className="container-page">
        <div className="flex h-[68px] items-center gap-4">
          {/* Mobil menü */}
          <MobileMenu tree={tree} isLoggedIn={Boolean(session)} />

          {/* Logo */}
          <Link href="/" className="shrink-0" aria-label="Ana sayfa">
            <span className="font-[family-name:var(--font-display)] text-[26px] leading-none tracking-[0.02em]">
              {settings.site_name}
            </span>
            <span className="hidden md:block text-[9px] tracking-[0.32em] uppercase text-[color:var(--color-muted)]">
              {settings.site_tagline}
            </span>
          </Link>

          {/* Masaüstü menü */}
          <nav className="ml-6 hidden lg:flex items-stretch" aria-label="Ana menü">
            {tree.map((parent) => (
              <div key={parent.id} className="group relative flex items-center">
                <Link
                  href={`/kategori/${parent.slug}`}
                  className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-ink)] transition-colors hover:text-[color:var(--color-brand)]"
                >
                  {parent.name}
                </Link>

                {parent.children.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-50 w-[560px] translate-y-1 opacity-0 shadow-[0_18px_48px_-24px_rgba(43,35,33,0.35)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="border border-[color:var(--color-line)] bg-white p-6">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                        {parent.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/kategori/${child.slug}`}
                            className="flex items-center justify-between py-2 text-[13px] text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-brand)]"
                          >
                            {child.name}
                            <span aria-hidden className="opacity-0 transition-opacity group-hover:opacity-100">
                              →
                            </span>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={`/kategori/${parent.slug}`}
                        className="mt-5 inline-block border-t border-[color:var(--color-line)] pt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--color-brand)]"
                      >
                        Tüm {parent.name} ürünleri
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/indirimli"
              className="px-4 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-sale)]"
            >
              İndirim
            </Link>
          </nav>

          {/* Sağ ikonlar */}
          <div className="ml-auto flex items-center gap-1">
            <div className="hidden md:block w-[200px] xl:w-[260px]">
              <SearchBar />
            </div>

            <Link
              href="/arama"
              className="md:hidden p-2.5 text-[color:var(--color-ink)]"
              aria-label="Ara"
            >
              <Search size={19} strokeWidth={1.5} />
            </Link>

            <Link
              href="/hesabim/favoriler"
              className="hidden sm:block p-2.5 text-[color:var(--color-ink)] transition-colors hover:text-[color:var(--color-brand)]"
              aria-label="Favorilerim"
            >
              <Heart size={19} strokeWidth={1.5} />
            </Link>

            <Link
              href={session ? "/hesabim" : "/giris"}
              className="p-2.5 text-[color:var(--color-ink)] transition-colors hover:text-[color:var(--color-brand)]"
              aria-label={session ? "Hesabım" : "Giriş yap"}
            >
              <User size={19} strokeWidth={1.5} />
            </Link>

            <Link
              href="/sepet"
              className="relative p-2.5 text-[color:var(--color-ink)] transition-colors hover:text-[color:var(--color-brand)]"
              aria-label={`Sepet, ${cart.itemCount} ürün`}
            >
              <ShoppingBag size={19} strokeWidth={1.5} />
              {cart.itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[color:var(--color-brand)] px-1 text-[10px] font-semibold text-white">
                  {cart.itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
