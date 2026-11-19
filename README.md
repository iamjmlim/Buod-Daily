# Buod Daily

*Philippine news, summarized. Balita, buod na.*

Automatic Philippine news site: collects headlines from trusted PH outlets' RSS feeds,
groups the same story across outlets, and (from week 2) publishes short AI summaries in
English and Filipino with links back to every source.

Full design: [docs/MVP-DESIGN.md](docs/MVP-DESIGN.md)

## Status

- [x] Week 1: feed ingest, duplicate skipping, story grouping, GitHub Actions schedule
- [x] Week 2: AI summaries + Filipino translation + quality gate (Gemini, Groq backup)
- [x] Week 3: Next.js website (shadcn/ui), EN/FIL, admin review log (deploy to Vercel)
- [ ] Week 4: story updates + corrections automation

## Try it without any accounts

```bash
npm install
npm run ingest:dry
```

This reads every feed and prints the articles and grouped stories. Nothing is saved.

## Connect Supabase (one time)

1. Create a free project at supabase.com.
2. **SQL Editor** → paste `supabase/migrations/0001_init.sql` → **Run**.
3. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
4. `npm run ingest` to store real articles.

## Turn on the 30-minute schedule

1. Push this folder to a **public** GitHub repo (Actions minutes are free for public repos).
2. Repo → Settings → Secrets and variables → Actions → add `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`.
3. Actions tab → **News pipeline** → **Run workflow** to test it once.

## Scripts

| Command | What it does |
|---|---|
| `npm run ingest:dry` | Read feeds, print results, save nothing |
| `npm run ingest` | Read feeds and save to Supabase (needs `.env.local`) |
| `npm run typecheck` | TypeScript check |
| `npm run dev` | Website (placeholder until week 3) |

Feeds are configured in `pipeline/sources.ts`.
