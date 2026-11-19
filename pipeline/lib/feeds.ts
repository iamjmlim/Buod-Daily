import Parser from 'rss-parser';
import { canonicalizeUrl } from './url.ts';

export type FeedItem = {
  url: string;
  canonicalUrl: string;
  title: string;
  snippet: string | null;
  publishedAt: Date | null;
};

export type FetchResult =
  | { status: 'ok'; items: FeedItem[]; etag: string | null; lastModified: string | null }
  | { status: 'not-modified' }
  | { status: 'error'; error: string };

const USER_AGENT = 'Mozilla/5.0 (compatible; BuodDaily/0.1; RSS reader)';
const TIMEOUT_MS = 20_000;
const MAX_SNIPPET = 400;

const parser = new Parser();

function cleanText(html: string | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#8230;|&hellip;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;
  return text.length > MAX_SNIPPET ? text.slice(0, MAX_SNIPPET - 1) + '…' : text;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function fetchFeed(
  feedUrl: string,
  cache: { etag?: string | null; lastModified?: string | null } = {},
): Promise<FetchResult> {
  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  };
  if (cache.etag) headers['If-None-Match'] = cache.etag;
  if (cache.lastModified) headers['If-Modified-Since'] = cache.lastModified;

  let res: Response;
  try {
    res = await fetch(feedUrl, { headers, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    return { status: 'error', error: `network: ${(err as Error).message}` };
  }
  if (res.status === 304) return { status: 'not-modified' };
  if (!res.ok) return { status: 'error', error: `HTTP ${res.status}` };

  const body = await res.text();
  let feed;
  try {
    feed = await parser.parseString(body);
  } catch (err) {
    return { status: 'error', error: `parse: ${(err as Error).message.slice(0, 200)}` };
  }

  const items: FeedItem[] = [];
  for (const item of feed.items ?? []) {
    const url = item.link?.trim();
    const title = cleanText(item.title);
    if (!url || !title) continue;
    const canonicalUrl = canonicalizeUrl(url);
    if (!canonicalUrl) continue;
    items.push({
      url,
      canonicalUrl,
      title,
      snippet: cleanText(item.contentSnippet ?? item.summary ?? item.content),
      publishedAt: parseDate(item.isoDate ?? item.pubDate),
    });
  }

  return {
    status: 'ok',
    items,
    etag: res.headers.get('etag'),
    lastModified: res.headers.get('last-modified'),
  };
}
