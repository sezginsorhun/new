import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import ContactForm from "@/components/shop/ContactForm";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Sorularınız için bize ulaşın.",
  alternates: { canonical: "/iletisim" },
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-[900px]">
        <header className="mb-10 text-center">
          <p className="eyebrow">Bize yazın</p>
          <h1 className="mt-2 text-[32px]">İletişim</h1>
          <p className="mt-2 text-[14px] text-[color:var(--color-ink-soft)]">
            Sipariş, ürün veya iade ile ilgili her konuda yanıtlıyoruz.
          </p>
        </header>

        <div className="grid gap-10 md:grid-cols-[280px_1fr]">
          <aside className="space-y-6 text-[13.5px] text-[color:var(--color-ink-soft)]">
            <div className="flex items-start gap-3">
              <MapPin size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[color:var(--color-brand)]" />
              <div>
                <p className="font-medium text-[color:var(--color-ink)]">Adres</p>
                <p>{settings.contact_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[color:var(--color-brand)]" />
              <div>
                <p className="font-medium text-[color:var(--color-ink)]">Telefon</p>
                <a href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}>
                  {settings.contact_phone}
                </a>
                <p className="mt-0.5 text-[12px]">Hafta içi 09:00 – 18:00</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={17} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[color:var(--color-brand)]" />
              <div>
                <p className="font-medium text-[color:var(--color-ink)]">E-posta</p>
                <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
              </div>
            </div>
          </aside>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
