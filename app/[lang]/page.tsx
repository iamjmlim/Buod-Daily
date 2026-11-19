import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { rankStories, StoryList, StoryListSkeleton } from '@/components/site/story-list';
import { formatDate, formatTime, getDictionary, isLocale } from '@/lib/i18n';
import { getLatestStories } from '@/lib/news';

async function HomeStories({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const stories = await getLatestStories(lang);
  const lastChange = stories
    .flatMap((s) => [s.publishedAt, s.summaryUpdatedAt ?? s.publishedAt])
    .sort()
    .at(-1);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border pt-7 pb-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{t.topStories}</h1>
        {lastChange && (
          <p className="text-sm text-muted-foreground">
            <span className="capitalize">{formatDate(lastChange, lang)}</span>
            <span aria-hidden> · </span>
            {t.lastUpdated} <time dateTime={lastChange}>{formatTime(lastChange, lang)}</time>
            <span aria-hidden> · </span>
            <Link href={`/${lang}/about`} className="font-medium text-primary hover:underline">
              {t.about}
            </Link>
          </p>
        )}
      </div>
      <StoryList stories={rankStories(stories)} locale={lang} />
    </>
  );
}

export default function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<StoryListSkeleton />}>
      <HomeStories params={params} />
    </Suspense>
  );
}
