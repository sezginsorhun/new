"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/menu";

export default function MobileMenu({
  menu,
  isLoggedIn,
}: {
  /** Masaüstü menüsüyle AYNI liste — panelde yapılan düzenleme ikisine birden yansısın. */
  menu: MenuItem[];
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Menü açıkken arka planın kaymasını engelle
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 p-2.5 lg:hidden"
        aria-label="Menüyü aç"
      >
        <Menu size={21} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpen(false)}
            aria-label="Menüyü kapat"
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[color:var(--color-line)] px-5 py-4">
              <span className="font-[family-name:var(--font-display)] text-xl">Menü</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Kapat" className="p-1">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {menu.map((parent) => (
                <div key={parent.key} className="border-b border-[color:var(--color-line)] last:border-0">
                  <div className="flex items-center">
                    <Link
                      href={parent.href}
                      onClick={() => setOpen(false)}
                      className={`flex-1 px-3 py-3.5 text-[14px] font-medium uppercase tracking-[0.1em] ${
                        parent.highlight ? "text-[color:var(--color-brand)]" : ""
                      }`}
                    >
                      {parent.label}
                    </Link>
                    {parent.children.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === parent.key ? null : parent.key)}
                        className="p-3"
                        aria-expanded={expanded === parent.key}
                        aria-label={`${parent.label} alt kategorileri`}
                      >
                        <ChevronDown
                          size={17}
                          strokeWidth={1.5}
                          className={`transition-transform ${expanded === parent.key ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>

                  {expanded === parent.key && (
                    <div className="pb-2 pl-3">
                      {parent.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="block px-3 py-2.5 text-[13px] text-[color:var(--color-ink-soft)]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Link
                href="/indirimli"
                onClick={() => setOpen(false)}
                className="mt-2 block px-3 py-3.5 text-[14px] font-medium uppercase tracking-[0.1em] text-[color:var(--color-sale)]"
              >
                İndirimli Ürünler
              </Link>
            </nav>

            <div className="border-t border-[color:var(--color-line)] p-4">
              <Link
                href={isLoggedIn ? "/hesabim" : "/giris"}
                onClick={() => setOpen(false)}
                className="btn-outline w-full"
              >
                {isLoggedIn ? "Hesabım" : "Giriş Yap / Üye Ol"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
