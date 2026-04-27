# Storage strategy

How files for The Zora Files are organized across git, cloud backup, and local-only storage. This is the source of truth — when in doubt, follow this. When you (or an AI assistant) are about to commit a binary asset, check here first.

## The three tiers

Every file in the project lives in exactly one of three tiers:

### Tier 1 — Git (`the-zora-files` repo)

Version-controlled. Cloned by anyone working on the codebase. Pushed to the remote.

**Belongs here:**

- All code: `website/src`, `website/scripts`, `website/public/images`, `website/public/artifacts`, `website/public/cards`, the small SVG/icon assets in `website/public/`
- The scored archives served by the live site: `website/public/archives/` (including `archive-data.json`)
- All `.md` documentation: `docs/`, `discoveries/`, `planning/`, `production/`, episode plans, `social/` text content
- Small brand assets: `brand/colors`, `brand/logos`, `brand/typography`, `brand/templates`, `brand/_GUIDE.md`
- Tooling source: `tooling/medallion_export/*.{html,js,json}`, `tooling/title_export/*.{html,js,json}` — but NOT `node_modules/` or `frames/`
- Configs: `package.json`, `package-lock.json`, `eslint.config.mjs`, `next.config.ts`, `tsconfig.json`, etc.
- Top-level: `CLAUDE.md`, `PLAN.md`, `README.md`, `ZORA_PROJECT.md`, `STORAGE.md`, `.gitignore`

**Does NOT belong here:**

- Source video files (`.mp4`, `.mov`, `.avi`, `.mkv`)
- Source photos that are not served by the live site (anything in `photos/`, `episodes/**/photos/`, `episodes/**/footage/`)
- Audio source (`.wav`, `.mp3`)
- DaVinci Resolve project files (`.drp`, `.drb`, `.drt`, `.dra`, `.drx`) or cache (`.pfl`)
- Raw camera formats (`.heic`, `.tiff`, `.tif`, `.cr2`, `.nef`, `.arw`, `.dng`, `.raw`, `.r3d`, `.braw`)
- LUTs (`.cube`)
- Adobe source (`.psd`, `.ai`)
- Build outputs (`node_modules/`, `.next/`, `dist/`, `build/`, `out/`, `coverage/`)
- Stale snapshots like `_website_backup/`

The `.gitignore` enforces all of the above. Don't loosen it without updating this document.

### Tier 2 — Proton Drive (cloud backup)

Synced to Proton Drive on this laptop. Backed up off-machine. Not version-controlled — Proton handles its own versioning, but this is "backup," not "history" in the git sense.

**Belongs here:**

- All raw source video: `videos/*.MP4`, `videos/*.MOV`, future episode footage
- All raw source photos: the entire `photos/` tree (originally lived inside the repo, now Proton-only) and `episodes/**/photos/`
- DaVinci Resolve auto-export project backups: `videos/Resolve Project Backups/<UUID>/` (these are the `.drb` files Resolve writes on its backup schedule — your portable project library)
- DaVinci source media folder: `C:\Users\mattt\DaVinci Resolve Media\` (the audio captures for `zora-intro` and any future Resolve-side capture sequences)
- Brand video and music: `brand/video/`, `brand/music/`
- Final renders (when you start producing them — wherever you write them)
- The retired site snapshot (`_website_backup/`) once you move it out of the repo
- Anything you'd cry over if your laptop's SSD died

**Selective-sync exclusions to set in Proton Drive (when installing):**

- `videos/CacheClip/` — DaVinci-generated, regenerable
- `videos/.gallery/` — DaVinci-generated, regenerable
- `**/node_modules/` — npm-installable
- `**/.next/` — Next.js build output, regenerable
- `tooling/*/frames/` — render intermediates
- DaVinci's optimized media + proxy folders, wherever you've configured them

### Tier 3 — Local-only

Stays on this laptop. Not synced to Proton, not in git. Regenerable from scratch.

- `videos/CacheClip/` — DaVinci audio peaks, render cache
- `videos/.gallery/` — DaVinci gallery
- `website/node_modules/`, `website/.next/`
- `tooling/*/node_modules/`, `tooling/*/frames/`
- DaVinci optimized media + proxies (configure path under DaVinci → Project Settings → Master Settings → Working Folders → Cache Files Location, somewhere outside the Proton sync root)
- DaVinci project library (the SQLite-style database in `%APPDATA%\Blackmagic Design\DaVinci Resolve\`) — covered indirectly by the `.drb` auto-exports in Tier 2

If your machine dies, Tier 3 is the only thing you lose, and all of it regenerates automatically when you next open the project or run `npm install`.

## Decision rules for new files

When you create or capture a new asset, walk down this list:

1. **Is it source code, configs, docs, or small static assets the live site serves?** → Tier 1 (git).
2. **Is it irreplaceable creative work — footage, photos, audio captures, project files, final renders?** → Tier 2 (Proton).
3. **Is it generated/cached/installed and recreatable?** → Tier 3 (local-only). Add to `.gitignore` and Proton selective-sync exclusions if it isn't already covered.

## Live-site asset rules

The live site (`website/`) serves files directly from `website/public/`. Anything the deployed site needs to *load over HTTP* must be tracked in git so Vercel can build and ship it. That's why `website/public/archives/` is in git even though the photos visually duplicate `photos/zora-archives/` (which is now Tier 2 only).

When you score new photos with `node website/scripts/score-archives.mjs`:

- The script reads from `PHOTOS_DIR` (currently `photos/zora-archives/` — see `website/scripts/score-archives.mjs` around line 40) and copies byte-identical files into `website/public/archives/`.
- After scoring, you can free local disk by removing the originals from `photos/zora-archives/` since Proton has them backed up — but only after the copy into `public/archives/` has happened.
- If you ever relocate `photos/zora-archives/` (e.g., to a Proton-only path that doesn't sync locally), update `PHOTOS_DIR` in the script to the new path. The script will fail loudly if the folder is missing — it won't silently produce empty output.

## DaVinci Resolve config recommendations

Set these in Resolve once, so every project follows the rule:

- **Project Settings → Master Settings → Working Folders → Cache Files Location:** outside Proton (e.g., `D:\Resolve-Cache\` or somewhere on the local drive that you've explicitly excluded from sync).
- **Project Settings → Master Settings → Working Folders → Gallery Stills Location:** inside Proton sync — these are creative work.
- **Preferences → User → Project Save and Load → Live Save + Project Backups:** keep enabled. The backup destination should sit inside the Proton sync root so the `.drb` files get cloud-backed automatically. Today that's `videos/Resolve Project Backups/` in the repo, which works fine — but only because `videos/` is the directory you sync.
- **Capture and Playback → Capture → Capture clips to:** point at a folder inside the Proton sync root (your `DaVinci Resolve Media/<project>/Capture/` pattern is already correct).

## When `.gitignore` and this doc disagree

The `.gitignore` is the enforcement; this doc is the rationale. If a new pattern is added to `.gitignore`, update this doc to explain why. If this doc says something should be excluded but `.gitignore` doesn't catch it, fix `.gitignore` — don't edit the doc to match a leak.
