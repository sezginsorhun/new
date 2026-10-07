import Link from "next/link";
import Image from "next/image";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { getCategoryTree } from "@/lib/catalog";
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
 * Minimal kurgu: tek satır, kalın kelime logo, küçük büyük-harf menü,
 * sağda arama + hesap + sepet. Duyuru şeridi, logo, menü vurgusu ve
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
  const MAX_INLINE_CATEGORIES = 7;
  const inlineCategories = tree.slice(0, MAX_INLINE_CATEGORIES);
  const overflowCategories = tree.slice(MAX_INLINE_CATEGORIES);

  return (
    <header className="sticky top-0 z-40 bg-white">
      {announcements.length > 0 && (
        <AnnouncementBar
          items={announcements}
          background={settings.announce_bg || "#141110"}
          color={settings.announce_color || "#ffffff"}
        />
      )}

      <div className="border-b border-[color:var(--color-line)]">
        <div className="container-page">
          <div className="flex h-[62px] items-center gap-3">
            <MobileMenu tree={tree} isLoggedIn={Boolean(session)} />

            {/* Logo */}
            <Link href="/" className="shrink-0" aria-label="Ana sayfa">
              {settings.logo_url ? (
                <Image
                  src={settings.logo_url}
                  alt={settings.site_name}
                  width={132}
                  height={30}
                  className="h-[26px] w-auto object-contain"
                  priority
                />
              ) : (
                <span className="text-[23px] font-bold tracking-[-0.03em] leading-none">
                  {settings.site_name}
                </span>
              )}
            </Link>

            {/* Masaüstü menü */}
            <nav className="ml-5 hidden items-stretch lg:flex" aria-label="Ana menü">
              {inlineCategories.map((parent) => (
                <div key={parent.id} className="group relative flex items-center">
                  <Link
                    href={`/kategori/${parent.slug}`}
                    className="px-3 py-3 text-[12.5px] font-semibold tracking-[-0.01em] transition-colors hover:text-[color:var(--color-brand)]"
                  >
                    {parent.name}
                  </Link>

                  {parent.children.length > 0 && (
                    <div className="invisible absolute left-0 top-full z-50 w-[520px] opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                      <div className="border border-[color:var(--color-line)] border-t-0 bg-white p-6">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                          {parent.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/kategori/${child.slug}`}
                              className="py-1.5 text-[13px] text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                        <Link
                          href={`/kategori/${parent.slug}`}
                          className="mt-5 inline-block border-t border-[color:var(--color-line)] pt-4 text-[12px] font-semibold"
                        >
                          Tüm {parent.name} ürünleri →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/*
                Taşan kategoriler.
                Menüye sığmayanlar tek bir "Diğer" başlığı altında toplanır —
                yoksa 12 ana kategori üst satırı taşırır ve logo ile sepet
                simgesi birbirine girer. Sıralamayı panelden değiştirince
                hangi kategorilerin üstte kalacağına sen karar verirsin.
              */}
              {overflowCategories.length > 0 && (
                <div className="group relative flex items-center">
                  <span className="cursor-default px-3 py-3 text-[12.5px] font-semibold tracking-[-0.01em]">
                    Diğer
                  </span>
                  <div className="invisible absolute right-0 top-full z-50 w-[560px] opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                    <div className="border border-[color:var(--color-line)] border-t-0 bg-white p-6">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        {overflowCategories.map((parent) => (
                          <div key={parent.id}>
                            <Link
                              href={`/kategori/${parent.slug}`}
                              className="block text-[12.5px] font-semibold"
                            >
                              {parent.name}
                            </Link>
                            {parent.children.map((child) => (
                              <Link
                                key={child.id}
                                href={`/kategori/${child.slug}`}
                                className="block py-1 text-[13px] text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settings.menu_highlight_label && (
                <Link
                  href={settings.menu_highlight_url || "/indirimli"}
                  className="flex items-center px-3.5 py-3 text-[12.5px] font-semibold text-[color:var(--color-brand)]"
                >
                  {settings.menu_highlight_label}
                </Link>
              )}
            </nav>

            {/* Sağ taraf */}
            <div className="ml-auto flex items-center gap-0.5">
              <div className="hidden w-[190px] md:block xl:w-[250px]">
                <SearchBar />
              </div>

              <Link href="/arama" className="p-2.5 md:hidden" aria-label="Ara">
                <Search size={19} strokeWidth={1.6} />
              </Link>

              <Link
                href="/hesabim/favoriler"
                className="hidden p-2.5 transition-colors hover:text-[color:var(--color-brand)] sm:block"
                aria-label="Favorilerim"
              >
                <Heart size={19} strokeWidth={1.6} />
              </Link>

              <Link
                href={session ? "/hesabim" : "/giris"}
                className="p-2.5 transition-colors hover:text-[color:var(--color-brand)]"
                aria-label={session ? "Hesabım" : "Giriş yap"}
              >
                <User size={19} strokeWidth={1.6} />
              </Link>

              <Link
                href="/sepet"
                className="relative p-2.5 transition-colors hover:text-[color:var(--color-brand)]"
                aria-label={`Sepet, ${cart.itemCount} ürün`}
              >
                <ShoppingBag size={19} strokeWidth={1.6} />
                {cart.itemCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[color:var(--color-brand)] px-1 text-[10px] font-bold text-white">
                    {cart.itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
