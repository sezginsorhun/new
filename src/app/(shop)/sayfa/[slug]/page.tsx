import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";

async function loadPage(slug: string) {
  const rows = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.isActive, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function generateMetadata(props: PageProps<"/sayfa/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await loadPage(slug);
  return page
    ? { title: page.title, alternates: { canonical: `/sayfa/${slug}` } }
    : { title: "Sayfa bulunamadı" };
}

export default async function ContentPage(props: PageProps<"/sayfa/[slug]">) {
  const { slug } = await props.params;
  const page = await loadPage(slug);
  if (!page) notFound();

  return (
    <article className="container-page max-w-[760px] py-12">
      <h1 className="text-[32px] leading-tight">{page.title}</h1>
      <div className="mt-8 space-y-4 text-[14.5px] leading-relaxed text-[color:var(--color-ink-soft)]">
        {page.content.split("\n").map((paragraph, index) =>
          paragraph.trim() === "" ? null : (
            <p key={index}>{paragraph}</p>
          ),
        )}
      </div>
      <p className="mt-10 border-t border-[color:var(--color-line)] pt-5 text-[12px] text-[color:var(--color-muted)]">
        Son güncelleme: {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(page.updatedAt)}
      </p>
    </article>
  );
}
