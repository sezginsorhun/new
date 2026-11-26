import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Heart, ShoppingBag, User } from "lucide-react";
import { getCategoryTree } from "@/lib/catalog";
import { buildMenu, parseMenuOverride } from "@/lib/menu";
import { getCartTotals } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { parseLines } from "@/lib/default-settings";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";
import AnnouncementBar from "./AnnouncementBar";

/**
 * ÜST BAŞLIK
 *
 * İki satır: üstte logo, geniş arama, favori / hesap / sepet; altta
 * açılır listeli kategori menüsü. Duyuru şeridi, logo, menü vurgusu ve
 * kategoriler — hepsi yönetim panelinden gelir.
 *
 * Yönetim paneline ait hiçbir bağlantı burada YOKTUR; panel ayrı ve gizli
 * bir adreste yaşar, müşteri hiçbir şekilde görmez.
 */
export default async function Header() {
  const [tree, cart, session, settings] = await Promise.all([
    getCategoryTree(),
    getCartTotals(),
    getSession(),
    getSettings(),
  ]);

  const announcements = settings.announce_enabled === "1" ? parseLines(settings.announce_items) : [];

  /*
   * Üst menüye kaç ana kategori sığar?
   * Logo + arama + hesap/sepet simgeleriyle birlikte tek satırda yedi
   * başlık rahat durur. Fazlası "Diğer" açılır listesine düşer.
   */
  const MAX_INLINE_CATEGORIES = 9;

  // Duyuru şeridi panelde özel bir renge ayarlanmadıysa marka gradyanı kullanılır.
  const announceBg =
    !settings.announce_bg || settings.announce_bg.toLowerCase() === "#141110"
      ? "linear-gradient(90deg, var(--color-brand) 0%, #8a2e8f 55%, var(--color-sale) 100%)"
      : settings.announce_bg;
  /*
   * Menü kategorilerden otomatik oluşur; paneldeki düzenlemeler
   * (gizle / sırala / yeniden adlandır / özel bağlantı) üzerine uygulanır.
   */
  const menu = buildMenu(tree, parseMenuOverride(settings.menu_overrides));
  const inlineCategories = menu.slice(0, MAX_INLINE_CATEGORIES);
  const overflowCategories = menu.slice(MAX_INLINE_CATEGORIES);

  return (
    <header className="sticky top-0 z-40 bg-white lg:relative">
      {announcements.length > 0 && (
        <AnnouncementBar
          items={announcements}
          background={announceBg}
          color={settings.announce_color || "#ffffff"}
        />
      )}

      {/* 1. satır: logo · arama · hesap */}
      <div className="border-b border-[color:var(--color-line)]">
        <div className="container-page">
          <div className="flex h-[64px] items-center gap-3 lg:h-[76px] lg:gap-6">
            <MobileMenu menu={menu} isLoggedIn={Boolean(session)} />

            <Link href="/" className="shrink-0" aria-label="Ana sayfa">
              {settings.logo_url ? (
                <Image
                  src={settings.logo_url}
                  alt={settings.site_name}
                  width={160}
                  height={40}
                  className="h-[30px] w-auto object-contain lg:h-[38px]"
                  priority
                />
              ) : (
                <span className="text-[23px] font-extrabold leading-none tracking-[-0.03em] text-[color:var(--color-brand)] lg:text-[27px]">
                  {settings.site_name}
                </span>
              )}
            </Link>

            <div className="mx-auto hidden w-full max-w-[640px] md:block">
              <SearchBar large />
            </div>

            <div className="ml-auto flex items-center gap-1.5 md:ml-0">
              <Link
                href="/hesabim/favoriler"
                className="hidden h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-card)] border border-[color:var(--color-line)] transition-colors hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)] sm:flex"
                aria-label="Favorilerim"
              >
                <Heart size={19} strokeWidth={1.7} />
              </Link>

              <Link
                href={session ? "/hesabim" : "/giris"}
                className="flex h-[44px] items-center gap-2 rounded-[var(--radius-card)] px-2.5 transition-colors hover:text-[color:var(--color-brand)] lg:border lg:border-[color:var(--color-line)] lg:px-3.5 lg:hover:border-[color:var(--color-brand)]"
                aria-label={session ? "Hesabım" : "Giriş yap"}
              >
                <User size={19} strokeWidth={1.7} />
                <span className="hidden text-[13px] font-semibold lg:inline">
                  {session ? "Hesabım" : "Giriş Yap"}
                </span>
              </Link>

              <Link
                href="/sepet"
                className="relative flex h-[44px] items-center gap-2 rounded-[var(--radius-card)] px-2.5 transition-colors hover:text-[color:var(--color-brand)] lg:bg-[color:var(--color-brand)] lg:px-4 lg:text-white lg:hover:bg-[color:var(--color-brand-dark)] lg:hover:text-white"
                aria-label={`Sepet, ${cart.itemCount} ürün`}
              >
                <ShoppingBag size={19} strokeWidth={1.7} />
                <span className="hidden text-[13px] font-semibold lg:inline">Sepetim</span>
                {cart.itemCount > 0 && (
                  <span className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[color:var(--color-sale)] px-1 text-[10.5px] font-bold text-white lg:static lg:bg-white lg:text-[color:var(--color-brand)]">
                    {cart.itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobil: tam genişlik arama */}
      <div className="border-b border-[color:var(--color-line)] px-4 py-2.5 md:hidden">
        <SearchBar large />
      </div>

      {/* 2. satır: kategori menüsü (masaüstü) */}
      <div className="hidden border-b border-[color:var(--color-line)] bg-white lg:block">
        <nav className="container-page flex items-stretch justify-between" aria-label="Ana menü">
          <div className="flex items-stretch">
            {inlineCategories.map((parent) => (
              <div key={parent.key} className="group relative flex items-center">
                <Link
                  href={parent.href}
                  className={`flex items-center gap-1 px-3 py-3.5 text-[13px] font-semibold transition-colors hover:text-[color:var(--color-brand)] xl:px-3.5 ${
                    parent.highlight ? "text-[color:var(--color-brand)]" : ""
                  }`}
                >
                  {parent.label}
                  {parent.children.length > 0 && (
                    <ChevronDown size={14} strokeWidth={2} className="text-[color:var(--color-muted)] transition-transform group-hover:rotate-180" />
                  )}
                </Link>

                {parent.children.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-50 w-[520px] opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                    <div className="rounded-b-[var(--radius-card)] border border-[color:var(--color-line)] bg-white p-6 shadow-[0_12px_30px_rgba(40,20,70,0.10)]">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                        {parent.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="py-1.5 text-[13px] text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-brand)]"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={parent.href}
                        className="mt-5 inline-block border-t border-[color:var(--color-line)] pt-4 text-[12.5px] font-semibold text-[color:var(--color-brand)]"
                      >
                        Tüm {parent.label} ürünleri →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {overflowCategories.length > 0 && (
              <div className="group relative flex items-center">
                <span className="flex cursor-default items-center gap-1 px-3 py-3.5 text-[13px] font-semibold">
                  Diğer <ChevronDown size={14} strokeWidth={2} className="text-[color:var(--color-muted)]" />
                </span>
                <div className="invisible absolute right-0 top-full z-50 w-[560px] opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-b-[var(--radius-card)] border border-[color:var(--color-line)] bg-white p-6 shadow-[0_12px_30px_rgba(40,20,70,0.10)]">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      {overflowCategories.map((parent) => (
                        <div key={parent.key}>
                          <Link href={parent.href} className="block text-[13px] font-semibold">
                            {parent.label}
                          </Link>
                          {parent.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block py-1 text-[13px] text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-brand)]"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {settings.menu_highlight_label && (
            <Link
              href={settings.menu_highlight_url || "/indirimli"}
              className="flex items-center px-3 py-3.5 text-[13px] font-bold text-[color:var(--color-sale)]"
            >
              {settings.menu_highlight_label}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
