/**
 * SİSTEM → SEO
 *
 * Sekme başlığı, arama sonucu açıklamaları, paylaşım görseli ve dizine
 * ekleme anahtarı. Kaydedilen her şey anında yayına girer.
 */

import SeoForm from "@/components/admin/SeoForm";
import { requirePermission } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "SEO" };

export default async function AdminSeoPage() {
  await requirePermission("settings.manage");
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px]">SEO</h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Tarayıcı sekmesinde ve arama sonuçlarında görünen başlık ve
          açıklamalar. Ürün ve kategorilerin kendi SEO alanları kendi
          ekranlarındadır.
        </p>
      </div>

      <SeoForm settings={settings} siteUrl={siteUrl} />
    </div>
  );
}
