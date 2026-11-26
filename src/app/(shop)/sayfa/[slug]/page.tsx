import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { LEGAL_UPDATED_AT, fillTokens, getLegalPage, isPlaceholderContent } from "@/lib/legal-pages";

/**
 * KURUMSAL SAYFA
 * Önce panelde kaydedilmiş sayfaya bakılır. Yoksa — ya da hâlâ kurulumdaki
 * örnek metni taşıyorsa — hazır yasal metin (lib/legal-pages.ts) gösterilir.
 */
async function loadPage(slug: string) {
  const [rows, settings] = await Promise.all([
    db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, slug), eq(pages.isActive, true)))
      .limit(1),
    getSettings(),
  ]);
  const stored = rows[0];
  if (stored && !isPlaceholderContent(stored.content)) {
    return {
      title: stored.title,
      body: fillTokens(stored.content, settings),
      updatedAt: stored.updatedAt,
    };
  }
  const fallback = getLegalPage(slug, settings);
  return fallback ? { ...fallback, updatedAt: LEGAL_UPDATED_AT } : null;
}

export async function generateMetadata(props: PageProps<"/sayfa/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await loadPage(slug);
  return page
    ? { title: page.title, alternates: { canonical: `/sayfa/${slug}` } }
    : { title: "Sayfa bulunamadı" };
}

/** "## başlık", "- madde" ve paragrafları sade biçimde çizer. */
function Body({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`l${blocks.length}`} className="list-disc space-y-1.5 pl-5">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      continue;
    }
    flush();
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h${blocks.length}`} className="pt-4 text-[18px] font-semibold text-[color:var(--color-ink)]">
          {line.slice(3)}
        </h2>,
      );
    } else {
      blocks.push(<p key={`p${blocks.length}`}>{line}</p>);
    }
  }
  flush();
  return <>{blocks}</>;
}

export default async function ContentPage(props: PageProps<"/sayfa/[slug]">) {
  const { slug } = await props.params;
  const page = await loadPage(slug);
  if (!page) notFound();

  return (
    <article className="container-page max-w-[760px] py-12">
      <h1 className="text-[32px] leading-tight">{page.title}</h1>
      <div className="mt-8 space-y-4 text-[14.5px] leading-relaxed text-[color:var(--color-ink-soft)]">
        <Body text={page.body} />
      </div>
      <p className="mt-10 border-t border-[color:var(--color-line)] pt-5 text-[12px] text-[color:var(--color-muted)]">
        Son güncelleme: {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(page.updatedAt)}
      </p>
    </article>
  );
}
