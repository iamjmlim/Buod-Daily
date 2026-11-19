import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDateTime, getDictionary, type Locale } from '@/lib/i18n';
import type { Story } from '@/lib/news';

// A sentence ends at . ! ? followed by a space and a capital letter (or the end),
// so "P27.9 billion", "Nov. 19" and "Jr. Marcos" don't split a sentence.
const ABBREVIATIONS = /\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|Mr|Mrs|Ms|Dr|Sen|Rep|Gov|Gen|Col|Atty|Engr|Jr|Sr|St|No|Sto|Sta)\.$/;

export function firstSentences(text: string, count: number): string {
  const sentences: string[] = [];
  let start = 0;
  const boundary = /[.!?]["”’)]?(?=\s+["“‘(]?[A-Z0-9ÑÁÉÍÓÚ])/g;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(text)) && sentences.length < count) {
    const end = m.index + m[0].length;
    if (ABBREVIATIONS.test(text.slice(Math.max(0, end - 6), end))) continue;
    sentences.push(text.slice(start, end).trim());
    start = end;
  }
  if (sentences.length < count) sentences.push(text.slice(start).trim());
  return sentences.filter(Boolean).slice(0, count).join(' ');
}

export function StoryCard({
  story,
  locale,
  variant = 'default',
}: {
  story: Story;
  locale: Locale;
  variant?: 'lead' | 'default';
}) {
  const t = getDictionary(locale);
  const href = `/${locale}/story/${story.slug}`;
  const isLead = variant === 'lead';

  return (
    <article className={cn('group relative', isLead ? 'pb-8' : 'py-6')}>
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-wide text-muted-foreground uppercase">
        {story.category && (
          <Link
            href={`/${locale}/${story.category}`}
            className="relative z-10 font-semibold text-primary hover:underline"
          >
            {t.categories[story.category]}
          </Link>
        )}
        <time dateTime={story.publishedAt}>{formatDateTime(story.publishedAt, locale)}</time>
        {story.summaryUpdatedAt && <span className="font-medium normal-case text-foreground">{t.updated}</span>}
        {story.sensitivity !== 'normal' && (
          <span className="rounded-sm bg-highlight/30 px-1.5 py-0.5 font-medium text-highlight-foreground normal-case dark:text-foreground">
            {t.sensitive}
          </span>
        )}
      </div>

      <h2
        className={cn(
          'font-serif font-semibold tracking-tight text-balance',
          isLead ? 'text-3xl leading-tight sm:text-[2.6rem]' : 'text-xl leading-snug sm:text-2xl',
        )}
      >
        <Link href={href} className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-highlight group-hover:decoration-2 group-hover:underline-offset-4">
          {story.headline}
        </Link>
      </h2>

      <p className={cn('mt-3 text-pretty text-muted-foreground', isLead ? 'max-w-3xl text-lg leading-relaxed' : 'max-w-prose leading-relaxed')}>
        {firstSentences(story.summary, isLead ? 3 : 2)}
      </p>

      <p className="mt-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{t.reportedBy}</span>{' '}
        {story.sources.map((s) => s.outlet).join(' · ')}
      </p>
    </article>
  );
}
