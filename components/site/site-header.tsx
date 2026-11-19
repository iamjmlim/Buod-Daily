import Link from 'next/link';
import { CATEGORY_SLUGS, getDictionary, type Locale } from '@/lib/i18n';
import { LangSwitch } from './lang-switch';

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 pt-5 pb-3 sm:px-6">
        <Link href={`/${locale}`} className="group flex items-baseline gap-3 focus-visible:outline-none">
          <span className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Buod<span className="text-primary">.</span>
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">{t.tagline}</span>
        </Link>
        <LangSwitch label={t.switchLanguage} ariaLabel={t.switchLanguageLabel} />
      </div>
      <nav aria-label="Categories" className="mx-auto max-w-5xl px-4 sm:px-6">
        <ul className="-mb-px flex gap-5 overflow-x-auto pb-px text-sm [scrollbar-width:none]">
          <li>
            <Link
              href={`/${locale}`}
              className="inline-block border-b-2 border-transparent py-2.5 font-medium whitespace-nowrap text-foreground hover:border-highlight"
            >
              {t.topStories}
            </Link>
          </li>
          {CATEGORY_SLUGS.map((c) => (
            <li key={c}>
              <Link
                href={`/${locale}/${c}`}
                className="inline-block border-b-2 border-transparent py-2.5 whitespace-nowrap text-muted-foreground hover:border-highlight hover:text-foreground"
              >
                {t.categories[c]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
