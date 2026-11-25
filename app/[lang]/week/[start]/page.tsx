import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { StoryList, StoryListSkeleton } from '@/components/site/story-list';
import { isLocale, type Locale } from '@/lib/i18n';
import { getFirstStoryDate, getSitemapStories, getTopStoriesBetween } from '@/lib/news';
import { hreflang } from '@/lib/seo';
import { breadcrumbs, graph, storyList } from '@/lib/structured-data';
import { JsonLd } from '@/components/site/json-ld';
import { isWeekStart, shiftWeek, weekLabel, weekOf, weekRange } from '@/lib/weeks';

type Params = Promise<{ lang: string; start: string }>;

const WEEK_COPY = {
  en: {
    title: (w: string) => `Top Philippine news, ${w}`,
    description: (w: string) => `The biggest news stories in the Philippines for ${w}, ranked by how many outlets covered them, each summarized with links to the original reports.`,
    intro: 'The stories covered by the most news outlets this week, each with a short summary and links to the original reports.',
    soFar: 'This week so far. The list updates as new stories come in.',
    prev: 'Previous week',
    next: 'Next week',
    all: 'All weeks',
  },
  fil: {
    title: (w: string) => `Mga pangunahing balita sa Pilipinas, ${w}`,
    description: (w: string) => `Ang pinakamalalaking balita sa Pilipinas para sa ${w}, ayon sa dami ng outlet na nag-ulat, may maikling buod at link sa orihinal na ulat.`,
    intro: 'Ang mga balitang iniulat ng pinakamaraming news outlet ngayong linggo, may maikling buod at link sa orihinal na ulat.',
    soFar: 'Ngayong linggo hanggang ngayon. Nadaragdagan ang listahan habang may bagong balita.',
    prev: 'Nakaraang linggo',
    next: 'Susunod na linggo',
    all: 'Lahat ng linggo',
  },
} satisfies Record<Locale, unknown>;

// Prerender the weeks that recent stories fall in; other weeks render on demand.
export async function generateStaticParams() {
  const stories = await getSitemapStories(200).catch(() => []);
  const weeks = [...new Set(stories.map((s) => weekOf(new Date(s.publishedAt))))].slice(0, 8);
  return (weeks.length ? weeks : ['2026-11-16']).map((start) => ({ start }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, start } = await params;
  if (!isLocale(lang) || !isWeekStart(start)) return {};
  const c = WEEK_COPY[lang];
  const w = weekLabel(start, lang);
  return {
    title: c.title(w),
    description: c.description(w),
    alternates: { canonical: `/${lang}/week/${start}`, languages: hreflang({ en: `/en/week/${start}`, fil: `/fil/week/${start}` }) },
  };
}

async function WeekStories({ params }: { params: Params }) {
  const { lang, start } = await params;
  if (!isLocale(lang) || !isWeekStart(start)) notFound();
  await connection();
  const current = weekOf(new Date());
  const first = await getFirstStoryDate();
  if (!first || start > current || start < weekOf(new Date(first))) notFound();

  const c = WEEK_COPY[lang];
  const { from, to } = weekRange(start);
  const stories = await getTopStoriesBetween(lang, from, to);
  const prev = shiftWeek(start, -1);
  const next = shiftWeek(start, 1);
  const linkClass = 'inline-flex min-h-11 items-center font-medium text-primary hover:underline';

  const title = c.title(weekLabel(start, lang));
  return (
    <>
      <JsonLd
        data={graph(
          storyList(lang, title, '/week/' + start, stories),
          breadcrumbs(lang, [
            ['Buod Daily', ''],
            [c.all, '/week'],
            [title, '/week/' + start],
          ]),
        )}
      />
      <div className="border-b border-border pt-7 pb-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{c.title(weekLabel(start, lang))}</h1>
        <p className="mt-2 max-w-[40rem] text-pretty text-muted-foreground">{start === current ? c.soFar : c.intro}</p>
      </div>
      <StoryList stories={stories} locale={lang} />
      <nav aria-label={c.all} className="mt-8 flex flex-wrap justify-between gap-x-6 border-t border-border pt-2">
        {prev >= weekOf(new Date(first)) ? (
          <Link href={`/${lang}/week/${prev}`} className={linkClass}>
            ← {c.prev}
          </Link>
        ) : (
          <span />
        )}
        <Link href={`/${lang}/week`} className={linkClass}>
          {c.all}
        </Link>
        {next <= current ? (
          <Link href={`/${lang}/week/${next}`} className={linkClass}>
            {c.next} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}

export default function WeekPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<StoryListSkeleton />}>
      <WeekStories params={params} />
    </Suspense>
  );
}
