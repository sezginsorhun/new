import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import ConsentBanner from "@/components/shop/ConsentBanner";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ConsentBanner />
    </>
  );
}
