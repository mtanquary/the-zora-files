# The Zora Files — Master Project Context
> This file is the source of truth for all brand, technical, and creative decisions.
> Generated from the founding conversation. Update as decisions evolve.

---

## Brand Architecture

| Layer | Name | Purpose |
|-------|------|---------|
| Channel | The Zora Files | The full operation. Everything lives here. |
| Flagship series | Finding Zora | The sunrise quest. The show within the channel. |
| Scoring system | Eos Index | Sky · Setting · Conditions. 100 pts max per episode. |

**Zora** — Slavic word for dawn. Chosen for its brevity, owability, and direct meaning.
**Eos** — Greek goddess of dawn. Used for the scoring system name — clinical, precise, named after the goddess of dawn.

---

## Brand Voice & Persona

The host is a **systems thinker who is allergic to chaos but keeps getting surprised by nature.** A veteran, technical infrastructure consultant, bassoonist, and desert hiker from the Queen Creek / Chandler Heights area of Arizona.

**Voice traits:**
- Methodical but warm
- Dry humor over hype
- Understated — never performs amazement
- Genuinely curious, not manufactured enthusiasm
- The tension between protocol and unpredictability IS the show

**The show in one sentence:** Every episode is a scored attempt at the perfect sunrise — the desert doesn't care about your plan.

**Geographic scope:** Home base is the desert Southwest (Sonoran Desert, Arizona). The show is not limited to this region — travel episodes will range globally. The Arizona identity is the foundation and differentiator in early seasons; travel episodes are expeditions away from home base, not a pivot to generic travel content. Every sunrise belongs to someone. This is the record of one person's pursuit of the perfect one, wherever it leads.

> **Design principle:** Never hardcode Arizona or "desert" as assumptions in the website architecture, data models, or UI copy. Location fields, discovery categories, and scoring components must work equally for an Icelandic volcano, a Scottish coastline, or a Sonoran wash.

---

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Pre-dawn | `#0D0F14` | Dark backgrounds, hero sections |
| Zora amber | `#F0A500` | Primary accent — titles, highlights, UI |
| Sunrise orange | `#E8520A` | Secondary accent — conditions score bar |
| Eos teal | `#1D9E75` | Eos Index branding only — setting score bar |
| Twilight violet | `#7A5FB8` | Discovery accent — Discovery Log UI, share card discovery stats strip, Discovery row in the Zora Score intro motion graphic |
| Dawn mist | `#C8D4E0` | Body text on dark backgrounds |

**Rules:**
- Amber is the primary accent across all platforms
- Teal is reserved exclusively for Eos Index elements
- Twilight violet is reserved exclusively for Discovery elements — it pairs chromatically with amber, teal, and sunrise orange without overlap
- Never use pure black (#000000) or pure white (#ffffff)
- Pre-dawn dark background is the signature look

---

## Typography

- **Display / Logo:** Bold, high-contrast, works in amber on pre-dawn dark
- **Body:** Clean sans-serif, readable at small sizes
- **Data / Scores:** Monospace for Eos Index numbers and leaderboard data
- **All copy:** Sentence case always. Never ALL CAPS or Title Case in UI.

---

## Platform Handles

| Platform | Handle | URL | Status |
|----------|--------|-----|--------|
| YouTube | @TheZoraFiles | youtube.com/@TheZoraFiles | ✅ Secured |
| Instagram | @thezorafiles | instagram.com/thezorafiles | ✅ Secured |
| TikTok | @thezorafiles | tiktok.com/@thezorafiles | ✅ Secured |
| Domain | thezorafiles.com | thezorafiles.com | ✅ Registered |
| Email | hello@thezorafiles.com | Google Workspace | 🔲 Set up pending |
| X/Twitter | @thezorafiles | twitter.com/thezorafiles | 🔲 Register (defensive) |

---

## Website Architecture — thezorafiles.com

### Pages

```
/                   → Home — latest expedition card hero, current level + medallion, subscribe CTA
/eos-index          → Leaderboard — all scored episodes, sortable by Eos Index or Zora Score
/discovery-log      → Species + feature unlocks — every discovery with point value and episode
/records            → All-time bests — highest elevation, best road, best water view, etc.
/episodes           → Episode archive with scores and locations
/episodes/:slug     → Episode detail — full card, YouTube embed, score breakdown, discoveries
/rules              → How it works — scoring, leveling, streaks, discoveries, medallion display case
/about              → The concept, the host, the mission
/admin/log          → Authenticated — expedition logging form with live card preview and score ceremony
```

### Home page sections
1. Hero — latest expedition card (full `<ExpeditionCard>` component) with YouTube embed
2. Current level — medallion at current state (e.g., Desert Fox with 3/6 gems) + progress bar to next level
3. Recent episodes — last 3 as compact expedition cards
4. Discovery Log preview — last 5 unlocks
5. Subscribe CTA — YouTube + newsletter

### Reusable components from artifacts

The HTML files in `website/artifacts/` are the design source for these React components:

| Artifact source | Component | Props | Used on |
|-----------------|-----------|-------|---------|
| 11 `*_medallion.html` files | `<Medallion>` | `level`, `gems`, `streak`, `animated` | Home, episode cards, episode detail, rules, level-up ceremony |
| `expedition_card.html` | `<ExpeditionCard>` | `episode` data object | Home hero, episode list, episode detail, card export, social og:image |
| Sundog gem rendering | `<EffortGems>` | `rating` (1–5) | Inside expedition card, log form, leaderboard rows |
| Web Audio (click, whoosh, chime) | `useCeremonyAudio` hook | — | Level-up ceremony, gem placement, streak crown |

All medallion rendering uses HTML Canvas. The expedition card is DOM-based with a canvas-rendered medallion emblem inset.

### Expedition logging flow (`/admin/log`)

Authenticated route — host only. This is the post-expedition entry point.

**The form:**
- Episode metadata: number, title, location, coordinates, date
- Sunrise photo upload
- Eos Index sub-scores: Sky (0–50), Setting (0–30), Conditions (0–20)
- Effort rating: 1–5 selector with live sundog gem preview
- Discovery entries: name, type, rarity, photo, fun fact (add multiple)
- Contextual data: elevation, distance, pre-dawn minutes, weather

A live `<ExpeditionCard>` preview renders beside the form, updating as fields are filled.

**The score ceremony (on submit):**

1. **Eos Index reveal** — teal number counts up to the final score
2. **Effort gems fill** — sundogs light up one by one
3. **Discovery tally** — each discovery flashes with its point value
4. **Zora Score total** — three pillars sum into the final number
5. **Record check** — if any all-time records broken, a record callout fires

**The level-up moment:**

The site tracks expedition count. Every 6th expedition triggers a level-up:

1. Current medallion animates its **final gem** into place — click sound, glow effect
2. Etching sharpens, text completes — **medallion earned**
3. If streak maintained (all 6 within window), the **streak crown** animates on with whoosh
4. Brief hold, then the **new level medallion** fades in — empty, faint impression, first gem slot waiting
5. Level title updates (e.g., "Level 2 — Desert Fox")

If not a level-up: the current medallion receives its next gem (gem 2 of 6, etc.) with the click sound. Every expedition is a visible step forward.

**Card export (after ceremony):**

- Expedition card rendered at share-ready resolution
- Export options: download PNG, copy to clipboard, open in new tab
- Aspect ratio presets: Instagram story (9:16), Instagram post (1:1), X/Twitter (16:9), YouTube community (16:9)
- Card includes current medallion emblem, streak bar if active, all scored data

### Rules page — medallion display case

The `/rules` page includes an interactive display case showing all 11 medallion levels:

- **Level 0 (Scout) and Level 1 (Trailhead)** — fully interactive. Visitors click to watch gem placement animations with sound effects. The full demo experience.
- **Levels 2–10** — displayed as static, fully-earned renders. Visually distinct (the metal and gem escalation from pewter to white gold is visible) but clicking triggers a soft CTA instead of the demo:
  - *"Watch the journey to unlock Desert Fox"* → episode archive
  - *"Play Finding Zora to earn this medallion"* → game site (when available)

The locked animations create incentive to watch the show or play the game. The visual progression alone — copper to bronze to gold to platinum to white gold — sells the system.

### Episode detail pages

Each episode at `/episodes/:slug` shows:
- Full expedition card at top
- YouTube embed
- Complete score breakdown (Eos Index sub-scores, effort, discoveries, Zora Score total)
- Discovery list with cards for each find
- Field notes and contextual stats
- The medallion emblem reflects the host's level **at the time of that episode** — creating a visual timeline of progression across the archive

### Medallion as progression spine

The medallion is not decoration — it is the progression spine of the entire site. Every page that shows an episode also shows the level at the time of filming. The home page always shows current medallion state. The log flow always advances it. Visitors see gems fill over weeks and feel the momentum.

---

## Scoring System — Three Pillars

### How they relate
```
ZORA SCORE = Eos Index + Effort Rating + Discovery Points
```
- **Eos Index** is the pure sunrise quality score (0–100). Photography-focused viewers follow this.
- **Effort Rating** is a single post-expedition assessment of journey difficulty (0–40 pts, 5 levels, non-linear).
- **Discovery Points** are earned from wildlife, flora, geographic, and cultural encounters logged during the expedition.
- **Zora Score** is the full episode score. Adventure-focused viewers follow this.
- Both the Eos Index and Zora Score are displayed every episode. The Eos Index is the largest single contributor.

> **Two scores, displayed precisely.** The Eos Index scores sunrise quality only (0–100). The Zora Score is the full episode score (Eos Index + Effort + Discovery). Never conflate them or rename them.

---

## Eos Index — Sunrise Quality Score (0–100)

#### Sky — 50 points
| Component | Max | Description |
|-----------|-----|-------------|
| Color intensity | 20 | Saturation, vividness, range of hues |
| Cloud engagement | 15 | Dramatic lit clouds score high; clear sky moderate; flat overcast low |
| Horizon definition | 15 | Clean readable horizon = high; obstructed or flat = low |

#### Setting — 30 points
| Component | Max | Description |
|-----------|-----|-------------|
| Foreground composition | 15 | Trail, cactus, water, flowers, person — compelling element in frame |
| Location uniqueness | 15 | Suburban roadside = low; remote wilderness = high |

#### Conditions — 20 points
| Component | Max | Description |
|-----------|-----|-------------|
| Access difficulty | 10 | Drive-up viewpoint = 1–2; technical terrain or pre-dawn scramble to reach the vantage = 8–10 |
| Weather/environmental challenge | 10 | Perfect calm = 3–4; dramatic or difficult conditions = 7–10 |

### Scoring philosophy
The system rewards **intentionality and effort**, not just lucky weather. A spectacular sky at a roadside pull-off scores lower than a modest sky earned at the top of a difficult pre-dawn hike. This is the show's core tension and should be explained on-camera in E01.

A score of 100 is the theoretical perfect sunrise — the show's ultimate objective and the definition of "Finding Zora."

### AI-assisted Eos Index scoring

The admin log form includes an AI-assisted scoring flow that uses Claude to seed Eos Index sub-scores from a sunrise photo.

**The flow:**

1. In the Eos Index section of `/admin/log`, a "Score with Claude" button sits above the sub-score inputs
2. Clicking it opens a panel with:
   - A pre-built prompt (read-only textarea) containing the full Eos Index rubric, sub-score ranges, and scoring philosophy — plus instructions for Claude to return structured JSON
   - A "Copy prompt" button
   - A JSON input textarea labeled "Paste Claude's response"
   - An "Apply scores" button (disabled until valid JSON is pasted)
3. The user copies the prompt, opens Claude (claude.ai or the API), pastes it along with the sunrise photo
4. Claude analyzes the image against the rubric and returns a JSON object
5. The user pastes Claude's JSON response back into the input field
6. "Apply scores" parses the JSON and auto-fills all Eos Index sub-score fields in the form
7. The live `<ExpeditionCard>` preview updates immediately with the AI-suggested scores
8. The user adjusts any sub-scores as needed before saving — Claude's output is a starting point, not final

**The prompt template:**

The generated prompt must include:
- The full Eos Index rubric (Sky, Setting, Conditions with all sub-components and max values)
- The scoring philosophy ("rewards intentionality and effort, not just lucky weather")
- Contextual fields from the form if already filled: location name, trail/position, effort rating
- Instruction to evaluate the attached photo and return ONLY a JSON object — no explanation
- Instruction to include a brief `rationale` string per sub-score (displayed as helper text in the form)

**The JSON schema (Claude's output):**

```json
{
  "eos_index": {
    "sky": {
      "color_intensity": { "score": 14, "max": 20, "rationale": "Strong orange-to-pink gradient but narrow band above ridge" },
      "cloud_engagement": { "score": 11, "max": 15, "rationale": "Mid-level clouds lit from below, good structure" },
      "horizon_definition": { "score": 9, "max": 15, "rationale": "Mountain ridgeline obscures disk — glow only" }
    },
    "setting": {
      "foreground_composition": { "score": 12, "max": 15, "rationale": "Saguaro silhouettes provide strong layering" },
      "location_uniqueness": { "score": 13, "max": 15, "rationale": "Superstition Mountains — iconic and visually distinct" }
    },
    "conditions": {
      "access_difficulty": { "score": 4, "max": 10, "rationale": "Short moderate trail, paved access" },
      "weather_challenge": { "score": 3, "max": 10, "rationale": "Calm, mild conditions — no adversity" }
    }
  }
}
```

**UI behavior:**
- Sub-score input fields show Claude's rationale as helper text beneath each slider/input after scores are applied
- Changed scores (user overrides) are visually distinguished from AI-suggested scores (e.g., amber highlight on modified fields)
- The JSON input validates on paste — malformed JSON shows an inline error
- "Reset to AI scores" link appears after any manual override, allowing the user to revert individual fields
- The prompt regenerates dynamically if the user changes location or effort fields — the "Copy prompt" button always reflects current form state

**Two modes:**

1. **Direct mode** (default for authenticated host) — a "Score with Claude" button sends the sunrise photo and prompt directly to the Claude API via a server-side route (`/api/eos-score`). The API key is stored as a server-side environment variable (never exposed to the client). Results populate the form instantly — no copy-paste needed. The same JSON schema and rationale display applies.

2. **Copy-paste mode** (fallback / future community use) — for users without API access. The button opens the prompt panel, user copies it to claude.ai, pastes the JSON response back. No API key required. This is the path for any future public-facing version of the feature.

Mode selection: the server route checks for a configured `ANTHROPIC_API_KEY` env var. If present, direct mode is available. If not, the UI falls back to copy-paste mode automatically. No user configuration needed.

**Why both:**
- Direct mode removes friction for the host — upload photo, click, scores appear
- Copy-paste mode requires no API key, no cost, works with free Claude — accessible to anyone
- Both modes produce identical results — same prompt, same JSON schema, same form behavior
- The human is always in the loop — scores are suggestions, never auto-saved

---

## Effort Rating — Journey Difficulty (0–40 pts)

A single post-expedition assessment of the total difficulty of the journey. Replaces granular tracking of travel distance, elevation, weather, and timing with one honest judgment call. Points scale non-linearly — each level represents a significantly harder commitment than the last.

| Level | Label | Points | What this looks like |
|-------|-------|--------|---------------------|
| 1 | Roadside | 0 | Drove to a pulloff, watched from beside the vehicle |
| 2 | Trail | 5 | Deliberate outing with a real hike, a meaningful drive, or both |
| 3 | Summit | 15 | Serious pre-dawn ascent, long approach, significant elevation |
| 4 | Remote | 25 | Real logistics: long travel, off-pavement, backcountry, harsh weather |
| 5 | Expedition | 40 | Full commitment: international travel, multi-day approach, extreme conditions |

The details that inform the rating (distance driven, elevation gained, arrival time, weather) are noted in the expedition log for context but are not individually scored.

---

## Consecutive Episode Streak

The streak is earned by completing all 6 outings for a level within 6 calendar weeks. It is a **visual honor only** — the earned medallion gains a sunburst crown (permanently distinguishing it from a non-streak medallion), and a gold bar appears on the expedition share card. The streak does not add points to the Zora Score.

---

## Level-Up System — Medallion Progression

### Philosophy
Leveling is driven purely by participation. Each level requires 6 completed expeditions — score has no effect on progression. Show up, do the work, level up.

Level 10 "Finding Zora" is the show's narrative endpoint. Every episode, every scored sunrise, every earned medallion is a step toward it.

### Level Thresholds

| Level | Title | Expeditions required |
|-------|-------|---------------------|
| 0 | Scout | 0 (starting rank) |
| 1 | Trailhead | 6 |
| 2 | Desert Fox | 12 |
| 3 | Dawnchaser | 18 |
| 4 | First Light | 24 |
| 5 | Horizon Hunter | 30 |
| 6 | Zora Seeker | 36 |
| 7 | Dawn Keeper | 42 |
| 8 | Eos Adept | 48 |
| 9 | Zora Master | 54 |
| 10 | Finding Zora | 60 |

### The Medallion

Each of the 10 earned levels (1–10) has a unique medallion. Scout (Level 0) has its own starting token. Each medallion is:

- A circular coin rendered in 3D with depth, lighting, and a distinct metallic hue
- Six recessed sundog-shaped gem slots around the edge
- A ghost impression of the level emblem engraved on the face when empty
- Gems fill one at a time as the player progresses toward the next level threshold
- On the 6th gem: the medallion "awakens" — the emblem fully engraves, the coin glistens, an achievement sound plays
- Streak bonus (all 6 outings within 6 weeks): a sunburst crown of rays appears outside the coin edge with its own reveal animation and sound — a visually unmistakable distinction from a base-completion medallion

**Sundog gem shape:** elongated teardrop/compass-pointer form — thematically precise (atmospheric halo arcs beside the sun).

**Streak crown design:** 36 alternating long/short rays extending beyond the coin rim, diamond-tipped major rays, connecting outer ring — clearly distinguishable from a non-streak medallion at a glance.

### Medallion Palette

Each level has a distinct metallic hue and a matched gemstone color:

| Level | Title | Metal | Gem |
|-------|-------|-------|-----|
| 0 | Scout | Brushed pewter | None — compass rose or sun-ring engraving only |
| 1 | Trailhead | Copper | Rose quartz (blush pink) |
| 2 | Desert Fox | Warm bronze | Amber topaz |
| 3 | Dawnchaser | Antique gold | Citrine (golden yellow) |
| 4 | First Light | Rose gold | Fire opal (orange-red) |
| 5 | Horizon Hunter | Brushed silver | Aquamarine (pale blue) |
| 6 | Zora Seeker | Cool platinum | Amethyst (violet) |
| 7 | Dawn Keeper | Dark oxidized gold | Deep ruby (crimson) |
| 8 | Eos Adept | Verdigris bronze | Teal tourmaline (Eos color — intentional) |
| 9 | Zora Master | Blackened silver | Moonstone (iridescent white) |
| 10 | Finding Zora | Polished white gold | Diamond (pure light) |

**Scout (Level 0):** Pewter disc with a dignified engraving — compass rose or sun-ring. No gem slots visible. Reads as a starting token, not an incomplete medallion.

**Eos Adept (Level 8):** Teal gem is the only instance of teal in the medallion system. Justified because the level name directly invokes the Eos scoring system.

**Finding Zora (Level 10):** Categorically different from all others — white gold and diamond. The visual endpoint of the arc.

### Notes
- Level progression is driven by expedition count (6 outings per level) — score does not affect leveling
- Level-up moments get 90 seconds of dedicated on-camera time at episode end
- Streak bonus requires all 6 outings within 6 calendar weeks
- Virtual display case on website shows all earned medallions
- Physical medallion merch is a future consideration for superfans
- Level names are never displayed on the expedition share card — the medallion icon communicates level identity visually

### Episode display rule — opening state + closing ceremony

Each episode's dynamic title card displays the player's **opening state**: their current rank and gem count *at the start* of that expedition. The episode then ends with a ceremony that places the next gem or, on the 6th gem, awakens the current medallion's emblem. The next episode's title card shows what was earned in the previous episode's closing ceremony.

Worked examples:

- **Episode 1** opens as Scout with 0 gems and closes with a Scout → Trailhead transition ceremony placing the first Trailhead gem.
- **Episode 2** opens as Trailhead with 1 of 6 gems set.
- **Episode 6** opens as Trailhead with 5 of 6 gems set, and closes with the Trailhead awakening (emblem reveals on the 6th gem).
- **Episode 7** opens as Trailhead complete and Desert Fox 0 of 6, and closes with the Trailhead → Desert Fox transition ceremony placing the first Desert Fox gem.

Implication: **Scout is no longer purely implicit lore** — it is the actual displayed starting state of Episode 1. The viewer sees the Scout token on screen, then watches the player earn their way out of it.

### The three ceremony types

Each episode ends with one of three ceremony types depending on which gem is being placed in the 6-episode arc. This creates a small-small-small-small-small-big rhythmic pattern across each arc.

| # | Ceremony | When it fires | What happens | Production scope |
|---|----------|--------------|--------------|------------------|
| 1 | **Medallion transition ceremony** | End of every "gem 1" episode in a new arc — episodes 1, 7, 13, 19, 25, 31, 37, 43, 49, 55 | The new medallion appears and the first gem places | Larger scope than a single gem placement |
| 2 | **Single gem placement ceremony** | End of episodes 2–5 within each 6-episode arc (gems 2, 3, 4, 5) | The existing medallion gains a single new gem with a soft chime | Smaller scope |
| 3 | **Medallion awakening ceremony** | End of every "gem 6" episode — episodes 6, 12, 18, 24, 30, 36, 42, 48, 54, 60 | The 6th gem places and the medallion's emblem fully reveals (the ghost becomes the engraved emblem) | Largest scope of the three |

The pattern across each 6-episode arc is therefore: **transition → small → small → small → small → awakening**. Production planning should budget the heavier ceremony work against episodes 1 and 6 of each arc.

---

## Badge System

Badges replace gear unlocks as sub-objectives. Badge collection is a secondary goal alongside medallion progression. The log tracks when items are recorded; badges represent collection achievement milestones. Full badge structure is TBD.

> **Gear unlocks removed.** The original level-up table with gear unlock rewards has been superseded by the medallion + badge system. The equipment section of this document remains as a planning reference but is no longer tied to level gates.

---

## Expedition Share Card

A single shareable visual artifact generated per episode. Tells the whole story at a glance.

### Layout (confirmed direction)
- Photo dominates the upper portion (the sunrise image)
- Top-left: location name + date
- Top-right: completed medallion icon for the player's current level (no level name text)
- Streak earned: amber bar at the very top of the photo zone
- Score zone: large Eos Index number in teal (monospace) left side; effort indicator right side
- Effort indicator: 5 sundog shapes (filled amber = effort level) + single word label (Roadside / Trail / Summit / Remote / Expedition)
- Stats strip: elevation, distance, pre-dawn arrival time, conditions
- Footer: "the zora files" brand mark only

### Medallion icon on card
- Positioned top-right corner
- Shows the **completed** medallion for the player's current level — all 6 gems set, etching present
- If streak was earned on that medallion, the streak crown is visible on the icon
- Scout (Level 0) shows the Scout starting token
- When actual medallion artwork is finalized, it replaces the canvas-drawn placeholder at icon size

### Scoring on card
- The Eos Index is the primary score displayed (large teal number)
- The Effort Rating is shown via 5 sundog shapes (filled = effort level) + label
- The Zora Score is not displayed as a separate number on the card — the Eos Index and effort sundogs tell the story visually
- Stats strip (elevation, distance, pre-dawn, conditions) provides contextual flavor, not scoring inputs

---

## Social / Community Architecture

### Watch system
The watch system is a social feed layer only — not a competitive structure. Members share activity feeds and expedition logs. No head-to-head scoring, no synced scoring sessions, no group adjudication.

### Group play
Each player scores independently. No exceptions. Group outings are social, not mechanically linked.

---

## Discovery Log System

### Point values by rarity tier
Points scale non-linearly — each rarity jump carries significantly more weight, like story points. A single very rare find can rival a full effort rating.

| Tier | Examples | Points |
|------|---------|--------|
| Common | Gambel's Quail, Cactus Wren, Cottontail | 5–10 |
| Uncommon | Gila Woodpecker, Rock Wren, Roadrunner | 15–25 |
| Rare | Vermilion Flycatcher, Osprey, Javelina | 35–50 |
| Very rare | Bald Eagle, Desert Tortoise, Chuckwalla | 65–85 |
| Exceptional | Once-per-series finds | 100–150 |

### Discovery types tracked
- Wildlife species (birds, mammals, reptiles, insects)
- Plant species (notable or rare)
- Geographic features (formations, water bodies, elevation records)
- Historical/cultural sites (petroglyphs, ruins, landmarks)

### UI behavior
- Each unlock gets a dedicated card in the Discovery Log
- Card shows: species name, episode found, point value, photo, fun fact
- Running total displayed on home page
- "New species unlocked" moment in each episode

---

## Records Board & Leaderboard

The leaderboard tracks top Eos Index scores. It is a record board — documentary, not adversarial. The framing is "these are the scores that have been earned," not a competitive ranking. Group play is each player scoring independently; there is no head-to-head mechanic.

### Record categories

| Record | Current holder | Score/Value | Episode |
|--------|---------------|-------------|---------|
| Highest Eos Index score | TBD | — | — |
| Highest Zora Score | TBD | — | — |
| Most discoveries in one expedition | TBD | — | — |
| Most unusual location | TBD | — | — |
| Longest consecutive streak | TBD | — | — |
| Total Discovery Log entries | — | 0 | — |

New record categories may be added as the pursuit evolves (e.g., highest elevation, furthest expedition).

---

## Episode Format

### Structure (target 15–20 min)
1. **Cold open** (30–60 sec) — trailhead/vehicle, target location, current leaderboard position
2. **The approach** — pre-dawn travel, road conditions, gear talk lives here naturally
3. **Discovery window** — dark-to-dawn wildlife and feature hunting
4. **The sunrise** — camera locked down, scoring live
5. **The verdict** — Eos Index breakdown, effort rating, discoveries, Zora Score total, leaderboard update, 60–90 sec max

### Naming convention
- `S01E01 — "The Benchmark" — Lost Dutchman SP`
- `S01E02 — "The Habitat Flip" — Butcher Jones / Saguaro Lake`
- `S01E03 — "The Time Capsule" — Hieroglyphic Trail, Gold Canyon`

---

## First Three Episodes

### E01 — "The Benchmark"
- **Location:** Lost Dutchman State Park, Apache Junction, AZ
- **Coordinates:** 33.4638, -111.4812
- **Drive from Queen Creek:** ~35 min
- **Recommended trail:** Prospector's View (0.7 mi, moderate)
- **Arrive:** 45 min before sunrise
- **Fee:** $10/vehicle
- **Purpose:** Establish the format, introduce the scoring system on-camera, familiar terrain
- **Discovery targets:** Gambel's Quail, Cactus Wren, Gila Woodpecker, Coyote, Javelina
- **Sunrise note:** Sun rises behind the mountains — glow builds above ridgeline, not disk emergence

### E02 — "The Habitat Flip"
- **Location:** Butcher Jones Recreation Site / Saguaro Lake, Fort McDowell, AZ
- **Coordinates:** 33.5767, -111.5147
- **Drive from Queen Creek:** ~50 min
- **Recommended position:** Northwest parking lot near the wash
- **Arrive:** Just before 7AM (gate opens at 7AM — verify early access)
- **Fee:** Tonto Pass required ($8/day or annual)
- **Purpose:** Habitat contrast — riparian/water vs. desert. Sunrise over open water.
- **Discovery targets:** Great Blue Heron, Great Egret, Osprey, Vermilion Flycatcher, Bald Eagle (winter), Mule Deer
- **Sunrise note:** Open water horizon — highest scoring ceiling in Phoenix region

### E03 — "The Time Capsule"
- **Location:** Hieroglyphic Trailhead, Gold Canyon, AZ
- **Coordinates:** 33.3901, -111.4233
- **Drive from Queen Creek:** ~25 min
- **Trail:** 2.8 mi out-and-back to Hohokam petroglyph panel
- **Opens:** 5AM — best pre-dawn access of the three
- **Fee:** Free (limited parking — arrive very early or weekday)
- **Purpose:** Deep edutainment — 1,500-year-old Hohokam petroglyphs, canyon framing
- **Discovery targets:** Rock Wren, Roadrunner, Desert Tortoise, Chuckwalla, Canyon Towhee, Cooper's Hawk
- **Sunrise note:** Canyon position delays disk emergence but canyon wall light show is exceptional
- **Key content moment:** Explain Hohokam history, tinajas (natural water basins), why these carvings exist

---

## Production Workflow

### Pre-shoot
1. Check sunrise time (timeanddate.com)
2. Check weather forecast — look for cloud cover (good for scoring) vs. clear (moderate sky score)
3. Check moon phase — dark moon = better pre-dawn shots
4. Review eBird recent sightings for the location
5. Sync device clocks for multi-cam editing
6. Charge all batteries the night before

### On location
- Device clocks synced for multi-cam editing
- Filmic Pro: manual WB 4000K, 24fps, ISO low, lock before sunrise
- Locked timelapse running from tripod — don't disturb it
- Merlin Bird ID: passive sound logging from arrival
- iNaturalist: photo ID all wildlife and plants
- GoPro: always-on wide POV during approach and discovery window

### Post-production
1. Ingest all clips via Hedge to organized folder
2. Sync all cameras in DaVinci Resolve via timestamp (clocks were synced on location)
3. Edit long-form in DaVinci Resolve
4. Score episode using Eos Index rubric
5. Export to Descript for transcript-based talk segment editing
6. Export short clips via OpusClip for TikTok/Reels
7. Final polish on short clips in CapCut
8. Upload YouTube first, then cross-post

### Color grade
- Consistent LUT applied every episode — develop in DaVinci before E01
- Warm amber-shifted grade for golden hour footage
- Cooler blue-shifted grade for pre-dawn / blue hour footage
- Eos Index score reveal segment: consistent motion graphic template

---

## Tech Stack — thezorafiles.com

### Recommended
- **Framework:** Next.js (React) — good for SEO, fast, easy to deploy
- **Hosting:** Vercel — free tier sufficient to start, deploys from GitHub
- **Database:** Supabase (Postgres) — free tier, stores Eos Index scores, discovery log, records
- **CMS:** Markdown files in repo for episode content
- **Email:** Google Workspace → hello@thezorafiles.com
- **Domain:** Cloudflare (already registered)
- **DNS:** Point Cloudflare DNS to Vercel

### Key data models

```typescript
// Episode
{
  id: string
  episode_number: number
  season: number
  title: string
  location_name: string
  country: string                    // never assume Arizona
  region?: string                    // state/province if applicable
  coordinates: { lat: number, lng: number }
  shoot_date: Date
  publish_date: Date
  youtube_url: string

  eos_score: {
    sky: number                      // max 50
    setting: number                  // max 30
    conditions: number               // max 20
    total: number                    // max 100
  }

  effort_rating: number              // 1–5 (Roadside/Trail/Summit/Remote/Expedition)
  effort_points: number              // 0, 5, 15, 25, or 40 (non-linear)

  zora_score: {
    eos_index: number                // from above
    effort_points: number            // from effort rating
    discovery_points: number
    total: number                    // Eos Index + Effort + Discovery
  }

  // Contextual details (not scored, for the expedition log)
  distance_miles?: number
  elevation_gain_ft?: number
  minutes_before_sunrise?: number
  weather_notes?: string
  streak_active: boolean             // visual honor, not scored

  thumbnail_url: string
  notes: string
}

// Discovery
{
  id: string
  episode_id: string
  type: 'wildlife' | 'plant' | 'geographic' | 'cultural_historical'
  name: string
  scientific_name?: string
  country: string                    // where it was found — not assumed
  rarity_tier: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'exceptional'
  points: number
  photo_url: string
  fun_fact: string
  first_spotted: Date
  location_name: string
  is_first_unlock: boolean
  subsequent_find_number?: number    // 1, 2, 3... for rare+ repeats
}

// Record
{
  id: string
  category: string                   // "Highest elevation", "Best water view", etc.
  value: string                      // "4,287 ft" or "Saguaro Lake"
  episode_id: string
  set_date: Date
  previous_holder?: string           // episode that held it before
}

// PlayerProgress
{
  id: string
  user_id: string                    // supports community/watch group members
  current_level: number              // 0–10
  current_level_title: string
  cumulative_zora_score: number      // running total across all expeditions (leaderboard, not leveling)
  expeditions_to_next_level: number  // 6 per level — countdown to next medallion
  expeditions_total: number
  streak_count: number               // consecutive expeditions on cadence
  streak_active: boolean             // currently maintaining streak
  medallions_earned: MedallionRecord[]
  badges_earned: string[]
}

// MedallionRecord
{
  level: number
  earned_date: Date
  streak_bonus: boolean              // all 6 outings completed within 6 weeks
  expedition_number_at_earn: number  // which expedition number triggered the level-up
}
```

---

## Equipment

### Current gear
- Samsung S25 Ultra (primary camera)

### Tier 1 — acquire first
| Item | Approx cost | Purpose |
|------|-------------|---------|
| DJI Mini 4 Pro | $760 | Aerial — establishing shots, sunrise overheads |
| DJI OM 7 Gimbal | $150 | Phone stabilization for walking footage |
| Joby GorillaPod 3K + phone mount | $80 | Locked sunrise timelapse mount |
| DJI Mic 2 | $200 | Wireless audio — eliminates wind noise |

### Tier 2 — acquire soon
| Item | Approx cost | Purpose |
|------|-------------|---------|
| GoPro Hero 13 Black | $400 | Always-on wide angle POV |
| Vortex Solo 8x36 Monocular | $100 | Spot wildlife before committing to filming |
| Rode VideoMicro II | $80 | Backup/ambient audio |
| Zeiss ExoLens Wide Angle clip-on | $70 | Extended FOV for big sky shots |

### Tier 3 — level up
| Item | Approx cost | Purpose |
|------|-------------|---------|
| DJI Osmo Action 5 Pro | $350 | Second action cam with front-facing screen |
| Anker PowerHouse 100 | $150 | In-vehicle charging station |
| Insta360 X4 | $500 | 360° — reframe in any direction in post |
| Celestron Nature DX 8x42 Binoculars | $120 | Full optics for serious wildlife scanning |

---

## Software Stack

| Tool | Cost | Purpose |
|------|------|---------|
| DaVinci Resolve | Free | Primary editor, multi-cam sync, color grade |
| Filmic Pro | ~$15 | Manual camera control on S25 Ultra |
| Descript | $16–24/mo | Text-based editing for talk segments |
| OpusClip | ~$29/mo | Auto-clip long episodes into shorts |
| CapCut | Free | Short-form polish for TikTok/Reels |
| Merlin Bird ID | Free | Passive bird ID by sound on location |
| iNaturalist | Free | Photo ID for wildlife, plants, insects |
| eBird | Free | Pre-shoot species intelligence |
| PhotoPills | ~$12 | Sunrise position planning by GPS + date |
| Adobe Lightroom Mobile | Free tier | RAW capture and color grade on phone |
| TubeBuddy or VidIQ | ~$10–20/mo | YouTube SEO and keyword research |
| Buffer | Free tier | Cross-platform scheduling |
| Hedge | ~$49/yr | Media ingest and organization |

---

## Launch Checklist

### Immediate (this week)
- [ ] Set up Google Workspace → hello@thezorafiles.com
- [ ] Connect hello@ to YouTube channel Google account
- [ ] Write consistent bio across YouTube, Instagram, TikTok
- [ ] Upload placeholder channel banner to YouTube
- [ ] Register X/Twitter @thezorafiles (defensive)
- [ ] Install Merlin Bird ID, iNaturalist, eBird, PhotoPills on S25 Ultra

### Before shooting E01
- [ ] Acquire Tier 1 gear (DJI Mic 2 and GorillaPod minimum)
- [ ] Set up DaVinci Resolve project with episode template
- [ ] Develop color grade LUT — test on existing footage
- [ ] Design channel icon — amber sunrise motif or Zora wordmark
- [ ] Design thumbnail template — consistent visual language

### Before publishing E01
- [ ] Film channel trailer (60–90 sec — concept + scoring system explanation)
- [ ] Shoot and edit E01, E02, E03 — never launch with one episode
- [ ] Build thezorafiles.com home page and Eos Index leaderboard
- [ ] Build Discovery Log page
- [ ] Upload channel trailer — this plays before episodes exist

### Publishing rhythm
- Upload E01 → wait 1 week → E02 → wait 1 week → E03
- This trains the algorithm and gives early subscribers a reason to stay

---

## Decisions Log

Key decision points and their rationale. Details are documented in the relevant sections above — this log captures *when and why* things changed.

- **2026-03** — Concept originated from morning nature walks in Queen Creek/Chandler Heights area
- **2026-03** — Zora chosen over Akatsuki, Fajr, Madrugada for brevity and owability
- **2026-03** — Eos Index chosen as scoring system name — clinical, precise, named after the goddess of dawn
- **2026-03** — Geographic scope confirmed as global — Arizona is home base and brand identity, not a constraint
- **2026-03** — Point-based level progression replaced with Medallion System — participation-gated, not performance-gated
- **2026-03** — Gear unlocks removed; badge system replaces them as sub-objectives (structure TBD)
- **2026-03** — Desert Fox medallion (Level 2) design reference built — established the visual design system for all subsequent medallions
- **2026-03-21** — Zora Score simplified: all granular bonus categories replaced with a single Effort Rating (5 levels, 0–20 pts). Streak became visual honor only — no points
- **2026-03-21** — Level progression confirmed as purely participation-gated: 6 expeditions per level, score irrelevant
- **2026-03-21** — Share card scoring resolved: Eos Index as primary display, effort via sundog indicators, Zora Score not shown as separate number
- **2026-04-20** — Effort Rating scale changed from linear 0–20 (0/5/10/15/20) to non-linear 0–40 (0/5/15/25/40). Rationale: linear scale undervalued Expedition-tier commitment relative to Roadside. Non-linear spacing makes each level a meaningfully harder step, so a true Expedition-level outing can rival the Eos Index itself as a scoring input. Migration file: `docs/sql/update-effort-points.sql`
- **2026-04-26** — Twilight violet (`#7A5FB8`) added to the brand palette as the dedicated Discovery accent. Used on Discovery Log UI, share card discovery stats strip, and the Discovery row in the Zora Score intro motion graphic. Pairs chromatically with amber, teal, and sunrise without overlap.
- **2026-04-26** — Episode display rule formalized: each episode's title card shows the player's *opening state* (rank + gem count at the start of the expedition); the closing ceremony places the next gem or awakens the medallion. Scout is therefore an explicit on-screen starting state for Episode 1, not implicit lore.
- **2026-04-26** — Three ceremony types defined: medallion transition (gem 1, episodes 1/7/13/…), single gem placement (gems 2–5), and medallion awakening (gem 6, episodes 6/12/18/…). Pattern: transition → small × 4 → awakening across each 6-episode arc. Production planning budgets heavier ceremony work against episodes 1 and 6 of each arc.
- **2026-04-26** — Records Board confirmed to start fresh with all-TBD values. The pre-series Eos Index 85 (ocean cliff calibration photo) is *calibration context only* and not an active record entry — Season 1 is the first show data on the board.