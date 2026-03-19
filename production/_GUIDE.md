# Production — guide

This folder contains everything related to the filming and editing workflow.

## Subfolders

### checklists/
Printable/reviewable checklists for each phase of production. These mirror what's in ZORA_PROJECT.md but live here as standalone files you can pull up on your phone before a shoot.

- `pre-shoot.md` — the night-before and morning-of checklist
- `on-location.md` — what to do on arrival and during the shoot
- `post-production.md` — ingest through final upload

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

## Post-production pipeline

1. Ingest all clips via Hedge to organized folder
2. Sync all cameras in DaVinci Resolve via timestamp
3. Edit long-form in DaVinci Resolve
4. Score episode using Eos Index rubric
5. Export to Descript for transcript-based talk editing
6. Export short clips via OpusClip for TikTok/Reels
7. Final polish on short clips in CapCut
8. Upload YouTube first, then cross-post
