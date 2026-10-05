import { getActiveSections, ensureDefaultSections } from "@/lib/home";
import SectionRenderer from "@/components/shop/sections/SectionRenderer";

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
