/**
 * GÖRÜNÜM → MENÜ
 *
 * Üst menünün sırası, görünürlüğü ve adları. Menü kategorilerden otomatik
 * oluşur; burada yalnızca düzenleme katmanı yönetilir (bkz. src/lib/menu.ts).
 */

import MenuForm, { type CustomRow, type MenuRow } from "@/components/admin/MenuForm";
import { requirePermission } from "@/lib/auth";
import { getCategoryTree } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { parseMenuOverride } from "@/lib/menu";

export const metadata = { title: "Menü" };

export default async function AdminMenuPage() {
  await requirePermission("content.manage");

  const [tree, settings] = await Promise.all([getCategoryTree(), getSettings()]);
  const override = parseMenuOverride(settings.menu_overrides);

  const hidden = new Set(override.hidden ?? []);
  const labels = override.labels ?? {};
  const order = override.order ?? [];

  /* Kaydedilmiş sıra önce; sonradan açılan kategoriler sona eklenir. */
  const rank = (slug: string) => {
    const index = order.indexOf(slug);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  const rows: MenuRow[] = [...tree]
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      label: labels[category.slug] || category.name,
      visible: !hidden.has(category.slug),
      childCount: category.children.length,
    }));

  const custom: CustomRow[] = (override.custom ?? []).map((link) => ({
    label: link.label,
    href: link.href,
    start: link.position === "start",
    highlight: Boolean(link.highlight),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px]">Menü</h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Üst menüde ne görüneceği, hangi sırayla duracağı ve hangi adla
          yazılacağı. Değişiklik anında yayına girer.
        </p>
      </div>

      <MenuForm rows={rows} custom={custom} />
    </div>
  );
}
