import type { Metadata } from "next";
import { getActiveSections, ensureDefaultSections } from "@/lib/home";
import { getSettings } from "@/lib/settings";
import SectionRenderer from "@/components/shop/sections/SectionRenderer";

/**
 * Ana sayfanın başlığı panelden gelir ve başlık ŞABLONUNA girmez
 * (`absolute`): şablon "%s | Alenora" olduğu için ana sayfada
 * "Alenora | Alenora" gibi bir başlık çıkardı.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.seo_home_title || settings.site_name || "Alenora";
  const description =
    settings.seo_home_description || settings.seo_default_description || undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/" },
  };
}

/**
 * ANA SAYFA
 *
 * Burada sabit içerik yoktur. Sayfanın tamamı yönetim panelindeki
 * "Ana Sayfa" ekranından yönetilir: bölümler eklenir, sırası değiştirilir,
 * kapatılır. Bu dosya sadece sırayı okur ve çizdirir.
 */
export default async function HomePage() {
  // İlk kurulumda düzen boşsa varsayılan bölümler bir kez yazılır.
  await ensureDefaultSections();
  const sections = await getActiveSections();

  if (!sections.length) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-[24px]">Ana sayfa henüz düzenlenmedi</h1>
        <p className="mt-3 text-[14px] text-[color:var(--color-ink-soft)]">
          Yönetim panelindeki <strong>Ana Sayfa</strong> ekranından bölüm ekleyerek başla.
        </p>
      </div>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </>
  );
}
