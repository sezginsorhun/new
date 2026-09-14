import { getSettings } from "@/lib/settings";
import { isIyzicoConfigured } from "@/lib/iyzico";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-[800px]">
      <h1 className="mb-1 text-[26px]">Ayarlar</h1>
      <p className="mb-6 text-[13px] text-[color:var(--color-muted)]">
        Kargo ücretleri, iletişim bilgileri ve ödeme yöntemleri.
      </p>

      <SettingsForm settings={settings} iyzicoConfigured={isIyzicoConfigured()} />
    </div>
  );
}
