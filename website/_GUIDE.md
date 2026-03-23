# Website — guide

This folder will contain the **thezorafiles.com** Next.js project. It's not initialized yet — that happens when we're ready to build.

> **Design principle:** Never hardcode Arizona or "desert" as assumptions in the website architecture, data models, or UI copy. Location fields, discovery categories, and scoring components must work equally for an Icelandic volcano, a Scottish coastline, or a Sonoran wash.

## Planned tech stack

- **Framework:** Next.js (React)
- **Hosting:** Vercel (free tier, deploys from GitHub)
- **Database:** Supabase (Postgres) — stores scores, discovery log, records, player level, community submissions
- **CMS:** Markdown files in repo for episode content, or Notion as headless CMS
- **Domain:** thezorafiles.com (registered via Cloudflare)
- **DNS:** Cloudflare DNS pointed to Vercel

## Site structure — two halves

The site has a public show side and an authenticated admin side. The game sub-site (`/finding-zora`) is a future addition — see ZORA_PROJECT.md for notes on Watches and community play.

### Public pages (the show)

| Route | Purpose |
|-------|---------|
| `/` | Home — latest expedition card hero, current medallion + level progress, last 3 episodes, last 5 discoveries, subscribe CTA |
| `/eos-index` | Leaderboard — all scored episodes, sortable by Eos Index or Zora Score |
| `/discovery-log` | Every discovery with point value, episode, rarity, and first-unlock status |
| `/records` | All-time bests — highest elevation, best road, etc. |
| `/episodes` | Episode archive with both Eos Index and Zora Score |
| `/episodes/:slug` | Episode detail — full expedition card, YouTube embed, score breakdown, discoveries, field notes |
| `/rules` | How it works — scoring, leveling, streaks, discoveries, interactive medallion display case |
| `/about` | The concept, the host, the mission |

### Future community pages

| Route | Purpose |
|-------|---------|
| `/eos-index/community` | Community leaderboard — viewer-submitted scored sunrises |
| `/eos-index/map` | Global Eos Index map — every scored sunrise (show + community) plotted worldwide |
| `/submit` | Community sunrise upload — photo with EXIF validation, AI scoring |

### Admin pages (authenticated, host only)

| Route | Purpose |
|-------|---------|
| `/admin/log` | Expedition logging form with live card preview, score ceremony, level-up flow, and card export |

## Key components

Built from the HTML artifacts in `website/artifacts/`:

| Component | Source artifact | Purpose |
|-----------|----------------|---------|
| `<Medallion>` | 11 `*_medallion.html` files | Canvas-rendered medallion at any level/gem/streak state |
| `<ExpeditionCard>` | `expedition_card.html` | Episode display card — used on every page that shows an episode, plus social sharing |
| `<EffortGems>` | Sundog rendering in card | 1–5 diamond-shaped effort indicators |
| `useCeremonyAudio` | Web Audio from medallion files | Click, whoosh, chime sounds for level-up and gem placement |

The medallion component is the progression spine — it appears on the home page (current state), on every episode (level at time of filming), on the rules page (display case), and in the admin log flow (gem placement / level-up ceremony).

## Dual scoring display

The website must display both scoring systems:
- **Eos Index** (0–100) — sunrise quality score. Photography-focused viewers follow this.
- **Zora Score** (~215 max) — full episode score including effort, discovery, conditions. Adventure-focused viewers follow this.
- Leaderboards sortable by either score.

## Level-up progression display

The home page shows:
- Current medallion at actual gem state (e.g., 3 of 6 gems filled)
- Level number and title (e.g., "Level 2 — Desert Fox")
- Progress bar toward next level (expeditions completed / 6)
- Current streak status

## Rules page — medallion display case

All 11 medallion levels are shown. Interactivity is gated:
- **Level 0 (Scout) and Level 1 (Trailhead)** — fully interactive with gem animation and sound
- **Levels 2–10** — static earned-state renders. Clicking shows a CTA to watch the show or play the game instead of triggering the demo. The visual escalation (pewter → white gold) is visible but the animations are earned.

## Admin logging flow

See ZORA_PROJECT.md "Expedition logging flow" for the full spec. Summary:
1. Fill form → live expedition card preview updates in real time
2. Submit → score ceremony (Eos count-up, effort gems, discovery tally, Zora Score total, record check)
3. Level-up if 6th expedition → medallion earns final gem, streak crown if applicable, new medallion fades in
4. Card export → download PNG at multiple aspect ratios for social sharing

## Community scoring architecture

- **Upload flow:** User submits photo, system extracts GPS + timestamp from EXIF, validates timestamp against sunrise window at that GPS location, then Claude API scores it using the Eos Index rubric
- **Appeals:** Users can request a manual score adjustment — routed to host for review. Host's adjustment is final.
- **Map:** Every scored sunrise (show and community) is a pin on a global map with score, date, and photo
- **AI scoring:** Claude handles initial scoring at scale; host has final authority on all scores
- **Eligibility:** GPS + timestamp in EXIF required. One submission per sunrise per user.

## When to initialize

The Next.js project gets created here when:
1. Brand identity (logo, colors, fonts) is finalized
2. At least the calibration data exists to populate the leaderboard
3. We're ready to start building pages

Run `npx create-next-app@latest .` inside this folder to initialize.

## Data models

See [ZORA_PROJECT.md](../ZORA_PROJECT.md) under "Key data models" for the Episode, Discovery, Record, and PlayerLevel TypeScript interfaces. Note the expanded Episode model now includes full Zora Score breakdown, travel details, and elevation data.
