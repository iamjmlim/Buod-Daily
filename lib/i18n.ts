// UI text in English and Filipino. Story text comes from the database.

export const LOCALES = ['en', 'fil'] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const CATEGORY_SLUGS = [
  'nation',
  'metro',
  'regions',
  'business',
  'world',
  'weather',
  'sports',
  'entertainment',
  'tech',
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export function isCategory(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

const en = {
  siteName: 'Buod Daily',
  tagline: 'Philippine news, summarized.',
  description:
    'Short, neutral summaries of the day’s Philippine news in English and Filipino, with links to every original report.',
  topStories: 'Top stories',
  latest: 'Latest',
  categories: {
    nation: 'Nation',
    metro: 'Metro',
    regions: 'Regions',
    business: 'Business',
    world: 'World',
    weather: 'Weather',
    sports: 'Sports',
    entertainment: 'Entertainment',
    tech: 'Tech',
  } satisfies Record<CategorySlug, string>,
  whyItMatters: 'Why it matters',
  reportedBy: 'Reported by',
  outlets: (n: number) => (n === 1 ? '1 outlet' : `${n} outlets`),
  readOriginals: 'Read the original reports',
  aiNotice:
    'This is an AI-generated summary of the reports listed below. Names and numbers are checked against the sources, but read the originals for full details.',
  published: 'Published',
  updated: 'Updated',
  noStories: 'No stories here yet. New summaries are added every 30 minutes.',
  backHome: 'Back to top stories',
  readSummary: 'Read summary',
  switchLanguage: 'Filipino',
  switchLanguageLabel: 'Basahin sa Filipino',
  about: 'How it works',
  corrections: 'Corrections',
  reportError: 'Spotted an error?',
  reportErrorCta: 'Tell us',
  footerNote:
    'Buod Daily summarizes reporting by Philippine news outlets. We do not republish their articles: every summary links to the original reports.',
  notFoundTitle: 'Story not found',
  notFoundBody: 'It may have been removed or the link is wrong.',
  sensitive: 'Developing story',
} as const;

type Dictionary = {
  [K in keyof typeof en]: (typeof en)[K] extends (...args: infer A) => infer R
    ? (...args: A) => R
    : (typeof en)[K] extends Record<string, string>
      ? Record<keyof (typeof en)[K], string>
      : string;
};

const fil: Dictionary = {
  siteName: 'Buod Daily',
  tagline: 'Balita, buod na.',
  description:
    'Maikli at patas na buod ng mga balita sa Pilipinas, sa Ingles at Filipino, may link sa bawat orihinal na ulat.',
  topStories: 'Nangungunang balita',
  latest: 'Pinakabago',
  categories: {
    nation: 'Bansa',
    metro: 'Metro',
    regions: 'Probinsya',
    business: 'Negosyo',
    world: 'Mundo',
    weather: 'Panahon',
    sports: 'Isports',
    entertainment: 'Showbiz',
    tech: 'Teknolohiya',
  },
  whyItMatters: 'Bakit mahalaga',
  reportedBy: 'Iniulat ng',
  outlets: (n: number) => `${n} outlet`,
  readOriginals: 'Basahin ang orihinal na mga ulat',
  aiNotice:
    'Ito ay buod na ginawa ng AI mula sa mga ulat sa ibaba. Sinusuri ang mga pangalan at numero laban sa mga source, pero basahin ang orihinal para sa buong detalye.',
  published: 'Inilathala',
  updated: 'In-update',
  noStories: 'Wala pang balita rito. May bagong buod tuwing 30 minuto.',
  backHome: 'Bumalik sa nangungunang balita',
  readSummary: 'Basahin ang buod',
  switchLanguage: 'English',
  switchLanguageLabel: 'Read in English',
  about: 'Paano ito gumagana',
  corrections: 'Mga pagtatama',
  reportError: 'May nakitang mali?',
  reportErrorCta: 'Ipaalam sa amin',
  footerNote:
    'Binubuod ng Buod Daily ang mga ulat ng mga news outlet sa Pilipinas. Hindi namin muling inilalathala ang kanilang mga artikulo: may link sa orihinal ang bawat buod.',
  notFoundTitle: 'Hindi makita ang balita',
  notFoundBody: 'Maaaring inalis na ito o mali ang link.',
  sensitive: 'Umuunlad na balita',
};

const DICTIONARIES: Record<Locale, Dictionary> = { en: en as Dictionary, fil };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'fil' : 'en';
}

// Dates are always shown in Philippine time, whoever is reading.
export function formatDateTime(iso: string, locale: Locale): string {
  return (
    new Intl.DateTimeFormat(locale === 'fil' ? 'fil-PH' : 'en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso)) + ' PHT'
  );
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'fil' ? 'fil-PH' : 'en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}
