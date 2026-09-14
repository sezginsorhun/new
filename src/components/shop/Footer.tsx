import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import InstagramIcon from "./InstagramIcon";
import { getCategoryTree } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import NewsletterForm from "./NewsletterForm";

const CORPORATE_LINKS = [
  { href: "/sayfa/hakkimizda", label: "Hakkımızda" },
  { href: "/sayfa/teslimat-ve-kargo", label: "Teslimat ve Kargo" },
  { href: "/sayfa/iade-ve-degisim", label: "İade ve Değişim" },
  { href: "/sayfa/gizlilik-politikasi", label: "Gizlilik ve KVKK" },
  { href: "/sayfa/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/iletisim", label: "İletişim" },
];

export default async function Footer() {
  const [tree, settings] = await Promise.all([getCategoryTree(), getSettings()]);

  return (
    <footer className="mt-20 border-t border-[color:var(--color-line)] bg-white">
      {/* Bülten */}
      <div className="border-b border-[color:var(--color-line)]">
        <div className="container-page grid gap-8 py-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow">Bültene katıl</p>
            <h2 className="mt-2 text-[24px]">Yeni koleksiyonlardan ilk sen haberdar ol</h2>
            <p className="mt-2 text-[13px] text-[color:var(--color-ink-soft)]">
              Kampanyalar ve yeni ürünler için e-posta adresini bırak. Dilediğin an çıkabilirsin.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Bağlantılar */}
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="font-[family-name:var(--font-display)] text-[24px]">{settings.site_name}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
            {settings.site_tagline}
          </p>
          <div className="mt-6 space-y-2.5 text-[13px] text-[color:var(--color-ink-soft)]">
            <p className="flex items-start gap-2.5">
              <MapPin size={15} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              {settings.contact_address}
            </p>
            <p className="flex items-center gap-2.5">
              <Phone size={15} strokeWidth={1.5} className="shrink-0" />
              <a href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}>{settings.contact_phone}</a>
            </p>
            <p className="flex items-center gap-2.5">
              <Mail size={15} strokeWidth={1.5} className="shrink-0" />
              <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
            </p>
          </div>
          {settings.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-[color:var(--color-brand)]"
            >
              <InstagramIcon size={16} />
              Instagram
            </a>
          )}
        </div>

        {tree.slice(0, 2).map((parent) => (
          <div key={parent.id}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink)]">
              {parent.name}
            </h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-[color:var(--color-ink-soft)]">
              {parent.children.map((child) => (
                <li key={child.id}>
                  <Link href={`/kategori/${child.slug}`} className="transition-colors hover:text-[color:var(--color-brand)]">
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink)]">
            Kurumsal
          </h3>
          <ul className="mt-4 space-y-2.5 text-[13px] text-[color:var(--color-ink-soft)]">
            {CORPORATE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-[color:var(--color-brand)]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Alt şerit */}
      <div className="border-t border-[color:var(--color-line)]">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-[12px] text-[color:var(--color-muted)]">
            © {new Date().getFullYear()} {settings.site_name}. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
            <span>Güvenli ödeme</span>
            <span className="rounded border border-[color:var(--color-line-strong)] px-2 py-1 text-[10px] tracking-normal">
              iyzico
            </span>
            <span className="rounded border border-[color:var(--color-line-strong)] px-2 py-1 text-[10px] tracking-normal">
              3D Secure
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
