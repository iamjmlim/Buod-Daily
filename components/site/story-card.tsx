import Link from 'next/link';
import { cn } from '@/lib/utils';
import { firstSentences } from '@/lib/excerpt';
import { formatDateTime, getDictionary, type Locale } from '@/lib/i18n';
import type { Story } from '@/lib/news';
import { OutletCount } from './outlet-count';

export function StoryCard({
  story,
  locale,
  variant = 'default',
  showCategory = true,
}: {
  story: Story;
  locale: Locale;
  variant?: 'lead' | 'default';
  showCategory?: boolean;
}) {
  const t = getDictionary(locale);
  const href = `/${locale}/story/${story.slug}`;
  const isLead = variant === 'lead';

  return (
    <article className={cn('group relative', isLead ? 'pt-7 pb-8' : 'py-6')}>
      <h2
        className={cn(
          'font-serif font-semibold tracking-tight text-balance',
          isLead ? 'text-[1.75rem] leading-[1.15] sm:text-[2.5rem]' : 'text-xl leading-snug sm:text-[1.4rem]',
        )}
      >
        <Link
          href={href}
          className="after:absolute after:inset-0 after:content-[''] group-hover:underline group-hover:decoration-highlight group-hover:decoration-2 group-hover:underline-offset-4"
        >
          {story.headline}
        </Link>
      </h2>

      {/* One sentence on cards, two on the lead: enough to know the story, not the whole summary. */}
      <p
        className={cn(
          'mt-2.5 max-w-[36rem] text-pretty text-muted-foreground',
          isLead ? 'text-base leading-relaxed sm:max-w-[40rem] sm:text-lg' : 'leading-relaxed',
        )}
      >
        {isLead ? (
          <>
            {/* Phones get one sentence so more of the day fits on the first screen. */}
            <span className="sm:hidden">{firstSentences(story.summary, 1)}</span>
            <span className="hidden sm:inline">{firstSentences(story.summary, 2)}</span>
          </>
        ) : (
          firstSentences(story.summary, 1)
        )}
      </p>

      <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted-foreground">
        <OutletCount count={story.sources.length} locale={locale} />
        <span className="sr-only">: </span>
        <span>{story.sources.map((s) => s.outlet).join(' · ')}</span>
      </p>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
        {showCategory && story.category && (
          <>
            <Link
              href={`/${locale}/${story.category}`}
              className="relative z-10 font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.categories[story.category]}
            </Link>
            <span aria-hidden>·</span>
          </>
        )}
        <time dateTime={story.publishedAt}>{formatDateTime(story.publishedAt, locale)}</time>
        {story.summaryUpdatedAt && (
          <>
            <span aria-hidden>·</span>
            <span className="font-medium text-foreground">{t.updated}</span>
          </>
        )}
      </p>
    </article>
  );
}
