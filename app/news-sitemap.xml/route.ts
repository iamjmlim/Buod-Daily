import { connection } from 'next/server';
import { getSitemapStories } from '@/lib/news';

// Google News sitemap: stories published in the last 2 days, one entry per language.
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const PUBLICATION = 'Buod Daily';

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET() {
  const stories = await getSitemapStories(300).catch(() => []);
  await connection(); // the 2-day window depends on the current time
  const since = Date.now() - 48 * 3_600_000;

  const entries = stories
    .filter((s) => Date.parse(s.publishedAt) >= since)
    .flatMap((s) =>
      s.headlines.map(
        (h) => `  <url>
    <loc>${SITE_URL}/${h.lang}/story/${xml(s.slug)}</loc>
    <news:news>
      <news:publication><news:name>${PUBLICATION}</news:name><news:language>${h.lang === 'fil' ? 'tl' : 'en'}</news:language></news:publication>
      <news:publication_date>${s.publishedAt}</news:publication_date>
      <news:title>${xml(h.headline)}</news:title>
    </news:news>
  </url>`,
      ),
    );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });
}
