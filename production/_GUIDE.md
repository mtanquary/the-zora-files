# Production — guide

This folder contains everything related to the filming and editing workflow.

## Start here

- **`workflow.md`** — the top-level production workflow document. Read this first. Covers the eight phases of a video, the file-routing system, naming conventions, and templates.
- **`../STORAGE.md`** — the three-tier storage strategy. Which files live in git vs Proton vs local-only.

## Subfolders

### checklists/
Printable/reviewable checklists for each phase of production. Pull these up on your phone before a shoot.

- `pre-shoot.md` — the night-before and morning-of checklist
- `on-location.md` — what to do on arrival and during the shoot
- `post-production.md` — ingest through final upload (the most detailed of the three)

### luts/
DaVinci Resolve LUT files (.cube) for the show's color grade:
- Warm amber-shifted grade for golden hour footage
- Cool blue-shifted grade for pre-dawn / blue hour footage
- Develop and test these on existing footage before E01

### davinci-templates/
DaVinci Resolve project templates and motion graphics:
- Episode project template with timeline structure
- Eos Index score reveal motion graphic
- Lower third templates
- Intro/outro sequences

## Post-production pipeline (overview)

The detailed flow lives in `workflow.md`. The eight phases:

1. **Plan** — episode plan in the repo
2. **Shoot** — capture; footage stays on cards
3. **Ingest** — drop in Proton `zora\_inbox\`, ask Claude to route
4. **Cull** — copy keepers to the episode's `01-selects\`
5. **Edit** — DaVinci/Clipchamp; projects in `02-projects\`, drafts in `03-intermediates\`
6. **Final** — published cut to `04-final\`
7. **Publish** — update repo metadata; archive final `.drb`; schedule 60-day prune
8. **Prune** — wipe `03-intermediates\`; keep everything else
