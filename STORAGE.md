# Storage strategy

How files for The Zora Files are organized across git, cloud, and local-only storage. This is the source of truth — when in doubt, follow this. When you (or an AI assistant) are about to commit a binary asset, check here first.

The detailed production workflow — where each file goes during a video's lifecycle — lives in `production/workflow.md`. This document covers the *static rules*: which tier a file belongs to and why.

## The layout

Everything Zora lives in three locations on this laptop:

```
C:\Users\mattt\
│
├── Documents\the-zora-files\        ← the repo (TIER 1)
│                                       code, plans, docs, website
│                                       version-controlled in git
│                                       NOT in Proton sync
│
├── Proton Drive\willowrain_dream\My files\zora\    ← production media (TIER 2)
│   ├── _inbox\
│   ├── shoots\
│   ├── episodes\
│   ├── series\
│   ├── davinci-media\
│   ├── davinci-backups\
│   └── _archive\                       bidirectional Proton sync
│                                       NOT in git
│
└── Resolve-Cache\                   ← DaVinci cache (TIER 3)
                                       local-only, never backed up
                                       regenerable from source media
```

## The three tiers

Every file lives in exactly one tier:

### Tier 1 — Git (`the-zora-files` repo)

Version-controlled. Cloned by anyone working on the codebase. Pushed to the GitHub remote.

**Belongs here:**

- All code: `website/src`, `website/scripts`, `website/public/images`, `website/public/artifacts`, `website/public/cards`, `website/public/archives` (yes, the live site needs these in git so Vercel can build)
- All `.md` documentation: `docs/`, `discoveries/`, `planning/`, `production/`, episode plans, `social/` text content
- Small brand assets: `brand/colors`, `brand/logos`, `brand/typography`, `brand/templates`, `brand/_GUIDE.md`
- Tooling source: `tooling/medallion_export/*.{html,js,json}`, `tooling/title_export/*.{html,js,json}` — but NOT `node_modules/` or `frames/`
- Configs: `package.json`, `package-lock.json`, `eslint.config.mjs`, `next.config.ts`, `tsconfig.json`, etc.
- Top-level: `CLAUDE.md`, `PLAN.md`, `README.md`, `ZORA_PROJECT.md`, `STORAGE.md`, `production/workflow.md`, `.gitignore`

**Does NOT belong here:**

- Any video file (`.mp4`, `.mov`, `.avi`, `.mkv`, `.r3d`, `.braw`)
- Any audio source (`.wav`, `.mp3`)
- Source photos that are not served by the live site (those go to Proton)
- DaVinci Resolve project files (`.drp`, `.drb`, `.drt`, `.dra`, `.drx`) or cache (`.pfl`)
- Raw camera formats (`.heic`, `.tiff`, `.tif`, `.cr2`, `.nef`, `.arw`, `.dng`)
- LUTs (`.cube`)
- Adobe source (`.psd`, `.ai`)
- Build outputs (`node_modules/`, `.next/`, `dist/`, `build/`, `out/`, `coverage/`)
- Stale snapshots (the old `_website_backup/` lives in Proton's `_archive\`, not git)

The `.gitignore` enforces all of the above. Don't loosen it without updating this document.

### Tier 2 — Proton Drive (`zora\` under Proton sync)

Bidirectional sync to Proton Drive. Backed up off-machine. Not version-controlled — Proton handles its own versioning.

Everything in Tier 2 lives under one root: `C:\Users\mattt\Proton Drive\willowrain_dream\My files\zora\`. See `production/workflow.md` for the per-subfolder rules; the high-level breakdown:

| Subfolder | Contents | Retention |
|---|---|---|
| `_inbox\` | New media awaiting routing | Cleared as Claude routes files |
| `shoots\` | All raw footage, organized `YYYY\MM\DD-slug\<device>\` | Forever |
| `episodes\<SXXEXX-slug>\01-selects\` | Curated keepers per episode | Forever |
| `episodes\<SXXEXX-slug>\02-projects\` | Editor project files + archived final `.drb` | Forever |
| `episodes\<SXXEXX-slug>\03-intermediates\` | Draft renders, handoff exports | 60 days after publish |
| `episodes\<SXXEXX-slug>\04-final\` | Published cut | Forever |
| `series\intros\`, `outros\`, `drone-broll\`, `interstitials\` | Reusable across episodes | Forever |
| `davinci-media\` | Resolve-side audio captures | Forever |
| `davinci-backups\<UUID>\` | Resolve's global auto-backup pool | Resolve manages (rolls) |
| `_archive\season-XX\` | Completed seasons, cold storage | Forever |

**Also Tier 2 but outside the `zora\` root**: nothing right now. (The DaVinci Resolve Media folder at `C:\Users\mattt\DaVinci Resolve Media\` will be moved into `zora\davinci-media\` during the migration.)

**Proton "Always keep on this device" required for**:

- `zora\shoots\` (or at minimum the recent shoots you're actively editing)
- `zora\episodes\<active-episode>\` while it's in flight
- `zora\davinci-media\`

Proton can mark files "online only" to save disk space. That's catastrophic for video editing — Resolve and Descript treat placeholders as missing files. Mark active editing folders as always-local; older shoots can stay sync-on-demand.

### Tier 3 — Local-only

Stays on this laptop. Not synced, not in git. Regenerable from scratch.

- `C:\Users\mattt\Resolve-Cache\` — DaVinci cache files location (already configured)
- `Documents\the-zora-files\website\node_modules\` and `\.next\` — regen via `npm install` and `npm run build`
- `Documents\the-zora-files\tooling\*\node_modules\` and `\*\frames\` — regen via `npm install` and the export scripts
- DaVinci's per-project optimized media and proxy files (always set these locations inside `Resolve-Cache\` when prompted)
- DaVinci project library / database (the SQLite-style files in `%APPDATA%\Blackmagic Design\DaVinci Resolve\`) — covered indirectly by the `.drb` auto-exports written to Tier 2's `davinci-backups\`

If your machine dies, Tier 3 is the only thing you lose, and all of it regenerates automatically when you next open the project or run `npm install`.

## Decision rules for new files

When you create or capture a new asset, walk down this list:

1. **Is it source code, configs, docs, or small static assets the live site serves?** → Tier 1 (git).
2. **Is it irreplaceable creative work — footage, photos, audio captures, project files, final renders, reusable series content?** → Tier 2 (Proton zora\). If unsure where in `zora\` it goes, drop it in `_inbox\` and ask Claude.
3. **Is it generated, cached, or installed and recreatable?** → Tier 3 (local-only). Add to `.gitignore` if it isn't already.

## Live-site asset rules

The live site (`website/`) serves files directly from `website/public/`. Anything the deployed site needs to load over HTTP must be tracked in git so Vercel can build and ship it. That's why `website/public/archives/` is in git.

When you score new photos with `node website/scripts/score-archives.mjs`:

- The script reads from `PHOTOS_DIR` (currently `photos/zora-archives/` — see `website/scripts/score-archives.mjs` around line 40) and copies byte-identical files into `website/public/archives/`.
- That source folder is no longer maintained on this laptop; new source archive photos should be staged via the `_inbox\` workflow into `zora\shoots\` or a future `zora\archives-source\` folder, then `PHOTOS_DIR` updated to point there. (See "Migration of `score-archives.mjs`" below.)

## DaVinci Resolve config (the canonical settings)

In **Resolve Preferences** (Ctrl+, or `DaVinci Resolve → Preferences`):

- **User → Project Save and Load → Project Backups → Location**: `C:\Users\mattt\Proton Drive\willowrain_dream\My files\zora\davinci-backups\`
- **System → Media Storage**: optionally add `\zora\shoots\` and `\zora\series\` as media storage roots so the Media Pool browser sees them

In **each Project Settings** (Shift+9):

- **Master Settings → Working Folders → Cache Files Location**: `C:\Users\mattt\Resolve-Cache\` *(local-only)*
- **Master Settings → Working Folders → Gallery Stills Location**: inside the episode's `02-projects\` folder so stills archive with the episode
- **Master Settings → Working Folders → Captured Clips Location**: `\zora\davinci-media\<project-name>\Capture\`

Save these as a Project Settings Preset inside the Project Settings dialog (left sidebar bottom → Presets → Save As) so future projects inherit them.

## Migration of `score-archives.mjs`

When you next add archive photos:

1. Drop them in `zora\_inbox\` with a note that they're archive photos
2. Claude routes them to a stable location in `zora\` (proposed: `zora\archives-source\YYYY-MM\`)
3. Update `website/scripts/score-archives.mjs` line ~40 — change `PHOTOS_DIR` to the new path
4. Run the script as usual; it copies into `website/public/archives/` (which the live site serves)

This is a one-time update that needs to happen the first time you score photos under the new system.

## When `.gitignore` and this doc disagree

The `.gitignore` is the enforcement; this doc is the rationale. If a new pattern is added to `.gitignore`, update this doc to explain why. If this doc says something should be excluded but `.gitignore` doesn't catch it, fix `.gitignore` — don't edit the doc to match a leak.
