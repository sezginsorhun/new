/**
 * HESABIM (yönetici)
 *
 * Yöneticinin kendi bilgilerini düzenlediği yer: ad/soyad/telefon serbest,
 * e-posta ve şifre mevcut şifreyle onaylanarak. Şifre değiştirmek için
 * vitrindeki Hesabım ekranına gitmeye gerek kalmasın diye buraya da kondu.
 */

import Link from "next/link";
import { headers } from "next/headers";
import { KeyRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { clientIpFromHeaders, isAllowedAdminIp, parseAllowlist } from "@/lib/ip-allowlist";
import AdminProfileForm from "@/components/admin/AdminProfileForm";
import AccountEmailForm from "@/components/admin/AccountEmailForm";

export const metadata = { title: "Hesabım" };

export default async function AdminAccountPage() {
  const admin = await requireAdmin();

  const h = await headers();
  const ip = clientIpFromHeaders((name) => h.get(name));
  const rules = parseAllowlist(process.env.ADMIN_IP_ALLOWLIST);
  const restricted = rules.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[24px]">Hesabım</h1>
        <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Kendi bilgilerin. E-posta ve şifre değişiklikleri mevcut şifrenle onaylanır.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminProfileForm
          firstName={admin.firstName}
          lastName={admin.lastName}
          phone={admin.phone}
        />
        <AccountEmailForm currentEmail={admin.email} />
      </div>

      <section>
        <h2 className="mb-3 text-[17px]">Şifre</h2>
        <div className="card flex flex-wrap items-center gap-3 p-4">
          <KeyRound size={17} strokeWidth={1.5} className="text-[color:var(--color-muted)]" />
          <p className="flex-1 text-[12.5px] text-[color:var(--color-muted)]">
            Şifreni değiştirmek için hesap ekranındaki şifre formunu kullan.
          </p>
          <Link href="/hesabim" className="btn-ghost text-[12.5px]">
            Şifre değiştir
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[17px]">Bağlantı bilgin</h2>
        <div className="card space-y-2 p-4">
          <p className="text-[12.5px]">
            Şu anki IP adresin: <strong className="break-all">{ip || "okunamadı"}</strong>
          </p>
          <p className="text-[12.5px] text-[color:var(--color-muted)]">
            {restricted ? (
              <>
                Panel IP kısıtı <strong>açık</strong> ({rules.length} kural).{" "}
                {isAllowedAdminIp(ip, process.env.ADMIN_IP_ALLOWLIST)
                  ? "Bu adres izinli listede."
                  : "Bu adres listede değil — normalde buraya erişemezdin."}
              </>
            ) : (
              <>
                Panel IP kısıtı <strong>kapalı</strong>. Açmak için Hostinger&apos;da{" "}
                <code>ADMIN_IP_ALLOWLIST</code> değişkenine yukarıdaki adresi yaz. Dinamik IP
                kullanıyorsan tek adres yerine aralık yazmak (örn. <code>88.1.2.0/24</code>)
                modem yenilemelerinde kilitlenmeni önler.
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
