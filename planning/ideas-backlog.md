# Ideas backlog

A running list of project ideas — tooling, workflow improvements, website features, content angles — that don't have a home anywhere else. Reviewed monthly (1st of each month) to surface anything ripe for action.

**How this works:**
- Add new ideas as they come up, with date and category
- Status is one of: `open`, `in-progress`, `done`, `dropped`
- When an idea becomes a real project, link to its issue / branch / doc and update status
- Items that stay `open` for many months without movement might want to be dropped to keep the list useful

## Workflow & conventions

### Gear-tracking convention in `_shoot.md`

- **Added:** 2026-06-13
- **Status:** `open`
- **Origin:** Old Man Corona shoot — first time the backpack got mentioned in a `_shoot.md`
- **The idea:** Formalize gear callouts in `_shoot.md` (and `_trip.md`) so that future-me can grep across all shoots for impressions of a specific piece of kit over time. Useful for "year in pack" recap content, gear review videos, or deciding whether to keep/replace a piece after enough field tests.
- **Possible implementation:** Add a "Gear notes" optional section to the `_shoot.md` template in `production/workflow.md`. Keep it free-form; structure is the file/section heading, not the prose.
- **Cost to do:** ~15 minutes (edit workflow.md, optionally backfill existing shoots that mention gear).

### Rename stale `coons-bluff` folders (typo cleanup)

- **Added:** 2026-06-13
- **Status:** `done` _(2026-06-23)_
- **Origin:** Coon Bluff ingest — surfaced the inconsistency
- **What was done:** Both folders renamed in one PowerShell pass — `shoots/2026/04/20-coons-bluff-eos-index-dialog` → `20-coon-bluff-eos-index-dialog`, and `shoots/2026/05/01-coons-bluff` → `01-coon-bluff`. All cross-references in `_shoot.md` files updated. The Coons Bluff 5/01 shoot picked up a `dslr/` layer with 10 retroactive Canon raws (`IMG_4454–4463.CR2`) at the same time.

### Auto-generate `_shoot.md` from phone/EXIF metadata

- **Added:** 2026-06-13
- **Status:** `open`
- **Origin:** Pattern noticed across multiple inbox routings — same fields get filled in the same way (date, file counts by extension, devices detected by filename pattern, sometimes GPS from EXIF)
- **The idea:** Build a small script that, given a shoot folder, generates a starter `_shoot.md` with date, file counts, device breakdown, and GPS (if any photo has EXIF GPS) pre-filled. Run it after every inbox routing as the last automated step.
- **Why it matters:** Removes the only manual-but-mechanical part of the routing workflow. Frees Claude (and Tank) to focus on the parts that need a brain — conditions, notes, intended episode.
- **Cost to do:** ~1-2 hours (small Node or Python script, lives in `tooling/`). Could use `exiftool` (mature, free) for EXIF reading.

## Planning intelligence

### Trailhead popularity as a planning input

- **Added:** 2026-06-13
- **Status:** `open`
- **Origin:** Old Man Corona shoot — "already people there at 4 AM" stood out as useful data
- **The idea:** Over time, capture in `_shoot.md` how busy a trail was at arrival. Eventually, when planning a shoot, surface that data ("Trail X had crowding at 4 AM last time; consider arriving at 3:30 or picking trail Y"). Could be manual (notes only) or eventually a small UI in `/admin/scout`.
- **Why it matters:** Crowded trailheads compromise audio (other voices), block clean approach shots, and force you to wait for clearances. Data turns gut-feel into actual recommendations.
- **Cost to do (basic):** ~5 minutes (just add an "Arrival / crowding" field to the `_shoot.md` template).
- **Cost to do (full):** Multi-hour — needs a data structure, queryable storage, and a UI surface.

## Website / tooling

### Trailhead map from accumulated GPS coordinates

- **Added:** 2026-06-13
- **Status:** `open`
- **Origin:** First time a `_shoot.md` got tagged with GPS coordinates
- **The idea:** Each `_shoot.md` already has a "GPS" field. Over many episodes, those points become a meaningful dataset. Build a small page on `thezorafiles.com/finding-zora/trailheads/` that renders all of them on a map (Leaflet, Mapbox, etc.), with each point linking to the corresponding episode if one exists.
- **Why it's interesting:** Visual story of where the show has been; helps viewers see geographic spread; feeds the "global by intent" brand positioning. Also lets *you* spot gaps ("I've shot the south side of Phoenix a lot, never the north").
- **Dependency:** Need a way to read `_shoot.md` GPS values out of Proton — either a script that crawls and exports JSON, or migrating shoot metadata into Postgres.
- **Cost to do:** Day-scale project. Worth doing once you have ~10-15 shoots with coordinates so the map looks alive rather than sparse.

### Eos Index "live screen recording" replacement for the verdict screencast

- **Added:** 2026-06-13
- **Status:** `open`
- **Origin:** Workflow noticed during E03 production — the "verdict" section is currently a screencast of Tank entering values into the admin form. Functional but visually flat.
- **The idea:** Build a dedicated UI page that *animates* the Eos Index reveal — sub-scores fade in one at a time, the total counts up, the medallion/level updates. Designed specifically to be screen-recorded for the verdict segment of each episode, replacing the current admin-form screencast.
- **Why it matters:** The verdict is one of the show's most repeated moments. Upgrading it once pays off every episode.
- **Cost to do:** Multi-day project — needs a route under `/admin/score-reveal/` or `/finding-zora/eos-index/<slug>/reveal/`, takes an episode slug and the Eos sub-scores as input, animates them deterministically so the recording is always frame-accurate.

### Batch-transcribe-a-shoot script (repeat what Red Butte proved out)

- **Added:** 2026-07-07
- **Status:** `open` — proven manually against Red Butte; needs to become a reusable script
- **Origin:** Red Butte S01E05 production. Proved that Descript MCP + PowerShell upload manifest + agent-built chronological composition + timecoded transcript export = a `_storyboard.md` that compresses editing time significantly. See `zora\shoots\2026\05\23-red-butte\_storyboard.md` for what the output looks like.
- **The idea:** Package the manual workflow into a reusable pattern that takes a shoot folder path and produces:
  - `_transcript.md` — raw full transcript from Descript with per-clip chapter markers
  - `_storyboard.md` — the editing companion with clip index, hero-line highlights, editorial recommendations, VO extraction candidates, and Discovery Log candidates
- **Steps the script needs to handle** (roughly what was done manually):
  1. Enumerate video files (`.mp4`, `.mov`) in the shoot's device subfolders, chronologically
  2. Chunk into batches of 5 (Descript's practical query-limit sweet spot; 10+ hits "Query count exceeded")
  3. Call `import_media` per batch with content_type + file_size for direct upload
  4. Emit each batch's presigned upload URLs to a JSON manifest that a PowerShell poller reads
  5. Poller uploads bytes as new URLs appear; loops until manifest.complete=true
  6. Between batches, `wait_for_job` on each import job; submit next batch when done
  7. When all files uploaded, use `prompt_project_agent` to build a chronological composition with per-clip chapter markers (this is the workflow unlock — makes the transcript navigable)
  8. `export_transcript` as markdown with timecodes and marker inclusion → save as `_transcript.md`
  9. Distill into `_storyboard.md` via a follow-up LLM pass or template
- **Why it matters:** Red Butte took ~45 minutes of my active time end-to-end. As a script it becomes: kick off, come back to a finished storyboard. Every future shoot gets a searchable "what was said and when" index before the editor even opens. That is the single largest edit-time compression available right now.
- **Cost to do:** Half-day to build v1 (single-folder happy path, no error recovery). Another half-day to polish (retry logic, better `_storyboard.md` templating, handling of already-uploaded files, per-shoot progress tracking).
- **Dependencies:** Descript MCP connected (done), PowerShell 5+ on the local machine (done), enough Descript transcription budget for whatever shoot is being processed
- **Storage overhead:** Descript keeps uploaded media indefinitely per plan tier. For a full trip like Glacier (~50 videos, ~20 GB), that's a real budget consideration — worth including a "delete project when done" post-step if space becomes tight
- **Lessons from the Red Butte run to bake in:**
  - Batch size = 5. Composition with 5-clip references also hits the 100-query limit; import media-only, build composition via agent afterward
  - Silent clips get empty transcript sections — that's correct behavior, useful "this is b-roll, no VO to lift" signal for the editor
  - The `prompt_project_agent` call to build the composition took ~5 minutes for 40 clips due to per-marker latency. Batch-add markers if the API allows
  - Filename prefix `NN-` for chronological order carries through Descript nicely and makes the transcript legible
  - Multi-day trips: probably one project per day, not per trip — projects with 100+ clips get unwieldy

## Content angles

### "Year in pack" gear review episode

- **Added:** 2026-06-13
- **Status:** `open`
- **Origin:** Pairs with the gear-tracking convention idea above — once the gear notes accumulate across many shoots, they become content
- **The idea:** A reflective episode (or season-end recap segment) walking through every piece of gear that's been tested across the show — what stayed in the kit, what got replaced, what surprised you. Honest, low-budget, no-sponsorship gear review based on real field use rather than unboxing.
- **Why it matters:** Channel-defining authenticity. Most YouTube gear content is influencer-shaped; "I used this for a year, here's what I actually think" content is rare and valuable.
- **Dependency:** Need enough gear data points to make it interesting. Probably wait until end of S01 or S02.
- **Cost to do:** A single episode of work, but with months of "data collection" baked into the workflow first.

---

## How to add new ideas

When something comes up:

1. Pick the right category section above (or add a new H2 if none fits)
2. Use this template:

```markdown
### Short, scannable title

- **Added:** YYYY-MM-DD
- **Status:** `open`
- **Origin:** Where this idea came from — a specific shoot, a specific edit pain, a feature request, etc.
- **The idea:** One paragraph max
- **Why it matters / why it's interesting:** Optional, but useful for future-you
- **Cost to do:** Rough sense — minutes, hours, day, multi-day
```

Keep it short. If an idea is so big it needs a design doc, write the doc somewhere else and link it from a one-line entry here.
