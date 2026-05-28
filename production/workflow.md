# Production workflow

The complete file-organization and production system for The Zora Files. Read this before any new shoot. When in doubt about where a file goes or what to do next, this is the source of truth.

This document covers *what to do and where things live*. The detailed phase-by-phase actions are in `production/checklists/`. Storage-tier rules (git vs cloud vs local-only) are in the repo's `STORAGE.md`.

## The 60-second version

You have **one place** for production media: `C:\Users\mattt\Proton Drive\willowrain_dream\My files\zora\`. Everything except code lives there. When you have new footage, drop it in `_inbox\` and ask Claude to route it — no need to remember where individual things go.

The repo (`C:\Users\mattt\Documents\the-zora-files\`) is a sibling system. It holds code, plans, scoring, and documentation — not media.

The cache directory (`C:\Users\mattt\Resolve-Cache\`) is local-only and never backed up.

## The map

```
C:\Users\mattt\
│
├── Documents\the-zora-files\        ← the repo (code, plans, docs, website)
│                                       Backed up via git, NOT in Proton sync
│
├── Proton Drive\willowrain_dream\My files\zora\
│   ├── _inbox\                      ← drop new media here, ask Claude to route
│   ├── shoots\                      ← all raw captures, organized by date
│   │   └── 2026\05\23-red-butte\
│   │       ├── dslr\
│   │       ├── gopro\
│   │       ├── hover\
│   │       ├── phone\
│   │       └── _shoot.md
│   ├── episodes\                    ← per-episode editing work
│   │   └── S01E01-horton-creek\
│   │       ├── 01-selects\
│   │       ├── 02-projects\
│   │       ├── 03-intermediates\    (60-day prune after publish)
│   │       ├── 04-final\
│   │       └── _episode.md
│   ├── series\                      ← reusable content across episodes
│   │   ├── intros\
│   │   ├── outros\
│   │   ├── drone-broll\
│   │   └── interstitials\
│   ├── davinci-media\               ← Resolve-side audio captures
│   ├── davinci-backups\             ← Resolve global backup pool (UUID subfolders)
│   └── _archive\                    ← completed seasons, cold storage
│
└── Resolve-Cache\                   ← DaVinci cache, local-only, never backed up
```

## The eight phases of a video

1. **Plan** — write the episode plan in the repo
2. **Shoot** — capture footage; it stays on cards until you're home
3. **Ingest** — drop files in `_inbox\`, Claude routes them into `shoots\`
4. **Cull** — copy the keepers into the episode's `01-selects\`
5. **Edit** — work in DaVinci/Clipchamp; projects in `02-projects\`, drafts in `03-intermediates\`
6. **Final** — render the published cut to `04-final\`
7. **Publish** — update repo metadata; archive the final `.drb`; schedule 60-day prune reminder
8. **Prune** — wipe `03-intermediates\`; keep everything else

Detailed checklists for shoot day live in `production/checklists/`. The phases below cover what's new — file routing, episode setup, publish handoff, pruning.

### Phase 1 — Plan

In the repo: `episodes/season-XX/SXXEXX-<slug>/plan.md`. The episode template at `episodes/_templates/episode-template.md` covers what goes in this file.

The **slug** chosen here is the immutable identifier for the episode across all systems. Pick it carefully — it shouldn't change later. Lowercase, hyphen-separated, no spaces, ideally matching the primary shoot location. Examples: `horton-creek`, `phon-d-sutton`, `red-butte`.

### Phase 2 — Shoot

Footage stays on the cards/devices until you're back at the computer. No on-location ingest. The on-location checklist (`production/checklists/on-location.md`) covers what to do during the shoot itself.

### Phase 3 — Ingest (via the inbox)

This is the only part of the system where you have to **remember a folder name**. Everything else is "ask Claude":

1. Plug in cards / connect devices.
2. Dump everything into `C:\Users\mattt\Proton Drive\willowrain_dream\My files\zora\_inbox\`. Any structure is fine — drag whole card folders in if it's faster. Photos and videos and audio all together is fine.
3. Tell Claude one sentence: where the shoot was. Example: *"Dropped a sunrise shoot from Camelback in the inbox."*
4. Claude detects devices from filename patterns (GoPro `GX*.MP4`, Hover `HOVER_*`, phone `20YYMMDD_*`, Canon `IMG_*.CR2`), reads dates from filenames or mtimes, and proposes the target shoot folder.
5. Confirm the proposal. Claude moves the files into `shoots\YYYY\MM\DD-<location-slug>\<device>\` and drops a starter `_shoot.md`.
6. **Don't clear cards until Proton shows the upload finished.** The Proton client status bar tells you when the queue is empty.

Multi-stop trips: if you shot multiple sunrises in one trip (sunrise here, sunrise tomorrow), Claude will ask whether you want them flat (two sibling date folders) or nested under a trip parent. Default to flat unless you really need them grouped.

### Phase 4 — Cull / Selects

When you're ready to start editing:

1. Tell Claude *"start episode for the <slug> shoot"* (or just *"start the Camelback episode"* — it'll figure out the latest shoot if there's only one un-attached).
2. Claude creates `episodes\SXXEXX-<slug>\` with the four stage subfolders and a starter `_episode.md` linking back to the shoot(s) used.
3. Manually copy your keeper clips from `shoots\<date>\<device>\` into `episodes\SXXEXX-<slug>\01-selects\`. Copy, don't move — the originals stay in `shoots\` as the source of truth.
4. Optionally rename copies with descriptive names (`opening-wide.mp4`, `quail-discovery.mp4`) — but the original raw file in `shoots\` keeps its camera-assigned name.

### Phase 5 — Edit

Save **all** project files into `episodes\SXXEXX-<slug>\02-projects\`:

- DaVinci `.drp` exports (manual exports, not the auto-backups — those live elsewhere)
- Clipchamp project files (download from the cloud as needed)
- Descript project links / exports

Drafts and handoff renders go into `episodes\SXXEXX-<slug>\03-intermediates\`. Name them with the stage label:

| Filename pattern | Used for |
|---|---|
| `<slug>-clipchamp-v<N>.mp4` | Output from Clipchamp |
| `<slug>-davinci-v<N>.mp4` | Output from DaVinci |
| `<slug>-descript-v<N>.mp4` | Output from Descript (pre-final) |

Version numbers increment with every render you'd want to come back to. Disposable test renders can overwrite.

### Phase 6 — Final

The published cut goes to `episodes\SXXEXX-<slug>\04-final\<slug>-final.mp4`. Just one canonical filename — if you re-render, overwrite (and bump the version if it's a meaningful change: `<slug>-final-v2.mp4`).

### Phase 7 — Publish

When the video is live on YouTube:

1. Update repo metadata: edit `episodes/season-XX/SXXEXX-<slug>/plan.md` with the publish date and the YouTube URL.
2. **Archive the DaVinci project state at publish time**: find the project's UUID folder in `zora\davinci-backups\<UUID>\`, copy the most recent `.drb` into `zora\episodes\SXXEXX-<slug>\02-projects\<slug>-final.drb`. This is your permanent "this is what we shipped" record — the global pool keeps rolling for live work.
3. Schedule a prune reminder for 60 days from today (in whatever calendar/task tool you use). The reminder should reference the episode slug.

### Phase 8 — Prune (60 days later)

When the reminder fires:

1. Verify the episode is still published and you have no need to re-render.
2. Delete the contents of `episodes\SXXEXX-<slug>\03-intermediates\` (keep the folder, lose the files).
3. Move the episode folder to `_archive\season-XX\` if the season is complete.

Selects, projects, and finals stay forever. Intermediates are the only thing that gets pruned.

## Naming conventions (quick reference)

| Thing | Pattern | Example |
|---|---|---|
| Shoot folder | `YYYY\MM\DD-<location-slug>` | `2026\05\23-red-butte` |
| Sub-shoot (multi-stop trip) | `<DD>-<location-slug>` *(under a trip parent)* | `17-sedona-sunrise` |
| Device subfolder | lowercase device name | `gopro`, `dslr`, `phone`, `hover`, `dji` |
| Episode folder | `S<NN>E<NN>-<episode-slug>` | `S01E01-horton-creek` |
| Stage subfolder | `<num>-<stage>` | `01-selects`, `02-projects`, `03-intermediates`, `04-final` |
| Render filename | `<slug>-<stage>-v<N>.<ext>` | `horton-creek-clipchamp-v1.mp4`, `horton-creek-final.mp4` |
| Slug | lowercase, hyphen-separated, no spaces | `phon-d-sutton`, `red-butte` |

The **episode slug** is the immutable identifier. Episode *titles* can change for marketing reasons; slugs do not. Slug usually matches the location slug of the primary shoot.

## The `_shoot.md` template

Every shoot folder gets one. Claude pre-fills the basics; you fill in conditions and notes.

```markdown
# <location> — <date>

## Quick facts

- **Date:** YYYY-MM-DD
- **Location:** <name>, <region>
- **GPS:** <lat, long>
- **Devices used:** gopro, dslr, phone, hover
- **Total files:** XX (Y video, Z stills)
- **Intended episode:** SXXEXX-<slug> (or "TBD" or "series content")

## Conditions

- **Weather:**
- **Cloud cover:**
- **Sunrise time (actual):**
- **Temp / wind:**

## Notes
```

## The `_episode.md` template

Every episode folder gets one.

```markdown
# SXXEXX — <episode-slug>

## Identity

- **Slug:** <slug>
- **Title:** <current marketing title — may change>
- **Season:** 01
- **Episode:** XX

## Sources

- **Primary shoot:** `shoots/YYYY/MM/DD-<location-slug>/`
- **Additional shoots:** (if any)
- **Series content used:** (intros/outros/b-roll referenced)

## Status

- [ ] Selects copied to 01-selects
- [ ] First cut in DaVinci
- [ ] Talk pass in Descript
- [ ] Final rendered
- [ ] Published
- [ ] Project archived to 02-projects (final .drb)
- [ ] Intermediates pruned (60 days post-publish)

## Render log

| Date | Stage | File | Notes |
|------|-------|------|-------|
|      |       |      |       |

## Publish info

- **Publish date:**
- **YouTube URL:**
- **Final filename:** `<slug>-final.mp4`
```

## Tool pipeline notes (current)

This may change as you evaluate tools — the file structure does not.

1. **Hedge** (or manual copy) ingests cards into `_inbox\`
2. **DaVinci Resolve** for primary edit (color, sync, structure)
3. **Descript** for transcript-based talk-pass editing → final render
4. **Clipchamp** as occasional alternative for short or quick-turn pieces
5. **OpusClip** to auto-generate shorts from the final long-form
6. **CapCut** to polish shorts for 9:16

Where each tool fits in the file structure:

- DaVinci project files → `02-projects\<slug>-davinci.drp` (manual export); `.drb` auto-backups go to the global pool at `zora\davinci-backups\`
- Clipchamp project files → downloaded to `02-projects\<slug>-clipchamp.dat` or similar (Clipchamp is cloud-first, so what's local is mostly its export cache)
- Descript projects → cloud-first; export the final render to `04-final\`

## DaVinci Resolve config (set once)

In Resolve Preferences:

- **System → Media Storage**: optionally add `C:\Users\mattt\Proton Drive\willowrain_dream\My files\zora\shoots\` and `\series\` as media storage roots so the bin shows them
- **User → Project Save and Load → Project Backups → Location**: `C:\Users\mattt\Proton Drive\willowrain_dream\My files\zora\davinci-backups\`

In each Project Settings (Shift+9, per-project):

- **Master Settings → Working Folders → Cache Files Location**: `C:\Users\mattt\Resolve-Cache\` *(local-only, never backed up)*
- **Master Settings → Working Folders → Gallery Stills Location**: inside the episode's `02-projects\` folder (so stills get archived with the episode)
- **Master Settings → Working Folders → Captured Clips Location**: `C:\Users\mattt\Proton Drive\willowrain_dream\My files\zora\davinci-media\<project-name>\Capture\` (when capturing directly into Resolve)

Save these as a Project Settings Preset (inside the Project Settings dialog, scroll the left sidebar to the bottom → Presets → Save As) so future projects inherit them.

## Proton Drive config

**Always keep on this device** (right-click the folder in File Explorer → Proton Drive → Always keep on this device):

- `zora\shoots\` (or at least the most recent shoots you're actively editing)
- `zora\episodes\<active>\` for whatever episode is in flight
- `zora\davinci-media\`

Letting Proton mark these "online only" will brick your editor — DaVinci wants random-access to media and treats placeholders as missing files.

The rest of `zora\` can stay sync-on-demand; you can mark older shoots as "free up space" once they're truly archived.

## When the inbox workflow doesn't fit

The inbox is for **fresh raw footage**. Some files don't fit that mold:

- **Processed renders / Descript exports** → drop them directly into the episode's `04-final\` or `03-intermediates\` (don't route through `_inbox\`)
- **Reusable b-roll** → goes straight into `series\drone-broll\` (or the relevant series subfolder)
- **Intros, outros, interstitials** → straight into `series\<type>\`
- **Stock footage from other sources** → `series\<type>\` with a `_source.md` noting the license

If you're not sure, drop it in `_inbox\` anyway and ask. Claude will route it correctly.
