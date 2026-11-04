import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import ProfileForms from "@/components/shop/ProfileForms";

export const metadata: Metadata = {
  title: "Hesap Bilgilerim",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <ProfileForms
      firstName={user.firstName}
      lastName={user.lastName}
      email={user.email}
      phone={user.phone ?? ""}
      acceptsMarketing={user.acceptsMarketing}
    />
  );
}
