import Link from 'next/link';
import { getDictionary, type Locale } from '@/lib/i18n';

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <footer className="mt-16 border-t border-border bg-paper">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 text-sm sm:grid-cols-[2fr_1fr] sm:px-6">
        <div className="space-y-2">
          <p className="font-serif text-xl font-semibold">
            Buod<span className="text-primary">.</span> <span className="font-sans text-sm font-normal text-muted-foreground">{t.tagline}</span>
          </p>
          <p className="max-w-prose text-muted-foreground">{t.footerNote}</p>
        </div>
        <ul className="space-y-2 sm:justify-self-end">
          <li>
            <Link href={`/${locale}/about`} className="hover:underline">
              {t.about}
            </Link>
          </li>
          <li>
            <Link href={`/${locale}/corrections`} className="hover:underline">
              {t.corrections}
            </Link>
          </li>
          <li>
            <Link href={`/${locale}/feed.xml`} className="hover:underline">
              RSS
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
