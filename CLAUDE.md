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
| `website/` | Future Next.js site for thezorafiles.com (not yet initialized) |
| `social/` | Per-platform content and assets (YouTube, Instagram, TikTok, X) |
| `planning/` | Strategic research, location scouting, gear evaluation |

## Conventions

- **Episode folders** follow `S01E01-short-title` naming
- **Episode titles** follow `S01E01 — "The Benchmark" — Lost Dutchman SP` format
- **All UI copy** uses sentence case — never ALL CAPS or Title Case
- **Color rules**: amber (`#F0A500`) is primary accent everywhere; teal (`#1D9E75`) is reserved for Eos Index only; never use pure black or pure white
- **Geographic scope**: Arizona is home base but the show is global. **Never hardcode Arizona or "desert" as assumptions** in website architecture, data models, or UI copy. All fields must work for any location worldwide.

## Scoring system

- **Eos Index** (0–100): Pure sunrise quality score. Sky (50) + Setting (30) + Conditions (20).
- **Effort Rating** (0–40): Post-expedition journey difficulty. 5 levels: Roadside (0) / Trail (5) / Summit (15) / Remote (25) / Expedition (40). Non-linear — each level is a significantly harder commitment.
- **Zora Score**: Full episode score. Eos Index + Effort + Discovery Points.
- **Streak**: Consecutive expeditions on cadence. Visual honor only (gold bar on card, crown on medallion) — no points.
- Both Eos Index and Zora Score are displayed every episode. Leaderboards sortable by either.

## Level-up system

D&D-style progression, 11 levels (0–10). Purely participation-gated — 6 expeditions per level, 60 total to reach Finding Zora. Score has no effect on leveling (it drives leaderboard position instead). Each level earns a unique medallion. Level 10 "Finding Zora" is the narrative endpoint. Full level table and medallion palette in ZORA_PROJECT.md.

## Website — thezorafiles.com

Tech stack: Next.js, Vercel, Supabase (Postgres), Cloudflare DNS.

**Route structure:**
- `/` — channel home (The Zora Files umbrella)
- `/about` — channel-level about page
- `/finding-zora/` — Finding Zora series hub
- `/finding-zora/episodes` — episode archive
- `/finding-zora/episodes/[slug]` — episode detail
- `/finding-zora/eos-index` — leaderboard
- `/finding-zora/discovery-log` — species catalog
- `/finding-zora/records` — all-time bests
- `/finding-zora/rules` — how the game works
- `/admin/` — production tools (protected, host-only)
