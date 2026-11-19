import { getDictionary, type Locale } from '@/lib/i18n';
import type { Story } from '@/lib/news';
import { StoryCard } from './story-card';

// Front-page layout: the most recent story leads, the rest follow in a list.
export function StoryList({ stories, locale, lead = true }: { stories: Story[]; locale: Locale; lead?: boolean }) {
  const t = getDictionary(locale);
  if (stories.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">{t.noStories}</p>;
  }
  const [first, ...rest] = stories;
  const list = lead ? rest : stories;

  return (
    <div>
      {lead && (
        <div className="border-b border-border pt-8">
          <StoryCard story={first} locale={locale} variant="lead" />
        </div>
      )}
      <div className="divide-y divide-border">
        {list.map((s) => (
          <StoryCard key={s.id} story={s} locale={locale} />
        ))}
      </div>
    </div>
  );
}

export function StoryListSkeleton() {
  return (
    <div className="animate-pulse space-y-10 py-10" aria-hidden>
      <div className="space-y-3">
        <div className="h-3 w-32 rounded bg-muted" />
        <div className="h-9 w-4/5 rounded bg-muted" />
        <div className="h-4 w-3/5 rounded bg-muted" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-6 w-3/4 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
