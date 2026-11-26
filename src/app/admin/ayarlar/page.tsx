import { getSettings } from "@/lib/settings";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { paymentProviderStatus } from "@/lib/payment";
import SettingsForm from "@/components/admin/SettingsForm";
import MailSettingsForm from "@/components/admin/MailSettingsForm";

export default async function AdminSettingsPage() {
  const admin = await requirePermission("settings.manage");
  const settings = await getSettings();

  // Şifreli SMTP değeri tarayıcıya hiç gönderilmez.
  const { smtp_pass_enc: sealedPass, ...publicSettings } = settings;
  const domain = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  return (
    <div className="max-w-[800px] space-y-6">
      <div>
        <h1 className="mb-1 text-[26px]">Ayarlar</h1>
        <p className="text-[13px] text-[color:var(--color-muted)]">
          Kargo ücretleri, iletişim bilgileri, ödeme yöntemleri ve e-posta gönderimi.
        </p>
      </div>

      {can(admin.role, "users.manage") && (
        <MailSettingsForm
          host={settings.smtp_host}
          port={settings.smtp_port || "465"}
          user={settings.smtp_user}
          from={settings.mail_from}
          hasPassword={Boolean(sealedPass)}
          envOverride={Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)}
          suggestedUser={domain ? `admin@${domain}` : ""}
        />
      )}

      <SettingsForm settings={publicSettings} payment={paymentProviderStatus()} />
    </div>
  );
}
