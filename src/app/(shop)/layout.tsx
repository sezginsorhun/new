import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import ConsentBanner from "@/components/shop/ConsentBanner";
import AgeGate from "@/components/shop/AgeGate";
import ThemeStyle from "@/components/shop/ThemeStyle";
import WhatsAppFloat from "@/components/shop/WhatsAppFloat";
import { getSettings } from "@/lib/settings";
import { whatsappNumber } from "@/lib/whatsapp";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const wa = whatsappNumber(settings.whatsapp_number);
  return (
    <>
      {/* Panelden yazılan tema. Yönetim paneline BİLEREK uygulanmaz. */}
      <ThemeStyle />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {wa && <WhatsAppFloat number={wa} siteName={settings.site_name} />}
      <ConsentBanner />
      {/* 18+ perdesi en sonda: açıkken yukarıdaki her şeyi kapatır. */}
      <AgeGate />
    </>
  );
}
