import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import ConsentBanner from "@/components/shop/ConsentBanner";
import AgeGate from "@/components/shop/AgeGate";
import ThemeStyle from "@/components/shop/ThemeStyle";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Panelden yazılan tema. Yönetim paneline BİLEREK uygulanmaz. */}
      <ThemeStyle />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ConsentBanner />
      {/* 18+ perdesi en sonda: açıkken yukarıdaki her şeyi kapatır. */}
      <AgeGate />
    </>
  );
}
