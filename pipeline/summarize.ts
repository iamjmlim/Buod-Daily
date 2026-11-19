// Step 3-6 of the pipeline: for the most important pending stories, read the
// articles, ask the AI for an English + Filipino summary, run the quality gate,
// and auto-publish the ones that pass.
//
//   npm run summarize               -> summarize + publish
//   npm run summarize -- --dry-run  -> call the AI and print results, save nothing
//
// Settings (env vars, all optional except the provider key):
//   AI_PROVIDER=gemini|groq     AI_FALLBACK_PROVIDER=groq|gemini
//   AI_DAILY_LIMIT=100          max AI calls per day (Philippine time), all providers
//   STORIES_PER_RUN=6           stories handled per run
//   MIN_OUTLETS=2               outlets needed for a normal story (without a tier-1 source)

import { check, getDb } from './lib/db.ts';
import { fetchArticleText } from './lib/article.ts';
import { groundingChecks, meetsSourceRule, parseDraft, type CheckResult, type SummaryDraft } from './lib/gate.ts';
import { AiError, callProvider, configuredProviders, type AiResponse } from './ai/providers.ts';
import { buildUserPrompt, PROMPT_VERSION, SUMMARY_SYSTEM_PROMPT, type SourceForPrompt } from './ai/prompts.ts';

const DRY_RUN = process.argv.includes('--dry-run');
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 100);
const STORIES_PER_RUN = Number(process.env.STORIES_PER_RUN ?? 6);
const MIN_OUTLETS = Number(process.env.MIN_OUTLETS ?? 2);
const MAX_SOURCES_PER_STORY = 4;
const MAX_ATTEMPTS = 2; // first try + one automatic rewrite
const CANDIDATE_WINDOW_HOURS = 36;

const db = getDb();

type StoryRow = {
  id: string;
  importance: number;
  articles: {
    title: string;
    snippet: string | null;
    url: string;
    published_at: string;
    sources: { name: string; slug: string; tier: number } | null;
  }[];
};

function philippineDate(d = new Date()): string {
  return new Date(d.getTime() + 8 * 3_600_000).toISOString().slice(0, 10);
}

async function callsUsedToday(): Promise<number> {
  const rows = check(await db.from('ai_usage').select('calls').eq('day', philippineDate()), 'read ai usage') as {
    calls: number;
  }[];
  return rows.reduce((sum, r) => sum + r.calls, 0);
}

async function recordCall(provider: string) {
  if (DRY_RUN) return;
  const day = philippineDate();
  const existing = check(
    await db.from('ai_usage').select('calls').eq('day', day).eq('provider', provider).maybeSingle(),
    'read usage row',
  ) as { calls: number } | null;
  check(
    await db.from('ai_usage').upsert({ day, provider, calls: (existing?.calls ?? 0) + 1 }),
    'record ai call',
  );
}

// Stops the run. `fatal` = needs your attention (bad key, unknown model);
// otherwise it's temporary (limit reached, AI overloaded) and the next run retries.
class OutOfCalls extends Error {
  readonly fatal: boolean;
  constructor(message: string, fatal = false) {
    super(message);
    this.fatal = fatal;
  }
}

let callsLeft = 0;

// Calls the main provider, falling back to the backup on rate limits or outages.
async function askAi(user: string): Promise<AiResponse> {
  let lastError: unknown = null;
  for (const provider of configuredProviders()) {
    if (callsLeft <= 0) throw new OutOfCalls('Daily AI limit reached');
    try {
      callsLeft--;
      const res = await callProvider(provider, { system: SUMMARY_SYSTEM_PROMPT, user });
      await recordCall(provider);
      return res;
    } catch (err) {
      lastError = err;
      if (err instanceof AiError && err.status !== null) await recordCall(provider); // the request still counted
      console.warn(`   ${provider} failed: ${(err as Error).message.replace(/\s+/g, ' ').slice(0, 160)}`);
    }
  }
  if (lastError instanceof AiError && lastError.isRateLimit) throw new OutOfCalls('All AI providers are rate-limited');
  if (lastError instanceof AiError && lastError.isConfigError) {
    throw new OutOfCalls(`AI provider setup problem, fix it before the next run: ${lastError.message.slice(0, 200)}`, true);
  }
  throw lastError;
}

function slugify(headline: string, id: string): string {
  const base = headline
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  // Cut at ~70 characters on a word boundary, never mid-word.
  const short = base.length <= 70 ? base : base.slice(0, 71).replace(/-[^-]*$/, '');
  return `${short}-${id.slice(0, 6)}`;
}

async function gatherSources(story: StoryRow): Promise<SourceForPrompt[]> {
  // One article per outlet (the newest), most important outlets first.
  const perOutlet = new Map<string, StoryRow['articles'][number]>();
  for (const a of [...story.articles].sort((x, y) => y.published_at.localeCompare(x.published_at))) {
    const slug = a.sources?.slug ?? a.url;
    if (!perOutlet.has(slug)) perOutlet.set(slug, a);
  }
  const chosen = [...perOutlet.values()]
    .sort((x, y) => (x.sources?.tier ?? 2) - (y.sources?.tier ?? 2))
    .slice(0, MAX_SOURCES_PER_STORY);

  return Promise.all(
    chosen.map(async (a) => {
      const full = await fetchArticleText(a.url);
      return {
        outlet: a.sources?.name ?? 'Unknown outlet',
        title: a.title,
        text: full ?? a.snippet ?? a.title,
        isFullText: full !== null,
      };
    }),
  );
}

type Outcome =
  | { kind: 'published'; draft: SummaryDraft; model: string }
  | { kind: 'skipped'; reason: string; draft?: SummaryDraft };

async function processStory(story: StoryRow, outletInfo: { outlets: number; tier1: number }) {
  const sources = await gatherSources(story);
  const sourceText = sources.map((s) => `${s.title}\n${s.text}`).join('\n\n');
  const checks: CheckResult[] = [];
  let feedback: string | undefined;
  let outcome: Outcome | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !outcome; attempt++) {
    const res = await askAi(buildUserPrompt(sources, feedback));
    const { draft, problems } = parseDraft(res.text);

    if (draft?.skip) {
      outcome = { kind: 'skipped', reason: `ai_skip: ${draft.skip_reason || 'not suitable'}` };
      break;
    }
    const grounding = draft && problems.length === 0 ? groundingChecks(draft, sourceText) : [];
    const failed = [...problems, ...grounding.filter((c) => !c.passed).map((c) => c.details!)];

    checks.push(
      { name: `attempt_${attempt}_format`, passed: problems.length === 0, details: problems.join(' ') || undefined },
      ...grounding.map((c) => ({ ...c, name: `attempt_${attempt}_${c.name}` })),
    );

    if (failed.length === 0 && draft) {
      outcome = meetsSourceRule(draft.sensitivity, outletInfo, MIN_OUTLETS)
        ? { kind: 'published', draft, model: `${res.provider}:${res.model}` }
        : { kind: 'skipped', reason: `needs_more_outlets: ${draft.sensitivity} story has ${outletInfo.outlets}`, draft };
    } else if (attempt === MAX_ATTEMPTS) {
      outcome = { kind: 'skipped', reason: `quality: ${failed.join(' | ')}`.slice(0, 500), draft };
    } else {
      feedback = failed.map((f) => `- ${f}`).join('\n');
    }
  }
  return { outcome: outcome!, checks, sources };
}

async function main() {
  const settings = check(
    await db.from('settings').select('value').eq('key', 'publishing_enabled').maybeSingle(),
    'read settings',
  ) as { value: unknown } | null;
  if (settings && settings.value === false) {
    console.log('Publishing is paused (kill switch). Nothing to do.');
    return;
  }

  const used = await callsUsedToday();
  callsLeft = DAILY_LIMIT - used;
  console.log(`${DRY_RUN ? 'DRY RUN. ' : ''}AI calls today: ${used}/${DAILY_LIMIT}. Providers: ${configuredProviders().join(' -> ')}`);
  if (callsLeft <= 0) {
    console.log('Daily AI limit reached; remaining stories wait for tomorrow.');
    return;
  }

  const since = new Date(Date.now() - CANDIDATE_WINDOW_HOURS * 3_600_000).toISOString();
  const stories = check(
    await db
      .from('stories')
      .select('id, importance, articles(title, snippet, url, published_at, sources(name, slug, tier))')
      .eq('status', 'pending')
      .gte('updated_at', since)
      .order('importance', { ascending: false })
      .limit(300),
    'load pending stories',
  ) as unknown as StoryRow[];

  const eligible = stories
    .map((s) => {
      const tiers = new Map(s.articles.map((a) => [a.sources?.slug ?? a.url, a.sources?.tier ?? 2]));
      const info = { outlets: tiers.size, tier1: [...tiers.values()].filter((t) => t === 1).length };
      return { story: s, info };
    })
    .filter(({ info }) => info.tier1 >= 1 || info.outlets >= MIN_OUTLETS)
    .slice(0, STORIES_PER_RUN);

  console.log(`${stories.length} pending stories, ${eligible.length} eligible this run (need ${MIN_OUTLETS}+ outlets).\n`);

  const run = DRY_RUN
    ? null
    : (check(await db.from('pipeline_runs').insert({ step: 'summarize' }).select('id').single(), 'start run') as {
        id: string;
      });
  const stats = {
    eligible: eligible.length,
    published: 0,
    skipped: 0,
    errors: 0, // AI temporarily unavailable for a story (retried next run)
    bugs: 0, // anything else (database, code): needs attention
    stoppedEarly: false,
    needsAttention: false,
  };
  let failuresInARow = 0;

  for (const { story, info } of eligible) {
    // If the AI keeps failing, stop and let the next scheduled run try again.
    if (failuresInARow >= 2) {
      console.log('Stopping: AI providers are unavailable right now; the next run will retry.');
      stats.stoppedEarly = true;
      break;
    }
    try {
      const { outcome, checks, sources } = await processStory(story, info);
      failuresInARow = 0;
      const fullTexts = sources.filter((s) => s.isFullText).length;
      const label = `${info.outlets} outlets, ${fullTexts}/${sources.length} full texts`;

      if (outcome.kind === 'published') {
        stats.published++;
        const d = outcome.draft;
        console.log(`✓ PUBLISH [${d.category}/${d.sensitivity}] (${label})`);
        console.log(`   EN : ${d.headline_en}\n        ${d.summary_en}\n        Why: ${d.why_it_matters_en}`);
        console.log(`   FIL: ${d.headline_fil}\n        ${d.summary_fil}\n        Bakit: ${d.why_it_matters_fil}\n`);
      } else {
        stats.skipped++;
        console.log(`✗ SKIP (${label}): ${outcome.reason}`);
        if (outcome.draft?.headline_en) console.log(`   draft: ${outcome.draft.headline_en}`);
        console.log('');
      }
      if (DRY_RUN) continue;

      if (checks.length) {
        check(
          await db.from('quality_checks').insert(
            checks.map((c) => ({ story_id: story.id, check_name: c.name, passed: c.passed, details: c.details ?? null })),
          ),
          'save checks',
        );
      }

      if (outcome.kind === 'published') {
        const d = outcome.draft;
        const common = { story_id: story.id, model: outcome.model, prompt_version: PROMPT_VERSION };
        check(
          await db.from('summaries').upsert(
            [
              { ...common, lang: 'en', headline: d.headline_en, summary: d.summary_en, why_it_matters: d.why_it_matters_en },
              { ...common, lang: 'fil', headline: d.headline_fil, summary: d.summary_fil, why_it_matters: d.why_it_matters_fil },
            ],
            { onConflict: 'story_id,lang' },
          ),
          'save summaries',
        );
        check(
          await db
            .from('stories')
            .update({
              status: 'published',
              slug: slugify(d.headline_en, story.id),
              category: d.category,
              sensitivity: d.sensitivity,
              skip_reason: null,
              published_at: new Date().toISOString(),
            })
            .eq('id', story.id),
          'publish story',
        );
      } else {
        check(
          await db
            .from('stories')
            .update({
              status: 'skipped',
              skip_reason: outcome.reason,
              ...(outcome.draft?.category ? { category: outcome.draft.category } : {}),
              ...(outcome.draft?.sensitivity ? { sensitivity: outcome.draft.sensitivity } : {}),
            })
            .eq('id', story.id),
          'skip story',
        );
      }
    } catch (err) {
      if (err instanceof OutOfCalls) {
        console.log(`Stopping: ${err.message}.`);
        stats.stoppedEarly = true;
        if (err.fatal) stats.needsAttention = true;
        break;
      }
      if (err instanceof AiError) {
        stats.errors++;
        failuresInARow++;
      } else {
        stats.bugs++;
      }
      console.error(`! Error on story ${story.id}: ${(err as Error).message.replace(/\s+/g, ' ').slice(0, 200)}`);
    }
  }

  if (run) {
    await db
      .from('pipeline_runs')
      .update({ finished_at: new Date().toISOString(), ok: stats.errors === 0, stats })
      .eq('id', run.id);
  }
  console.log('Done:', stats);
  // Fail the GitHub run (so you get an email) only when something needs fixing.
  // A busy free AI tier is normal: those stories simply wait for the next run.
  if (stats.needsAttention || stats.bugs > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
