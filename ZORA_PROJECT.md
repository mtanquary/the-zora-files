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

> **Design principle:** Never hardcode Arizona or "desert" as assumptions in the website architecture, data models, or UI copy. Location fields, discovery categories, and scoring components must work equally for a Icelandic volcano, a Scottish coastline, or a Sonoran wash.

---

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Pre-dawn | `#0D0F14` | Dark backgrounds, hero sections |
| Zora amber | `#F0A500` | Primary accent — titles, highlights, UI |
| Sunrise orange | `#E8520A` | Secondary accent — conditions score bar |
| Eos teal | `#1D9E75` | Eos Index branding only — setting score bar |
| Dawn mist | `#C8D4E0` | Body text on dark backgrounds |

**Rules:**
- Amber is the primary accent across all platforms
- Teal is reserved exclusively for Eos Index elements
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
/                   → Home — latest episode hero, current Eos Index leader, subscribe CTA
/eos-index          → Full leaderboard — all scored episodes, sortable
/discovery-log      → Species + feature unlocks — every discovery with point value and episode
/records            → All-time bests — highest elevation, best road, best water view, etc.
/episodes           → Episode archive with scores and locations
/about              → The concept, the host, the mission
```

### Home page sections
1. Hero — channel name, tagline, latest episode embed
2. Current series leader — highest Eos Index score to date
3. Recent episodes — last 3, with score badges
4. Discovery Log preview — last 5 unlocks
5. Subscribe CTA — YouTube + newsletter

---

## Scoring System — Two Named Components

### How they relate
```
ZORA SCORE = Eos Index + Discovery Points + Travel Points + Conditions Points
```
- **Eos Index** is the pure sunrise quality score (0–100). Photography-focused viewers follow this.
- **Zora Score** is the full episode score. Adventure-focused viewers follow this.
- Both are displayed every episode. The Eos Index is the largest single contributor to the Zora Score.
- Theoretical maximum Zora Score: ~215 points (perfect episode across all categories).

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
| Effort to reach | 10 | Roadside pull-off = 1–2; serious pre-dawn hike = 8–10 |
| Weather/environmental challenge | 10 | Perfect calm = 3–4; dramatic or difficult conditions = 7–10 |

### Scoring philosophy
The system rewards **intentionality and effort**, not just lucky weather. A spectacular sky at a roadside pull-off scores lower than a modest sky earned at the top of a difficult pre-dawn hike. This is the show's core tension and should be explained on-camera in E01.

A score of 100 is the theoretical perfect sunrise — the show's ultimate objective and the definition of "Finding Zora."

---

## Zora Score — Additional Points (stacks on top of Eos Index)

### Travel Distance
| Distance | Points |
|----------|--------|
| 0–5 mi | 0 |
| 6–15 mi | 1 |
| 16–30 mi | 2 |
| 31–75 mi | 3 |
| 76–150 mi | 4 |
| 150+ mi | 5 |

### Travel Difficulty Bonuses (stackable)
| Condition | Points |
|-----------|--------|
| At least 1 mile off-pavement | +1 |
| At least 1 mile requiring high-clearance vehicle | +1 |
| Any mode other than car/truck (boat, plane, train, etc.) | +1 |
| International — outside continental US | +3 |

### Elevation Gain
| Gain | Points |
|------|--------|
| 0–200 ft | 0 |
| 201–500 ft | 1 |
| 501–1,000 ft | 2 |
| 1,001–2,000 ft | 3 |
| 2,000+ ft | 4 |

### Pre-Dawn Arrival Bonus
| Arrival before sunrise | Points |
|----------------------|--------|
| 30–59 min early | 1 |
| 60+ min early | 2 |
Verified by camera metadata timestamp.

### Weather Adversity
| Conditions | Points |
|-----------|--------|
| Perfect calm morning | 0 |
| Notable cold or wind | 1 |
| Rain or snow present | 2 |
| Genuinely difficult — nearly turned back | 3 |

### Discovery Points
First unlock by rarity tier:
| Tier | First unlock | Subsequent finds |
|------|-------------|-----------------|
| Common | 5–10 pts | 0 (no repeat scoring) |
| Uncommon | 15–20 pts | 0 (no repeat scoring) |
| Rare | 25–35 pts | 1 pt each (separate outings only) |
| Very rare | 40–50 pts | 1 pt each (separate outings only) |
| Exceptional | 60–75 pts | 1 pt each (separate outings only) |

Discovery categories:
- **Wildlife** — birds, mammals, reptiles, insects
- **Plants** — notable or rare species
- **Geographic** — formations, water bodies, elevation records
- **Cultural/Historical** — petroglyphs, ruins, abandoned structures, mining history (5–20 pts by significance)

### Human History Discovery (own category)
Ancient or significant human history sites — separate from wildlife/plant unlocks.
| Significance | Points |
|-------------|--------|
| Minor historical marker | 5 |
| Notable site (ruins, mining camp) | 10 |
| Significant site (petroglyphs, ceremonial) | 15–20 |

### Consecutive Episode Streak Bonus
+1 point for every 4 consecutive episodes published on schedule. Rewards discipline.

### Current leaderboard (from calibration shots)

| Rank | Location | Score | Notes |
|------|----------|-------|-------|
| 1 | Ocean cliff silhouette | 85 | Series benchmark — open ocean, coastal cliff hike |
| 2 | Mesa canyon starburst | 73 | Mesa silhouettes framing sun through saddle |
| 3 | Airport tarmac | 67 | Near-perfect sky, zero effort — scoring system working as intended |
| 4 | Desert wildflowers | 62 | Sand verbena foreground, golden sunburst |
| 5 | Saguaro silhouette | 60 | Single saguaro, clean gradient, mountain backdrop |
| 6 | Desert saguaro trail | 58 | Rocky trail leading lines, strong silhouettes |
| 7 | Sandy wash road | 54 | Ground-level composition, muted amber haze |
| 8 | Ponderosa pine forest | 53 | Forest blocks sky — high setting, penalized sky |
| 9 | Suburban crepuscular | 50 | Spectacular rays, power lines and rooftops hurt it |
| 9 | High desert silhouette | 50 | Elegant blush gradient, minimalist |
| 11 | Riparian canal | 45 | Suburban houses visible in background |

---

## Level-Up System — D&D Style Progression

### Philosophy
Leveling up takes roughly 6 outings at average performance (~80 Zora Score per episode).
Each level unlocks a specific piece of gear — building the justification for equipment spend into the game itself.
Thresholds increase gradually as levels rise, reflecting growing capability and range.

### Calibration
- Average Zora Score per episode: ~80 pts
- Target: ~6 outings per level
- Points per level: ~480 (early) scaling to ~1,000 (late)

### Level Table

| Level | Title | Points to reach | Cumulative | Gear Unlock |
|-------|-------|----------------|------------|-------------|
| 0 | **Scout** | — | 0 | Phone + existing kit |
| 1 | **Trailhead** | 480 | 480 | DJI Mic 2 + Joby GorillaPod |
| 2 | **Desert Fox** | 500 | 980 | DJI OM 7 Gimbal |
| 3 | **Dawnchaser** | 520 | 1,500 | GoPro Hero 13 Black |
| 4 | **First Light** | 540 | 2,040 | DJI Mini 4 Pro (drone) |
| 5 | **Horizon Hunter** | 560 | 2,600 | Vortex Monocular + optics kit |
| 6 | **Zora Seeker** | 600 | 3,200 | DJI Osmo Action 5 Pro |
| 7 | **Dawn Keeper** | 650 | 3,850 | Insta360 X4 |
| 8 | **Eos Adept** | 700 | 4,550 | Premium tripod + slider system |
| 9 | **Zora Master** | 800 | 5,350 | TBD — viewer vote or personal milestone |
| 10 | **Finding Zora** | 1,000 | 6,350 | The perfect sunrise — the show's ultimate objective |

### Notes
- Level 4 (drone unlock) is intentional — it appears after ~24 outings of proven commitment
- Level 10 "Finding Zora" has no gear reward — it IS the reward. The show's narrative endpoint.
- Level titles are working placeholders — the host should own these personally before publishing
- Level-up moments get 90 seconds of dedicated on-camera time at episode end
- Website shows current level + progress bar toward next threshold

---

## Discovery Log System

### Point values by rarity tier
| Tier | Examples | Points |
|------|---------|--------|
| Common | Gambel's Quail, Cactus Wren, Cottontail | 5–10 |
| Uncommon | Gila Woodpecker, Rock Wren, Roadrunner | 15–20 |
| Rare | Vermilion Flycatcher, Osprey, Javelina | 25–35 |
| Very rare | Bald Eagle, Desert Tortoise, Chuckwalla | 40–50 |
| Exceptional | Once-per-series finds | 60–75 |

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

## Records Board (ongoing)

| Record | Current holder | Score/Value | Episode |
|--------|---------------|-------------|---------|
| Best Eos Index score | Ocean cliff | 85 | Calibration |
| Highest elevation | TBD | — | — |
| Hardest road travelled | TBD | — | — |
| Best water view | TBD | — | — |
| Most unusual location | TBD | — | — |
| Most species in one episode | TBD | — | — |

---

## Episode Format

### Structure (target 15–20 min)
1. **Cold open** (30–60 sec) — trailhead/vehicle, target location, current leaderboard position
2. **The approach** — pre-dawn travel, road conditions, gear talk lives here naturally
3. **Discovery window** — dark-to-dawn wildlife and feature hunting
4. **The sunrise** — camera locked down, scoring live
5. **The verdict** — score breakdown, leaderboard update, 60–90 sec max

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
5. Sync all device clocks via their apps before leaving
6. Charge all batteries the night before

### On location
- All devices clock-synced on arrival
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
- **CMS:** Markdown files in repo for episode content, or Notion as headless CMS
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

  zora_score: {
    eos_index: number                // from above
    discovery_points: number
    travel_distance_points: number
    travel_difficulty_bonus: number
    elevation_points: number
    predawn_bonus: number
    weather_adversity: number
    streak_bonus: number
    total: number                    // theoretical max ~215
  }

  travel: {
    distance_miles: number
    off_pavement_miles: number
    high_clearance: boolean
    alt_transport: boolean
    international: boolean
  }

  elevation_gain_ft: number
  minutes_before_sunrise: number     // for pre-dawn bonus verification
  weather_adversity_score: number    // 0–3
  thumbnail_url: string
  notes: string
}

// Discovery
{
  id: string
  episode_id: string
  type: 'wildlife' | 'plant' | 'geographic' | 'cultural' | 'historical'
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

// PlayerLevel
{
  current_level: number
  current_level_title: string
  total_zora_score: number
  points_to_next_level: number
  next_gear_unlock: string
  episode_count: number
  streak_current: number
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

## Notes & Decisions Log

- **2026-03** — Concept originated from morning nature walks in Queen Creek/Chandler Heights area
- **2026-03** — Zora chosen over Akatsuki, Fajr, Madrugada for brevity and owability
- **2026-03** — Eos Index chosen as scoring system name — clinical, named after Greek goddess of dawn
- **2026-03** — "The Zora Files" = channel name; "Finding Zora" = show name within channel
- **2026-03** — Calibration scoring session completed on 11 existing photos — ocean cliff holds series record at 85
- **2026-03** — All platform handles secured: @TheZoraFiles (YouTube), @thezorafiles (Instagram, TikTok)
- **2026-03** — Domain thezorafiles.com registered
- **2026-03** — Dual scoring system established: Eos Index (sunrise quality, 0–100) + Zora Score (full episode, ~215 max)
- **2026-03** — Level-up system added: D&D-style progression, ~6 outings per level, gear unlocks at each level
- **2026-03** — Geographic scope confirmed as global — Arizona/desert Southwest is home base and brand identity for early seasons; travel episodes are expeditions not a pivot; website architecture must never hardcode regional assumptions
- **2026-03** — International travel bonus: +3 pts to Zora Score for any outing outside continental US