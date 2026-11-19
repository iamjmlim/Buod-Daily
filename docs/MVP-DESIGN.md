# Buod Daily — MVP Design

> *Philippine news, summarized. Balita, buod na.*
> Status: Draft v0.1 · 2026-11-19

## 1. Concept

An automatic website for Philippine news. It collects headlines from a fixed list of trusted PH outlets, groups articles about the same story, writes a short original summary in **English and Filipino**, and publishes it with prominent links back to every source.

- **Audience:** Filipinos in the Philippines and abroad (OFWs), plus international readers who follow the Philippines.
- **What we publish:** headline, 3–5 sentence summary in our own words, a "why it matters" line, and links to the original outlets.
- **What we never publish:** full article text, copied paragraphs, or the outlets' photos.

**Why this is useful:** one place to see what's happening in PH, in both languages, plus "reported by 4 outlets" signals that show how widely a story is covered.

## 2. Legal and trust ground rules (decide these first)

| Rule | Why |
|---|---|
| Use **RSS feeds / official APIs** to collect; don't crawl around paywalls or logins | Lower legal and blocking risk; respects the outlets' terms |
| Publish **only our own summary + headline + link** | Republishing articles is copyright infringement (RA 8293). Short original summaries with attribution are much safer |
| Read the full text only to write the summary; **don't store or show it** | Keeps us a pointer to the source, not a copy |
| **No source images** in the MVP; use category illustrations | Photos are copyrighted separately |
| Label every summary **"AI-generated summary — read the original"** | Honesty; Google and readers both expect it |
| Publish a **corrections page** and a contact email | Automatic publishing will make mistakes, so fix them in public |
| Check each outlet's terms of use before adding it; remove any outlet that objects | Some outlets restrict reuse even of their feeds |

## 3. Sources (MVP list, ~8–10 feeds)

Start small and reliable. Verify each feed URL and its terms before adding it.

Live in week 1 (feeds checked 2026-11-19):

| Outlet | Type |
|---|---|
| GMA News Online | National |
| Inquirer.net | National |
| Philstar | National |
| Rappler | National |
| The Manila Times | National |
| BusinessWorld | Business |

Left out for now:
- **PNA**: no public RSS feed found. This means there's no tier-1 source yet, so every story needs 2+ outlets to auto-publish.
- **ABS-CBN, Manila Bulletin, PIA**: they block automated feed readers (HTTP 403). We respect that rather than disguising the reader as a browser.
- **PAGASA**: weather alerts need a separate adapter (week 3, for the typhoon banner).

Each source gets a **trust tier** (1 = wire/official, 2 = major national) and an on/off switch, so a bad feed can be turned off without a deploy.

## 4. Architecture

```
     every 30 min (GitHub Actions)
                 |
   +-------------v--------------+
   | 1. INGEST                  |  RSS fetch -> parse -> normalize URL
   +-------------+--------------+
                 v
   +----------------------------+
   | 2. DEDUPE + CLUSTER        |  same URL? same story from other outlets?
   +-------------+--------------+  (title similarity -> embeddings later)
                 v
   +----------------------------+
   | 3. CLASSIFY                |  category, sensitivity flag, importance
   +-------------+--------------+
                 v
   +----------------------------+
   | 4. SUMMARIZE (LLM)         |  English summary + "why it matters"
   |    TRANSLATE (LLM)         |  Filipino version
   +-------------+--------------+
                 v
   +----------------------------+
   | 5. QUALITY GATE            |  grounding check, length, banned topics
   +------+--------------+------+
          | pass         | fail
          v              v
   +-------------+  +-----------------------------+
   | 6. PUBLISH  |  | rewrite once -> else SKIP   |  (retried when more
   | (automatic) |  | and log; never published    |   outlets report it)
   +------+------+  +-----------------------------+
          v
   Website (EN/FIL) · RSS out · sitemap · (later) FB Page, newsletter
```

### Components

| Part | Tech | Notes |
|---|---|---|
| Website + admin | **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**, polished with the **Impeccable** design skill |  Server-rendered story pages with ISR (`revalidate`) for SEO and FB link previews; `/[locale]/...` routes for EN/FIL |
| Pipeline | Node.js + TypeScript scripts in `pipeline/`, using `rss-parser` (+ `@mozilla/readability` in week 2) | Runs as a normal script, so there are no serverless time limits |
| Scheduler | **GitHub Actions** scheduled workflow, every 30 min | Free and unlimited for a **public** repo. Runs may start a few minutes late; GitHub disables schedules after 60 days with no commits, so a small keep-alive commit runs monthly |
| Database | Supabase (Postgres), free tier | 500 MB is years of text. Also acts as the job queue: stories carry a `status` |
| AI | **Gemini API free tier** (`gemini-flash-lite-latest`, then `gemini-flash-latest`), behind one `AI_PROVIDER` setting. **Groq free tier** (`openai/gpt-oss-120b`) is the backup and takes over immediately when Gemini is busy. (GitHub Models was retired 2026-07-30.) | **One call per story** (summary + Filipino + "why it matters" in one JSON). Top ~50–100 stories/day to stay in free limits. Switching to Claude or paid Gemini later is a settings change |
| Hosting | **Vercel Hobby** (website only) at `*.vercel.app` | Free but non-commercial. When adding ads: Vercel Pro, or Cloudflare Pages (free plan allows commercial use) |
| Monitoring | GitHub's email on failed workflow runs + UptimeRobot free | Know when a feed or the site breaks |

**Free-tier rules to design around:**
- Every step must be safe to run twice. Unique `canonical_url` and status transitions mean a late or repeated run never duplicates stories.
- The pipeline writes to Supabase; the site reads from it. After publishing, the pipeline calls a secret Vercel revalidate URL so new stories show up without a redeploy.
- AI calls have a daily cap in code that matches the free tier's limit. When reached, the remaining stories wait for the next day.
- The repo is public, so **secrets live only in GitHub Actions secrets and Vercel env vars**, never in code.

## 5. Pipeline details

### 5.1 Ingest
- Poll each active feed every 30 minutes and respect `ETag` / `Last-Modified`.
- Canonicalize URLs (strip `utm_*` and similar) so duplicates match.
- Store: source, URL, title, published time, feed snippet.

### 5.2 Dedupe and cluster
- Exact duplicate → same canonical URL.
- Same story, different outlet → title similarity above a threshold within a 36-hour window joins an existing **story**.
- A story shows "Reported by N outlets", which is the main trust signal.
- Later: switch to embeddings for better matching.

### 5.3 Classify
LLM or rules assign:
- **Category:** Nation, Metro, Regions, Business, World, Weather, Sports, Entertainment, Tech.
- **Sensitivity:** `normal` / `sensitive`. Sensitive covers deaths and disasters with casualties, crimes involving minors, elections and candidates, health claims, legal accusations against named people, and suicide.
- **Importance score:** number of outlets × source tier × recency.

### 5.4 Summarize and translate
- Input: the article text, fetched once for summarizing and then discarded (or the feed snippet if fetching isn't allowed).
- Output (JSON):
  - `headline_en`: our own headline, not the outlet's
  - `summary_en`: 3–5 sentences, neutral tone, no opinions
  - `why_it_matters_en`: one line with context for global readers (e.g. explains what "DPWH" or "barangay" means)
  - `headline_fil`, `summary_fil`, `why_it_matters_fil`: natural, conversational Filipino, not word-for-word
- Prompt rules: only facts that are in the source; attribute claims ("according to PNP…"); no speculation; keep names, numbers and dates exact.

### 5.5 Quality gate (fully automatic, no human approval)
Every story is published automatically from day one. The gate decides **how** it is published or whether it is skipped. Nothing waits for a person.

**Checks every story must pass:**
1. **Grounding check:** every number, name and date in the summary appears in the source text (done in code, so it costs no AI calls).
2. Length and format within limits; valid JSON.

**Publishing rules by sensitivity:**

| Story type | Auto-publish rule |
|---|---|
| `normal` | At least 1 tier-1 source **or** 2+ outlets |
| `sensitive` (deaths, crime, health, accusations) | 2+ outlets including a tier-1 source; written with a stricter, attribution-only prompt |
| Elections / candidates | Same as sensitive, plus a fixed "Developing story — see sources" label |

**If a check fails:**
- Rewrite once automatically with the error fed back to the model.
- If it fails again, **skip the story and log it**. It is retried when more outlets report it, since a bigger cluster gives more source text.
- Nothing is published with a failed grounding check.

**After publishing (still automatic):**
- When new articles join a published story, the summary is regenerated and marked "Updated".
- If a source pulls or corrects its article (feed item removed or title changed to "CORRECTION"), the story is re-checked and unpublished if it no longer passes.

**Safety valves you can use, but don't have to:**
- **Kill switch:** one toggle pauses all publishing.
- **Unpublish button** on every story, with an automatic entry on the Corrections page.
- **Review log:** a list of everything published in the last 24h to skim when you have time.

## 6. Data model (Postgres)

```
sources        id, name, feed_url, homepage, tier, language, active, last_fetched_at
articles       id, source_id, url, canonical_url (unique), title, snippet,
               published_at, fetched_at, story_id
stories        id, category, importance, sensitivity, status
               (pending | skipped | published | unpublished), first_seen_at, published_at
summaries      id, story_id, lang (en|fil), headline, summary, why_it_matters,
               model, prompt_version, created_at
quality_checks id, story_id, check_name, passed, details
corrections    id, story_id, note, created_at
```

## 7. MVP features

### Reader site
- [ ] Home: latest stories, sorted by importance and recency
- [ ] Category pages
- [ ] Story page: summary, "why it matters", list of source links ("Read on GMA · Inquirer · PNA"), timestamps in PHT
- [ ] Language toggle **EN / FIL** with separate URLs (`/en/...`, `/fil/...`) and `hreflang` tags
- [ ] Typhoon/weather banner from PAGASA advisories
- [ ] Mobile-first, fast, works on slow connections
- [ ] RSS feed out, sitemap, Open Graph tags for FB sharing
- [ ] About, How it works, Corrections, and Contact pages

### Admin (just you)
- [ ] Review log: last 24h of published + skipped stories, with unpublish / edit buttons
- [ ] Source list: enable/disable, tier
- [ ] Kill switch for auto-publishing
- [ ] Pipeline health: last fetch per source, error count, AI calls used today vs. free limit

### Out of scope for the MVP
User accounts, comments, push notifications, newsletter, a mobile app, auto-posting to social media, personalization, ads. Add these once people are actually reading.

## 8. Project structure

```
news-aggregator/            # public GitHub repo
  docs/MVP-DESIGN.md
  .github/workflows/
    pipeline.yml            # every 30 min: ingest -> cluster -> summarize -> publish
  pipeline/                 # Node scripts run by GitHub Actions
    sources.ts              # feed config
    ingest.ts
    lib/                    # url canonicalizing, feed fetching, db helpers
    ai/                     # provider switch (gemini | github | claude) + prompts
  app/                      # Next.js site on Vercel (week 3)
    [locale]/               # en | fil
    admin/                  # review log, sources, kill switch (password-protected)
    api/revalidate/route.ts # called by the pipeline after publishing
  supabase/migrations/      # SQL tables
  .env.example
```

## 9. Build plan

| Week | Goal | Done when |
|---|---|---|
| 1 | Ingest + dedupe into Supabase | 8 feeds stored with no duplicates for 3 days |
| 2 | Summarize + translate + quality gate | Gate runs on real stories; spot-check 50 of them and tune prompts until ≥ 90% read well |
| 3 | Next.js site (EN/FIL) + admin review log on Vercel | Site live on `*.vercel.app`, **auto-publishing** every story that passes the gate |
| 4 | Updates + corrections automation | Stories refresh as outlets add reports; pulled sources trigger re-checks |
| 5+ | Clustering via embeddings, FB Page posting, newsletter | — |

Week 2's spot-check is tuning, not approval: once the site is live, nothing waits for you.

## 10. Monthly cost (MVP): $0

| Item | Cost |
|---|---|
| GitHub (public repo) + Actions | Free |
| Supabase | Free tier (free projects pause after a week of inactivity; the 30-min pipeline keeps it active) |
| Vercel Hobby | Free while non-commercial |
| AI: Gemini free tier + Groq free tier (backup) | Free, within daily limits |
| UptimeRobot | Free |

**When it would start costing money:**
- Own domain (optional): ~₱600–1,200/year for a .com
- Adding ads/sponsors: Vercel Pro (~US$20/month) or move to Cloudflare Pages
- Outgrowing free AI limits: switch `AI_PROVIDER` to Claude or paid Gemini (prepaid, per-story cost)

## 11. Risks

| Risk | Mitigation |
|---|---|
| AI summary gets a fact wrong | Grounding check, stricter multi-source rule for sensitive topics, one-click unpublish, corrections page |
| An outlet objects | Per-source switch; reply quickly and remove them |
| Feed format changes or breaks | Health dashboard + daily email |
| A scheduled run is late or fails | Idempotent steps; the next run picks up the rest |
| Free AI tier lowers limits or changes terms | `AI_PROVIDER` switch with a backup provider; daily cap in code |
| Thin AI content hurts Google ranking | Add real value: multi-source clustering, context lines, bilingual |
| Election-season misinformation | Election stories need 2+ outlets incl. tier-1, attribution-only prompt, "Developing story" label |
| Secrets leak from the public repo | Keys only in GitHub/Vercel secrets; `.env*` git-ignored |

## 12. Open decisions

- [x] Project name: **Buod Daily**
- [ ] Domain and social handles (check `buoddaily.com` / `buoddaily.ph`, `@buoddaily`)
- [ ] Final source list (after checking each outlet's terms)
- [ ] Filipino style: formal Tagalog or conversational Taglish?
- [ ] For `normal` stories: is one tier-1 source (PNA, PAGASA) enough, or require 2+ outlets? (Current default: tier-1 alone is enough.)
