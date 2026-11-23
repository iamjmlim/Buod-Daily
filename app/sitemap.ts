import type { MetadataRoute } from 'next';
import { CATEGORY_SLUGS, LOCALES } from '@/lib/i18n';
import { getSitemapStories } from '@/lib/news';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stories = await getSitemapStories(500).catch(() => []);
  const newest = stories[0]?.updatedAt;
  // Home and section pages change whenever a story is published; stories carry their own last change.
  const pages: { path: string; lastModified?: string }[] = [
    { path: '', lastModified: newest },
    { path: '/about' },
    { path: '/corrections' },
    ...CATEGORY_SLUGS.map((c) => ({ path: `/${c}`, lastModified: newest })),
    ...stories.map((s) => ({ path: `/story/${s.slug}`, lastModified: s.updatedAt })),
  ];

  return pages.flatMap(({ path, lastModified }) =>
    LOCALES.map((lang) => ({
      url: `${SITE_URL}/${lang}${path}`,
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
    })),
  );
}
