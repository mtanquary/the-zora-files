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

## Planned pages

| Route | Purpose |
|-------|---------|
| `/` | Home — latest episode hero, current leader, current level + progress bar, subscribe CTA |
| `/eos-index` | Full leaderboard — show episodes, sortable by Eos Index or Zora Score |
| `/eos-index/community` | Community leaderboard — viewer-submitted scored sunrises |
| `/eos-index/map` | Global Eos Index map — every scored sunrise (show + community) plotted worldwide |
| `/discovery-log` | Every discovery with point value, episode, and first-unlock status |
| `/records` | All-time bests — highest elevation, best road, etc. |
| `/episodes` | Episode archive with both Eos Index and Zora Score |
| `/submit` | Community sunrise upload — photo with EXIF validation, AI scoring |
| `/about` | The concept, the host, the mission |

## Dual scoring display

The website must display both scoring systems:
- **Eos Index** (0-100) — sunrise quality score. Photography-focused viewers follow this.
- **Zora Score** (~215 max) — full episode score including travel, discovery, conditions. Adventure-focused viewers follow this.
- Leaderboards should be sortable by either score.

## Level-up progression display

The home page and a dedicated section should show:
- Current level number and title (e.g., "Level 2 — Desert Fox")
- Progress bar toward next level threshold
- Next gear unlock preview
- Episode count and current streak

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
