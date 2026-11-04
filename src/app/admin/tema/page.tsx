/**
 * GÖRÜNÜM → TEMA
 *
 * Vitrinin renklerini, ölçülerini ve özel CSS'ini düzenler.
 * `content.manage` yetkisi gerekir — Ana Sayfa Düzeni ve Medya ile aynı grup.
 */

import ThemeForm from "@/components/admin/ThemeForm";
import { requirePermission } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/default-settings";

export const metadata = { title: "Tema" };

export default async function AdminThemePage() {
  await requirePermission("content.manage");
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px]">Tema</h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Müşteri tarafının renkleri ve görünümü. Kaydettiğin an yayına girer —
          dağıtım beklemen gerekmez.
        </p>
      </div>

      <ThemeForm settings={settings} defaults={DEFAULT_SETTINGS} />
    </div>
  );
}
