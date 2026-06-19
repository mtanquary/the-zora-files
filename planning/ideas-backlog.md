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
- **Status:** `open`
- **Origin:** Coon Bluff ingest — surfaced the inconsistency
- **The idea:** Two existing shoot folders use the incorrect plural spelling: `shoots/2026/04/20-coons-bluff-eos-index-dialog` and `shoots/2026/05/01-coons-bluff`. The actual place name is **Coon Bluff** (singular). New shoots use the correct slug; the older folders are inconsistent. Rename for cleanliness.
- **Cost to do:** ~2 minutes (two PowerShell `Rename-Item` calls; commands already documented at the bottom of the Coon Bluff routing exchange).
- **When to do it:** Whenever — low priority, no downstream blocker.

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
