import { desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import CouponManager from "@/components/admin/CouponManager";

export default async function AdminCouponsPage() {
  await requirePermission("coupons.manage");
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));

  return (
    <div className="max-w-[1000px]">
      <h1 className="mb-1 text-[26px]">Kuponlar</h1>
      <p className="mb-6 text-[13px] text-[color:var(--color-muted)]">
        Müşterilerin sepette kullanabileceği indirim kodları.
      </p>
      <CouponManager coupons={rows} />
    </div>
  );
}
