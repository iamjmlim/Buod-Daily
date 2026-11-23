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
  navTop: 'Top stories',
  navLabel: 'Sections',
  skipToContent: 'Skip to stories',
  lastUpdated: 'Last updated',
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
  whyItMatters: 'Background',
  reportedBy: 'Reported by',
  outlets: (n: number) => (n === 1 ? '1 outlet' : `${n} outlets`),
  reportedByCount: (n: number) => (n === 1 ? 'Reported by 1 outlet' : `Reported by ${n} outlets`),
  readOriginals: 'Read the original reports',
  aiShort: 'AI-written summary, checked against the sources',
  aiNotice:
    'This summary was written by AI from the reports listed above. Names and numbers are checked against those reports, but read the originals for full details.',
  published: 'Published',
  updated: 'Updated',
  noStories: 'No stories in this section in the last few days. We only publish stories reported by at least two outlets, so some sections stay quiet.',
  noStoriesCta: 'See today’s top stories',
  weatherOfficial: 'Official forecasts and typhoon bulletins: PAGASA',
  moreIn: (section: string) => `More in ${section}`,
  backHome: 'Back to top stories',
  sectionDescription: (section: string) =>
    `${section} news from the Philippines, summarized in English and Filipino. Every story is reported by at least two outlets, with links to each original report.`,
  switchLanguage: 'Filipino',
  switchLanguageLabel: 'Basahin sa Filipino',
  themeToggle: 'Switch between light and dark mode',
  about: 'How it works',
  corrections: 'Corrections',
  reportError: 'Spotted an error?',
  reportErrorCta: 'Tell us',
  correctionsHow: 'See how corrections work',
  digestTitle: 'Top stories, every morning',
  digestBody: 'The day’s 5 best-sourced stories in your inbox at 7 AM Philippine time, in Filipino and English.',
  digestEmail: 'Your email',
  digestButton: 'Subscribe',
  digestNote: 'Free. One email a day. Unsubscribe anytime.',
  opensNewTab: '(opens in a new tab)',
  footerNote:
    'Buod Daily summarizes reporting by Philippine news outlets. We do not republish their articles: every summary links to the original reports.',
  notFoundTitle: 'Story not found',
  notFoundBody: 'It may have been removed or the link is wrong.',
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
  topStories: 'Ulo ng balita',
  navTop: 'Ulo ng balita',
  navLabel: 'Mga seksyon',
  skipToContent: 'Lumaktaw sa mga balita',
  lastUpdated: 'Huling update',
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
  whyItMatters: 'Konteksto',
  reportedBy: 'Iniulat ng',
  outlets: (n: number) => `${n} outlet`,
  reportedByCount: (n: number) => `Iniulat ng ${n} outlet`,
  readOriginals: 'Basahin ang orihinal na mga ulat',
  aiShort: 'Buod na isinulat ng AI, sinuri laban sa mga source',
  aiNotice:
    'Isinulat ng AI ang buod na ito mula sa mga ulat na nakalista sa itaas. Sinusuri ang mga pangalan at numero laban sa mga ulat na iyon, pero basahin ang orihinal para sa buong detalye.',
  published: 'Inilathala',
  updated: 'In-update',
  noStories: 'Walang balita sa seksyong ito nitong mga nakaraang araw. Naglalathala lang kami ng balitang iniulat ng hindi bababa sa dalawang outlet, kaya may mga seksyong tahimik.',
  noStoriesCta: 'Tingnan ang ulo ng balita',
  weatherOfficial: 'Opisyal na taya ng panahon at bulletin ng bagyo: PAGASA',
  moreIn: (section: string) => `Iba pa sa ${section}`,
  backHome: 'Bumalik sa ulo ng balita',
  sectionDescription: (section: string) =>
    `Balitang ${section} sa Pilipinas, binuod sa Filipino at English. Iniulat ng hindi bababa sa dalawang outlet ang bawat balita, may link sa bawat orihinal na ulat.`,
  switchLanguage: 'English',
  switchLanguageLabel: 'Read in English',
  themeToggle: 'Palitan ang light o dark mode',
  about: 'Paano ito gumagana',
  corrections: 'Mga pagtatama',
  reportError: 'May nakitang mali?',
  reportErrorCta: 'Ipaalam sa amin',
  correctionsHow: 'Alamin kung paano kami nagtatama',
  digestTitle: 'Ulo ng balita, tuwing umaga',
  digestBody: 'Ang 5 pinakamahalagang balita ng araw sa iyong inbox, 7 AM oras sa Pilipinas, sa Filipino at English.',
  digestEmail: 'Iyong email',
  digestButton: 'Mag-subscribe',
  digestNote: 'Libre. Isang email araw-araw. Puwedeng mag-unsubscribe anumang oras.',
  opensNewTab: '(magbubukas sa bagong tab)',
  footerNote:
    'Binubuod ng Buod Daily ang mga ulat ng mga news outlet sa Pilipinas. Hindi namin muling inilalathala ang kanilang mga artikulo: may link sa orihinal ang bawat buod.',
  notFoundTitle: 'Hindi makita ang balita',
  notFoundBody: 'Maaaring inalis na ito o mali ang link.',
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

export function formatTime(iso: string, locale: Locale): string {
  return (
    new Intl.DateTimeFormat(locale === 'fil' ? 'fil-PH' : 'en-PH', {
      timeZone: 'Asia/Manila',
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
