# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**The Zora Files** is a YouTube channel brand. Philosophy: "the best things discovered in life come through early to rise." It is an umbrella for multiple series.

**Finding Zora** is the flagship series — a sunrise-chasing expedition game with scoring, discoveries, and level-up progression. This repo is the operational hub for the channel and contains brand guidelines, episode planning, production checklists, discovery tracking, and the companion website.

**Brand hierarchy:**
- **The Zora Files** (thezorafiles.com) — the channel. May contain multiple series.
- **Finding Zora** — the flagship series/game within The Zora Files.
- **Finding Zora community** (future, separate project) — where others sign up and play their own Finding Zora.

## Key files

- **ZORA_PROJECT.md** — Source of truth for all brand, technical, and creative decisions. Read this first.
- **PLAN.md** — Living task tracker across 7 phases (foundation through launch). Update as tasks complete.
- **_GUIDE.md files** — Every major folder has one explaining its purpose and conventions.

## Architecture

| Folder | Purpose |
|--------|---------|
| `brand/` | Visual identity: colors, typography, logos, design templates |
| `episodes/` | Per-episode planning, Eos Index scoring, field notes. Template in `_templates/` |
| `discoveries/` | Discovery Log — species/features found, points, master list in `discovery-log.md` |
| `production/` | Checklists (pre-shoot, on-location, post), LUTs, DaVinci templates |
| `website/` | Next.js 16 / React 19 site for thezorafiles.com — public pages, admin tools, and AI-scoring API routes |
| `social/` | Per-platform content and assets (YouTube, Instagram, TikTok, X) |
| `planning/` | Strategic research, location scouting, gear evaluation |

## Conventions

- **Episode folders** follow `S01E01-short-title` naming
- **Episode titles** follow `S01E01 — "The Benchmark" — Lost Dutchman SP` format
- **All UI copy** uses sentence case — never ALL CAPS or Title Case
- **Color rules**: amber (`#F0A500`) is primary accent everywhere; teal (`#1D9E75`) is reserved for Eos Index only; twilight violet (`#7A5FB8`) is reserved for Discovery elements only; never use pure black or pure white
- **Geographic scope**: Arizona is home base but the show is global. **Never hardcode Arizona or "desert" as assumptions** in website architecture, data models, or UI copy. All fields must work for any location worldwide.

## Scoring system

- **Eos Index** (0–100): Pure sunrise quality score. Sky (50) + Setting (30) + Conditions (20).
- **Effort Rating** (0–40): Post-expedition journey difficulty. 5 levels: Roadside (0) / Trail (5) / Summit (15) / Remote (25) / Expedition (40). Non-linear — each level is a significantly harder commitment.
- **Zora Score**: Full episode score. Eos Index + Effort + Discovery Points.
- **Streak**: Consecutive expeditions on cadence. Visual honor only (gold bar on card, crown on medallion) — no points.
- Both Eos Index and Zora Score are displayed every episode. Leaderboards sortable by either.

## Level-up system

D&D-style progression, 11 levels (0–10). Purely participation-gated — 6 expeditions per level, 60 total to reach Finding Zora. Score has no effect on leveling (it drives leaderboard position instead). Each level earns a unique medallion. Level 10 "Finding Zora" is the narrative endpoint. Full level table and medallion palette in ZORA_PROJECT.md.

Each episode's title card shows the player's **opening state** (rank + gem count at the start of the expedition); the episode closes with one of three ceremony types — medallion transition (gem 1 of a new arc), single gem placement (gems 2–5), or medallion awakening (gem 6). Pattern across each 6-episode arc: transition → small × 4 → awakening. Full rule and worked examples in ZORA_PROJECT.md.

## Website — thezorafiles.com

Tech stack: Next.js 16, React 19, Tailwind 4, Postgres (via `pg`), Supabase (client SDK), Vercel, Cloudflare DNS.

> **IMPORTANT — read before writing website code.** `website/AGENTS.md` warns that this is "NOT the Next.js you know" — Next.js 16 has breaking changes from training-data versions. Consult `website/node_modules/next/dist/docs/` for the relevant guide before writing or modifying Next.js code, and heed any deprecation notices.

### Dev commands (run from `website/`)

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `node scripts/score-archives.mjs` — bulk-score archive photos via AI
- `node scripts/export-social-images.mjs` — export social share images

No test runner is configured — verify UI changes by running `npm run dev` and exercising the feature in a browser.

### Database

Two access paths, pick the right one:
- `src/lib/db.ts` — `pg` Pool using `DATABASE_URL` (server-side queries in `src/lib/queries.ts`)
- `src/lib/supabase.ts` — Supabase JS client using `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side and auth flows)

Schema lives in `website/scripts/setup-db.sql`. Core tables: `episodes`, `discoveries`, plus related records. The `episodes` table stores `eos_index` and `zora_score` as JSONB so sub-score rationale is preserved.

### Admin tools (`/admin/*`, host-only)

Production surfaces beyond the spec in `website/_GUIDE.md`: `log` (expedition logging + ceremony), `card` (expedition card editor/export), `planner` (episode prep), `scout` (location scouting), `banner`, `social-export`, `artifacts`, `watermark`. AI endpoints under `/api/ai-*` back these tools (episode plan, field notes, pre-shoot, season recap, title, Eos scoring, discovery assist).

**Route structure:**
- `/` — channel home (The Zora Files umbrella)
- `/about` — channel-level about page
- `/finding-zora/` — Finding Zora series hub
- `/finding-zora/episodes` — episode archive
- `/finding-zora/episodes/[slug]` — episode detail
- `/finding-zora/eos-index` — leaderboard
- `/finding-zora/discovery-log` — species catalog
- `/finding-zora/records` — all-time bests
- `/finding-zora/archives` — scored archive photos gallery
- `/finding-zora/rules` — how the game works
- `/admin/` — production tools (protected, host-only)
