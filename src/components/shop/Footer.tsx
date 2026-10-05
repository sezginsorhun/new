import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { parseLinkList } from "@/lib/default-settings";
import { safeUrl } from "@/lib/security";
import InstagramIcon from "./InstagramIcon";

/**
 * ALT BİLGİ
 * Tüm kolonlar, bağlantılar, iletişim bilgileri ve sosyal medya adresleri
 * yönetim panelindeki Ayarlar ekranından yönetilir.
 */
export default async function Footer() {
  const settings = await getSettings();

  const columns = [
    { title: settings.footer_col1_title, links: parseLinkList(settings.footer_col1_links) },
    { title: settings.footer_col2_title, links: parseLinkList(settings.footer_col2_links) },
    { title: settings.footer_col3_title, links: parseLinkList(settings.footer_col3_links) },
  ].filter((column) => column.links.length > 0);

  const socials = [
    { url: settings.instagram_url, label: "Instagram" },
    { url: settings.facebook_url, label: "Facebook" },
    { url: settings.tiktok_url, label: "TikTok" },
    { url: settings.youtube_url, label: "YouTube" },
  ].filter((item) => safeUrl(item.url));

  return (
    <footer className="mt-auto border-t border-[color:var(--color-line)] bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        {/* Marka */}
        <div className="lg:col-span-2">
          <p className="text-[21px] font-bold tracking-[-0.03em]">{settings.site_name}</p>
          <p className="mt-3 max-w-[320px] text-[13px] leading-relaxed text-[color:var(--color-ink-soft)]">
            {settings.footer_about}
          </p>

          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={safeUrl(social.url)!}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center border border-[color:var(--color-line)] transition-colors hover:border-[color:var(--color-ink)]"
                >
                  {social.label === "Instagram" ? (
                    <InstagramIcon size={16} />
                  ) : (
                    <span className="text-[11px] font-semibold">{social.label.slice(0, 2)}</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Bağlantı kolonları */}
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="mb-3.5 text-[11px] font-bold uppercase tracking-[0.14em]">
              {column.title}
            </p>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <Link
                    href={safeUrl(link.href) ?? "#"}
                    className="text-[13px] text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* İletişim şeridi */}
      <div className="border-t border-[color:var(--color-line)]">
        <div className="container-page flex flex-wrap gap-x-7 gap-y-2 py-4 text-[12.5px] text-[color:var(--color-ink-soft)]">
          {settings.contact_phone && (
            <a href={`tel:${settings.contact_phone.replace(/\s/g, "")}`} className="flex items-center gap-2">
              <Phone size={14} strokeWidth={1.6} /> {settings.contact_phone}
            </a>
          )}
          {settings.contact_email && (
            <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2">
              <Mail size={14} strokeWidth={1.6} /> {settings.contact_email}
            </a>
          )}
          {settings.contact_address && (
            <span className="flex items-center gap-2">
              <MapPin size={14} strokeWidth={1.6} /> {settings.contact_address}
            </span>
          )}
        </div>
      </div>

      {/* Telif */}
      <div className="border-t border-[color:var(--color-line)]">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-[11.5px] text-[color:var(--color-muted)]">
          <p>
            © {new Date().getFullYear()} {settings.site_name}. {settings.footer_note}
          </p>
          <p className="font-medium">Güvenli ödeme · iyzico · 3D Secure</p>
        </div>
      </div>
    </footer>
  );
}
