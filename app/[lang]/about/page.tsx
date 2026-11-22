import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isLocale, type Locale } from '@/lib/i18n';
import { getActiveSources } from '@/lib/news';

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDictionary(lang).about };
}

const COPY: Record<Locale, { title: string; intro: string; steps: [string, string][]; rulesTitle: string; rules: string[]; sourcesTitle: string }> = {
  en: {
    title: 'How Buod Daily works',
    intro:
      'Buod Daily is an automatic news summary site. It reads the public RSS feeds of trusted Philippine news outlets and turns each story into a short, neutral summary in English and Filipino, always linking back to the original reports.',
    steps: [
      ['Collect', 'Every 30 minutes we read the latest headlines from the outlets listed below.'],
      ['Group', 'Articles about the same event from different outlets are grouped into one story.'],
      ['Summarize', 'An AI model writes a short summary in our own words, in English and Filipino, using only facts from those reports.'],
      ['Check', 'Our system checks that every name, number and date in the summary appears in the original reports. Summaries that fail are rewritten once, or not published.'],
      ['Publish', 'Stories reported by at least two outlets are published automatically. Sensitive stories (crime, deaths, accusations, elections) need at least three.'],
    ],
    rulesTitle: 'Our rules',
    rules: [
      'We never copy or republish articles or photos. We publish our own short summary and link to every source.',
      'Every summary is labeled as AI-generated.',
      'Claims and accusations are attributed to whoever made them.',
      'Mistakes are corrected and listed on our Corrections page.',
      'We count page visits without cookies (Vercel Web Analytics). We do not collect personal data or show ads.',
    ],
    sourcesTitle: 'Outlets we summarize',
  },
  fil: {
    title: 'Paano gumagana ang Buod Daily',
    intro:
      'Ang Buod Daily ay awtomatikong site ng buod ng balita. Binabasa nito ang mga pampublikong RSS feed ng mga mapagkakatiwalaang news outlet sa Pilipinas at ginagawang maikli at patas na buod ang bawat balita, sa Ingles at Filipino, na laging may link sa orihinal na ulat.',
    steps: [
      ['Pagkuha', 'Tuwing 30 minuto, binabasa namin ang pinakabagong mga headline mula sa mga outlet sa ibaba.'],
      ['Pagsasama', 'Pinagsasama sa iisang balita ang mga artikulo ng iba’t ibang outlet tungkol sa parehong pangyayari.'],
      ['Pagbubuod', 'Isang AI model ang sumusulat ng maikling buod sa sarili naming salita, sa Ingles at Filipino, gamit lamang ang mga detalye mula sa mga ulat.'],
      ['Pagsusuri', 'Sinusuri ng aming sistema na ang bawat pangalan, numero at petsa sa buod ay nasa orihinal na ulat. Ang hindi pumasa ay isinusulat muli nang isang beses, o hindi inilalathala.'],
      ['Paglalathala', 'Awtomatikong inilalathala ang mga balitang iniulat ng hindi bababa sa dalawang outlet. Ang mga sensitibong balita (krimen, pagkamatay, akusasyon, eleksyon) ay kailangan ng hindi bababa sa tatlo.'],
    ],
    rulesTitle: 'Ang aming mga patakaran',
    rules: [
      'Hindi kami kumokopya o muling naglalathala ng mga artikulo o larawan. Sariling maikling buod lamang ang aming inilalathala, na may link sa bawat source.',
      'May label ang bawat buod na ito ay gawa ng AI.',
      'Ipinapakilala namin kung sino ang nagsabi ng bawat pahayag o akusasyon.',
      'Itinatama namin ang mga pagkakamali at inililista ito sa aming pahina ng Mga Pagtatama.',
      'Binibilang namin ang mga bisita nang walang cookies (Vercel Web Analytics). Hindi kami nangongolekta ng personal na datos o nagpapakita ng ads.',
    ],
    sourcesTitle: 'Mga outlet na aming binubuod',
  },
};

async function Sources({ title }: { title: string }) {
  const sources = await getActiveSources();
  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {sources.map((s) => (
          <li key={s.homepage}>
            <a href={s.homepage} target="_blank" rel="noopener" className="text-primary hover:underline">
              {s.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function AboutBody({ params }: { params: Params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const c = COPY[lang];
  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-pretty text-muted-foreground">{c.intro}</p>

      <ol className="mt-10 space-y-6">
        {c.steps.map(([name, text], i) => (
          <li key={name} className="grid grid-cols-[2.5rem_1fr] gap-x-2">
            <span className="font-serif text-2xl font-semibold text-primary">{i + 1}</span>
            <div>
              <h2 className="font-semibold">{name}</h2>
              <p className="mt-1 leading-relaxed text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-10 rounded-lg bg-paper p-6">
        <h2 className="font-serif text-2xl font-semibold">{c.rulesTitle}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
          {c.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <Suspense fallback={null}>
        <Sources title={c.sourcesTitle} />
      </Suspense>
    </div>
  );
}

export default function AboutPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <AboutBody params={params} />
    </Suspense>
  );
}
