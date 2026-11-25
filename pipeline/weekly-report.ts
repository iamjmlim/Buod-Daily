// Weekly Buod Daily report: opens a GitHub issue (label "weekly-report") every Monday, which GitHub
// emails to the repo owner. Read-only: it changes nothing on the site, the Page or the newsletter.
//
//   npm run weekly-report             -> open the issue (needs GITHUB_TOKEN + GITHUB_REPOSITORY, set in Actions)
//   npm run weekly-report -- --print  -> print the report here instead
//
// Covers the 7 days before the run (Philippine time), compared with the 7 days before that.

import { check, getDb } from './lib/db.ts';

const PRINT = process.argv.includes('--print');
const REPO = process.env.GITHUB_REPOSITORY;
const GH_TOKEN = process.env.GITHUB_TOKEN;
const PAGE_ID = process.env.FB_PAGE_ID;
const FB_TOKEN = process.env.FB_PAGE_TOKEN;
const BUTTONDOWN_KEY = process.env.BUTTONDOWN_API_KEY;
const OWNER = (REPO ?? 'iamjmlim/Buod-Daily').split('/')[0];
const LABEL = 'weekly-report';
const DAY = 86_400_000;
const PHT = 8 * 3_600_000;

const db = getDb();

const phDate = (ms: number) => new Date(ms + PHT).toISOString().slice(0, 10);
const fmt = (iso: string) => new Intl.DateTimeFormat('en-PH', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(new Date(`${iso}T00:00:00Z`));
const change = (now: number, before: number) => (before === 0 ? (now > 0 ? 'new' : '–') : `${now >= before ? '+' : ''}${Math.round(((now - before) / before) * 100)}%`);

async function count(column: string, from: string, to: string, publishedOnly: boolean) {
  let q = db.from('stories').select('id', { count: 'exact', head: true }).gte(column, from).lt(column, to);
  if (publishedOnly) q = q.eq('status', 'published');
  const { count: n, error } = await q;
  if (error) throw new Error(`stories: ${error.message}`);
  return n ?? 0;
}

async function setting<T>(key: string): Promise<T | null> {
  const row = check(await db.from('settings').select('value').eq('key', key).maybeSingle(), key) as { value: T } | null;
  return row?.value ?? null;
}

async function pageFollowers(): Promise<number | null> {
  if (!PAGE_ID || !FB_TOKEN) return null;
  try {
    const res = await fetch(`https://graph.facebook.com/${PAGE_ID}?fields=followers_count,fan_count&access_token=${FB_TOKEN}`, { signal: AbortSignal.timeout(20_000) });
    const data = (await res.json()) as { followers_count?: number; fan_count?: number; error?: unknown };
    return res.ok && !data.error ? (data.followers_count ?? data.fan_count ?? null) : null;
  } catch {
    return null;
  }
}

/** Active subscribers of the email digest (Buttondown), or null if the key is missing or the call fails. */
async function newsletterSubscribers(): Promise<number | null> {
  if (!BUTTONDOWN_KEY) return null;
  try {
    const res = await fetch('https://api.buttondown.com/v1/subscribers?type=regular&page_size=1', {
      headers: { Authorization: `Token ${BUTTONDOWN_KEY}` },
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await res.json()) as { count?: number };
    return res.ok && typeof data.count === 'number' ? data.count : null;
  } catch {
    return null;
  }
}

async function github(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

async function failedRuns(since: string): Promise<string[]> {
  if (!REPO || !GH_TOKEN) return [];
  const data = (await github(`/actions/runs?status=failure&created=>=${since}&per_page=100`)) as { workflow_runs: { name: string }[] };
  const byName = new Map<string, number>();
  for (const r of data.workflow_runs) byName.set(r.name, (byName.get(r.name) ?? 0) + 1);
  return [...byName].map(([name, n]) => `${name}: ${n} failed run${n > 1 ? 's' : ''}`);
}

async function main() {
  const now = Date.now();
  const end = phDate(now); // today (PHT), not included
  const start = phDate(now - 7 * DAY);
  const prevStart = phDate(now - 14 * DAY);
  const at = (d: string) => new Date(Date.parse(`${d}T00:00:00Z`) - PHT).toISOString();

  const [published, publishedPrev, fbStories] = await Promise.all([
    count('published_at', at(start), at(end), true),
    count('published_at', at(prevStart), at(start), true),
    count('fb_posted_at', at(start), at(end), false),
  ]);
  const week = await setting<{ last_week?: string; last_posted_at?: string }>('fb_week_state');
  const inWeek = (iso?: string) => Boolean(iso && iso >= at(start) && iso < at(end));
  const [followers, subscribers, failures] = await Promise.all([
    pageFollowers(),
    newsletterSubscribers(),
    failedRuns(start).catch(() => ['(could not read workflow runs)']),
  ]);

  const lines: string[] = [];
  lines.push(`@${OWNER} here is Buod Daily's week, **${fmt(start)} – ${fmt(phDate(now - DAY))}** (Philippine time).`, '');

  lines.push('### Site', '');
  lines.push(`- Stories published: **${published}** (${change(published, publishedPrev)} vs the week before)`);
  if (subscribers !== null) lines.push(`- Email digest subscribers: **${subscribers}**`);
  lines.push('- Visits and top pages: see the Vercel dashboard (Analytics tab); Google searches: Search Console.', '');

  lines.push('### Facebook Page', '');
  if (followers !== null) lines.push(`- Followers: **${followers}**`);
  lines.push(`- Story posts: **${fbStories}**`);
  if (inWeek(week?.last_posted_at)) lines.push(`- Monday roundup posted (week of ${week?.last_week})`);
  lines.push('');

  lines.push('### Problems', '');
  lines.push(failures.length ? failures.map((f) => `- ⚠️ ${f}`).join('\n') : '- None: every scheduled job ran fine.', '');
  lines.push('_Automatic report. Read-only: nothing on the site, Page or newsletter was changed. Next week’s report closes this one._');

  const title = `Weekly report: ${fmt(start)} – ${fmt(phDate(now - DAY))}`;
  const body = lines.join('\n');
  if (PRINT || !REPO || !GH_TOKEN) {
    console.log(`${title}\n\n${body}`);
    return;
  }
  // Close last week's report, then open this one.
  const open = (await github(`/issues?state=open&labels=${LABEL}&per_page=20`)) as { number: number }[];
  for (const i of open) await github(`/issues/${i.number}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed' }) });
  const created = (await github('/issues', { method: 'POST', body: JSON.stringify({ title, body, labels: [LABEL] }) })) as { html_url: string };
  console.log(`Opened ${created.html_url}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
