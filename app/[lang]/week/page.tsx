import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n';
import { getFirstStoryDate } from '@/lib/news';
import { hreflang } from '@/lib/seo';
import { shiftWeek, weekLabel, weekOf } from '@/lib/weeks';

type Params = Promise<{ lang: string }>;

const COPY = {
  en: { title: 'Top Philippine news by week', description: 'Each week’s biggest news stories in the Philippines, ranked by how many outlets covered them.', thisWeek: 'this week' },
  fil: { title: 'Mga pangunahing balita sa Pilipinas kada linggo', description: 'Ang pinakamalalaking balita sa Pilipinas bawat linggo, ayon sa dami ng outlet na nag-ulat.', thisWeek: 'ngayong linggo' },
} satisfies Record<Locale, unknown>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: COPY[lang].title,
    description: COPY[lang].description,
    alternates: { canonical: `/${lang}/week`, languages: hreflang({ en: '/en/week', fil: '/fil/week' }) },
  };
}

async function Weeks({ params }: { params: Params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  await connection();
  const first = await getFirstStoryDate();
  const current = weekOf(new Date());
  const oldest = first ? weekOf(new Date(first)) : current;
  const weeks: string[] = [];
  for (let w = current; w >= oldest && weeks.length < 104; w = shiftWeek(w, -1)) weeks.push(w);

  return (
    <>
      <h1 className="border-b border-border pt-7 pb-4 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{COPY[lang].title}</h1>
      <p className="mt-4 max-w-[40rem] text-pretty text-muted-foreground">{COPY[lang].description}</p>
      <ul className="mt-6 divide-y divide-border">
        {weeks.map((w) => (
          <li key={w}>
            <Link href={`/${lang}/week/${w}`} className="flex min-h-12 items-center font-medium text-primary hover:underline">
              {weekLabel(w, lang)}
              {w === current && <span className="ml-2 font-normal text-muted-foreground">({COPY[lang].thisWeek})</span>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function WeeksPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <Weeks params={params} />
    </Suspense>
  );
}
