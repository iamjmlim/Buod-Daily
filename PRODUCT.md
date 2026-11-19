# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

All three are primary:

- **Busy Filipinos on phones** catching up on Philippine news in short breaks, mostly on mobile data.
- **OFWs abroad** following news from home, often preferring Filipino.
- **International readers** who follow the Philippines and need short context on local agencies and terms.

Their job: understand what happened today in the Philippines quickly, in their language, and know which outlets reported it so they can read the originals.

## Product Purpose

Buod Daily ("buod" = summary) publishes short, neutral summaries of Philippine news in English and Filipino. Every 30 minutes it reads the RSS feeds of trusted PH outlets, groups reports of the same event, writes an original summary with AI, fact-checks names and numbers against the sources in code, and auto-publishes what passes. Success: readers trust it as an accurate, fast way to see the day's news and follow links to the outlets.

## Positioning

Neutral, multi-source summaries of Philippine news in English and Filipino, always linking every original report; no opinions, no copied articles. "Reported by N outlets" is the core trust signal.

## Operating Context

- Fully automatic publishing; one owner reviews after the fact in /admin (review log, unpublish with public correction note, kill switch, sources on/off).
- Stories update when more outlets report; corrected or withdrawn sources trigger re-checks or automatic removal with a note on the Corrections page.
- Routes: /en and /fil (home, category pages, story pages, About/How it works, Corrections, RSS).

## Capabilities and Constraints

- Next.js 16 (App Router, Cache Components) + Tailwind + shadcn/ui on Vercel Hobby; Supabase; pipeline on GitHub Actions; Gemini free tier with Groq backup. Must stay on free tiers (non-commercial until monetized).
- Never republish article text or outlet photos; no images in stories. Headlines and summaries are our own words.
- Every summary is labeled AI-generated. Claims are attributed. Sensitive/election stories need 3+ outlets.
- Sources today: GMA News, Inquirer.net, Philstar, Rappler, The Manila Times, BusinessWorld. No tier-1 (official wire) source yet.
- Times shown in Philippine time (PHT).
- Undecided: custom domain, contact email, monetization.

## Brand Commitments

- Name: **Buod Daily**. Taglines: "Philippine news, summarized." / "Balita, buod na."
- Voice: neutral, plain, factual; clear everyday Filipino (GMA/ABS-CBN Filipino style), English terms kept when Filipinos normally use them.

## Evidence on Hand

- Real published stories in Supabase, refreshed every 30 minutes.
- No testimonials, readership numbers, partnerships, or press. Do not fabricate any.

## Product Principles

1. Accuracy over speed: a story waits for more outlets rather than publishing on thin sourcing.
2. Always credit and link the outlets; we point to journalism, we don't replace it.
3. Equal footing for English and Filipino.
4. Transparency about automation: AI label, public corrections, how-it-works page.
5. Fast and light for readers on weak connections.

## Accessibility & Inclusion

- Must work well on older, low-cost Android phones and slow or metered mobile data: light pages, no heavy media.
- WCAG AA contrast; readable body text; system light/dark mode.
