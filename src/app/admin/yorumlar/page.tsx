import { adminUrl } from "@/lib/admin-path";
import { requirePermission } from "@/lib/auth";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import { db } from "@/db";
import { products, reviews, users } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import ReviewActions from "@/components/admin/ReviewActions";

export default async function AdminReviewsPage(props: PageProps<"/admin/yorumlar">) {
  await requirePermission("reviews.moderate");
  const query = await props.searchParams;
  const filter = typeof query.filtre === "string" ? query.filtre : "bekleyen";

  const base = db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      isApproved: reviews.isApproved,
      createdAt: reviews.createdAt,
      productName: products.name,
      productSlug: products.slug,
      userName: users.firstName,
      userLast: users.lastName,
      userEmail: users.email,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .innerJoin(users, eq(reviews.userId, users.id));

  const rows = await (filter === "tumu"
    ? base.orderBy(desc(reviews.createdAt))
    : filter === "onayli"
      ? base.where(eq(reviews.isApproved, true)).orderBy(desc(reviews.createdAt))
      : base.where(eq(reviews.isApproved, false)).orderBy(desc(reviews.createdAt)));

  return (
    <div className="max-w-[900px]">
      <h1 className="mb-1 text-[26px]">Yorumlar</h1>
      <p className="mb-5 text-[13px] text-[color:var(--color-muted)]">
        Müşteri değerlendirmeleri onaylanmadan sitede görünmez.
      </p>

      <div className="mb-5 flex gap-1.5">
        {[
          { value: "bekleyen", label: "Onay bekleyen" },
          { value: "onayli", label: "Onaylı" },
          { value: "tumu", label: "Tümü" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={adminUrl(`yorumlar?filtre=${tab.value}`)}
            className={`border px-3 py-1.5 text-[12px] ${
              filter === tab.value
                ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white"
                : "border-[color:var(--color-line-strong)] bg-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="card p-10 text-center text-[13px] text-[color:var(--color-muted)]">
          Yorum yok.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((review) => (
            <div key={review.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/urun/${review.productSlug}`}
                    target="_blank"
                    className="text-[13.5px] font-medium hover:text-[color:var(--color-brand)]"
                  >
                    {review.productName}
                  </Link>
                  <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                    {review.userName} {review.userLast} ({review.userEmail}) ·{" "}
                    {formatDateTime(review.createdAt)}
                  </p>
                </div>
                <span className="flex" aria-label={`${review.rating} yıldız`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      className={
                        n <= review.rating
                          ? "fill-[color:var(--color-brand)] text-[color:var(--color-brand)]"
                          : "text-[color:var(--color-line-strong)]"
                      }
                    />
                  ))}
                </span>
              </div>

              {review.title && <p className="mt-3 text-[13.5px] font-medium">{review.title}</p>}
              <p className="mt-1 text-[13px] text-[color:var(--color-ink-soft)]">
                {review.comment}
              </p>

              <div className="mt-4 flex items-center gap-3 border-t border-[color:var(--color-line)] pt-3">
                <span
                  className={`badge ${
                    review.isApproved
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {review.isApproved ? "Yayında" : "Onay bekliyor"}
                </span>
                <ReviewActions id={review.id} isApproved={review.isApproved} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
