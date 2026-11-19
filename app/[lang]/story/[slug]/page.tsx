import { Suspense } from 'react';
import type { Metadata } from 'next';
import { hreflang } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { formatDateTime, getDictionary, isLocale } from '@/lib/i18n';
import { getRecentSlugs, getStory } from '@/lib/news';

type Params = Promise<{ lang: string; slug: string }>;

// Cache Components needs at least one value; a placeholder covers an empty database.
export async function generateStaticParams() {
  const slugs = await getRecentSlugs(30).catch(() => []);
  return (slugs.length ? slugs : ['__placeholder__']).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const story = await getStory(slug, lang);
  if (!story) return {};
  return {
    title: story.headline,
    description: story.summary.slice(0, 200),
    alternates: {
      canonical: `/${lang}/story/${slug}`,
      languages: hreflang({ en: `/en/story/${slug}`, fil: `/fil/story/${slug}` }),
    },
    openGraph: {
      type: 'article',
      title: story.headline,
      description: story.summary.slice(0, 200),
      publishedTime: story.publishedAt,
      modifiedTime: story.updatedAt,
    },
  };
}

async function StoryBody({ params }: { params: Params }) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const story = await getStory(slug, lang);
  if (!story) notFound();
  const t = getDictionary(lang);
  const contact = process.env.CONTACT_EMAIL;

  return (
    <article className="mx-auto max-w-2xl py-10">
      <Link href={`/${lang}`} className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        {t.backHome}
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-wide text-muted-foreground uppercase">
        {story.category && (
          <Link href={`/${lang}/${story.category}`} className="font-semibold text-primary hover:underline">
            {t.categories[story.category]}
          </Link>
        )}
        {story.sensitivity !== 'normal' && (
          <span className="rounded-sm bg-highlight/30 px-1.5 py-0.5 font-medium text-highlight-foreground normal-case dark:text-foreground">
            {t.sensitive}
          </span>
        )}
      </div>

      <h1 className="font-serif text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-[2.6rem]">
        {story.headline}
      </h1>

      <p className="mt-4 text-sm text-muted-foreground">
        {t.published} <time dateTime={story.publishedAt}>{formatDateTime(story.publishedAt, lang)}</time>
        {story.summaryUpdatedAt && (
          <>
            {' · '}
            <span className="font-medium text-foreground">{t.updated}</span>{' '}
            <time dateTime={story.summaryUpdatedAt}>{formatDateTime(story.summaryUpdatedAt, lang)}</time>
          </>
        )}
      </p>

      <div className="mt-8 space-y-5 text-lg leading-relaxed text-pretty">
        <p>{story.summary}</p>
      </div>

      {story.whyItMatters && (
        <aside className="mt-8 border-l-4 border-highlight bg-paper py-4 pr-4 pl-5">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t.whyItMatters}</h2>
          <p className="mt-1.5 leading-relaxed">{story.whyItMatters}</p>
        </aside>
      )}

      <section className="mt-10" aria-labelledby="sources-heading">
        <h2 id="sources-heading" className="font-serif text-xl font-semibold">
          {t.readOriginals}
        </h2>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {story.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener"
                className="group flex items-start justify-between gap-4 py-3.5 hover:bg-paper"
              >
                <span>
                  <span className="block text-sm font-semibold">{s.outlet}</span>
                  <span className="block text-sm text-muted-foreground group-hover:text-foreground">{s.title}</span>
                </span>
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 flex gap-2 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {t.aiNotice}{' '}
          {t.reportError}{' '}
          <a
            href={contact ? `mailto:${contact}?subject=${encodeURIComponent(`Correction: ${story.slug}`)}` : `/${lang}/corrections`}
            className="font-medium text-foreground underline underline-offset-2"
          >
            {t.reportErrorCta}
          </a>
          .
        </span>
      </p>
    </article>
  );
}

function StorySkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-4 py-10" aria-hidden>
      <div className="h-3 w-40 rounded bg-muted" />
      <div className="h-10 w-full rounded bg-muted" />
      <div className="h-10 w-2/3 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-4/5 rounded bg-muted" />
    </div>
  );
}

export default function StoryPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<StorySkeleton />}>
      <StoryBody params={params} />
    </Suspense>
  );
}
