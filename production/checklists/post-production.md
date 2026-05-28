# Post-production checklist

_After every shoot, work through this pipeline. The high-level system is in `production/workflow.md`; this is the day-of detail._

## Ingest (Phase 3)

- [ ] Drop all card contents into `Proton Drive\willowrain_dream\My files\zora\_inbox\` — any structure is fine
- [ ] Ping Claude with one sentence: *"Sunrise at <location> dropped in the inbox"*
- [ ] Review Claude's proposed routing (devices detected, date inferred, target shoot folder), confirm
- [ ] Wait for Proton sync to complete before clearing the cards (watch the Proton status indicator)
- [ ] Verify Claude pre-filled `_shoot.md`; add conditions, weather, sunrise time, notes

## Start the episode (Phase 4)

- [ ] Tell Claude: *"start episode for the <slug> shoot"*
- [ ] Claude creates `zora\episodes\SXXEXX-<slug>\` with the four stage subfolders and `_episode.md`
- [ ] Copy keeper clips from `zora\shoots\<date>\<device>\` to `zora\episodes\SXXEXX-<slug>\01-selects\`
- [ ] Optionally rename selects with descriptive names (`opening-wide.mp4`, `quail-discovery.mp4`)
- [ ] Update `_episode.md` Status section as steps complete

## Edit in DaVinci (Phase 5)

- [ ] Create new DaVinci project, name it `<slug>` (matches episode slug)
- [ ] Verify Project Settings → Working Folders → Cache Files Location = `C:\Users\mattt\Resolve-Cache\`
- [ ] Verify Gallery Stills Location = `zora\episodes\SXXEXX-<slug>\02-projects\`
- [ ] Import selects from `zora\episodes\SXXEXX-<slug>\01-selects\`
- [ ] Sync all cameras via timestamp (clocks were synced on location)
- [ ] Rough cut — follow the episode structure:
  - Cold open (30-60 sec)
  - The approach
  - Discovery window
  - The sunrise
  - The verdict (60-90 sec max)
- [ ] Apply color grade LUT
  - Warm amber for golden hour footage
  - Cool blue for pre-dawn / blue hour footage
- [ ] Add Eos Index score reveal graphic
- [ ] Add lower thirds for locations and species
- [ ] Export intermediate to `zora\episodes\SXXEXX-<slug>\03-intermediates\<slug>-davinci-v<N>.mp4`

## Score & Discovery Log

- [ ] Complete the Eos Index scoring (use the admin scoring tool on the live site, or write to `episodes/season-XX/SXXEXX-<slug>/score.md` in the repo)
- [ ] Update the leaderboard if this episode places
- [ ] Update the Discovery Log with all new species/features

## Descript pass

- [ ] Import intermediate from `03-intermediates\<slug>-davinci-v<N>.mp4`
- [ ] Transcript-based talk-pass editing
- [ ] Export to `zora\episodes\SXXEXX-<slug>\03-intermediates\<slug>-descript-v<N>.mp4`

## Final render (Phase 6)

- [ ] Final polish pass (in Descript or back to DaVinci)
- [ ] Export to `zora\episodes\SXXEXX-<slug>\04-final\<slug>-final.mp4`

## Shorts

- [ ] Export final to OpusClip for auto-clipping
- [ ] Select and polish 2-3 best clips in CapCut
- [ ] Add captions and format for 9:16
- [ ] Save short renders to `zora\episodes\SXXEXX-<slug>\04-final\shorts\<slug>-short-<N>.mp4`

## Upload

- [ ] YouTube — upload long-form first
  - Title, description, tags, thumbnail
  - End screen + cards
  - Schedule or publish
- [ ] TikTok — upload 2-3 shorts
- [ ] Instagram Reels — cross-post shorts
- [ ] Update thezorafiles.com with new episode data (admin tools)

## Publish handoff (Phase 7)

- [ ] Update `episodes/season-XX/SXXEXX-<slug>/plan.md` with publish date and YouTube URL
- [ ] Find the project's UUID folder in `zora\davinci-backups\<UUID>\`
- [ ] Copy the most recent `.drb` to `zora\episodes\SXXEXX-<slug>\02-projects\<slug>-final.drb`
- [ ] Update `_episode.md` Status section — all checkboxes complete
- [ ] Schedule a 60-day prune reminder referencing the episode slug

## 60-day prune (Phase 8)

_Triggered by your calendar reminder, not part of this pass._

- [ ] Verify episode is still published, no re-render planned
- [ ] Delete contents of `zora\episodes\SXXEXX-<slug>\03-intermediates\` (keep the folder, lose the files)
- [ ] If the season is complete, move the whole episode folder to `zora\_archive\season-XX\`
