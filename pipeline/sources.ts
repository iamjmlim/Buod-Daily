// Feed list. New entries are added to the database on the next run;
// after that, `active` and `tier` are managed in the database (admin page),
// so editing them here does not overwrite your changes.

export type SourceConfig = {
  slug: string;
  name: string;
  feedUrl: string;
  homepage: string;
  tier: 1 | 2; // 1 = wire/official, 2 = major national outlet
  language: 'en' | 'fil';
};

// Checked 2026-11-19 and left out on purpose:
// - Philippine News Agency (pna.gov.ph): no public RSS feed found
// - ABS-CBN News, Manila Bulletin, PIA: block automated feed readers (HTTP 403).
//   We respect that instead of pretending to be a browser.

export const SOURCES: SourceConfig[] = [
  {
    slug: 'gma',
    name: 'GMA News',
    feedUrl: 'https://data.gmanetwork.com/gno/rss/news/feed.xml',
    homepage: 'https://www.gmanetwork.com/news/',
    tier: 2,
    language: 'en',
  },
  {
    slug: 'inquirer',
    name: 'Inquirer.net',
    feedUrl: 'https://newsinfo.inquirer.net/feed',
    homepage: 'https://newsinfo.inquirer.net',
    tier: 2,
    language: 'en',
  },
  {
    slug: 'philstar',
    name: 'Philstar',
    feedUrl: 'https://www.philstar.com/rss/headlines',
    homepage: 'https://www.philstar.com',
    tier: 2,
    language: 'en',
  },
  {
    slug: 'rappler',
    name: 'Rappler',
    feedUrl: 'https://www.rappler.com/feed/',
    homepage: 'https://www.rappler.com',
    tier: 2,
    language: 'en',
  },
  {
    slug: 'manilatimes',
    name: 'The Manila Times',
    feedUrl: 'https://www.manilatimes.net/news/feed',
    homepage: 'https://www.manilatimes.net',
    tier: 2,
    language: 'en',
  },
  {
    slug: 'bworld',
    name: 'BusinessWorld',
    feedUrl: 'https://www.bworldonline.com/feed/',
    homepage: 'https://www.bworldonline.com',
    tier: 2,
    language: 'en',
  },
];
