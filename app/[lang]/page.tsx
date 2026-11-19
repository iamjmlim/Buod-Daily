import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { StoryList, StoryListSkeleton } from '@/components/site/story-list';
import { isLocale } from '@/lib/i18n';
import { getLatestStories } from '@/lib/news';

async function HomeStories({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const stories = await getLatestStories(lang);
  return <StoryList stories={stories} locale={lang} />;
}

export default function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<StoryListSkeleton />}>
      <HomeStories params={params} />
    </Suspense>
  );
}
