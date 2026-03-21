# The Zora Files — Master Project Context
> This file is the source of truth for all brand, technical, and creative decisions.
> Last updated: 2026-03 (website design session)
> Update this file after every significant decision conversation.

---

## Brand Architecture

| Layer | Name | Purpose |
|-------|------|---------|
| Channel | The Zora Files | The full operation. Everything lives here. |
| Flagship series | Finding Zora | The sunrise quest. The game within the channel. |
| Scoring system (sunrise) | Eos Index | Sky · Setting · Conditions. 100 pts max per expedition. |
| Scoring system (full) | Zora Score | Complete expedition score. ~215 pts max. |

**Zora** — Slavic word for dawn. Chosen for brevity, owability, and direct meaning.
**Eos** — Greek goddess of dawn. Used for the scoring system name — clinical, precise, mythologically accurate.

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
| Dawn mist | `#C8D4E0` | Body text on dark backgrounds |

**Rules:**
- Amber is the primary accent across all platforms
- Teal is reserved exclusively for Eos Index elements
- Never use pure black (#000000) or pure white (#ffffff)
- Pre-dawn dark background is the signature look
- Dark mode only — no light mode toggle, ever
- All contrast ratios must meet WCAG AA minimum within the dark theme

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

## Scoring System — Two Named Components

### How they relate
```
ZORA SCORE = Eos Index + Discovery Points + Travel Points + Elevation Points
           + Pre-Dawn Bonus + Weather Adversity + Streak Bonus
```
- **Eos Index** is the pure sunrise quality score (0–100). Photography-focused viewers follow this.
- **Zora Score** is the full expedition score. Adventure-focused viewers follow this.
- Both are displayed every episode/expedition. The Eos Index is the largest single contributor.
- Theoretical maximum Zora Score: ~215 points (perfect expedition across all categories).
- **Never conflate or rename these two systems.**

---

## Eos Index — Sunrise Quality Score (0–100)

### Sky — 50 points
| Component | Max | Description |
|-----------|-----|-------------|
| Color intensity | 20 | Saturation, vividness, range of hues |
| Cloud engagement | 15 | Dramatic lit clouds score high; clear sky moderate; flat overcast low |
| Horizon definition | 15 | Clean readable horizon = high; obstructed or flat = low |

### Setting — 30 points
| Component | Max | Description |
|-----------|-----|-------------|
| Foreground composition | 15 | Trail, rock, water, flora, person — compelling element in frame |
| Location uniqueness | 15 | Suburban roadside = low; remote wilderness = high |

### Conditions — 20 points
| Component | Max | Description |
|-----------|-----|-------------|
| Effort to reach | 10 | Roadside pull-off = 1–2; serious pre-dawn hike = 8–10 |
| Weather/environmental challenge | 10 | Perfect calm = 3–4; dramatic or difficult = 7–10 |

### Scoring philosophy
The system rewards **intentionality and effort**, not just lucky weather. A spectacular sky at a roadside pull-off scores lower than a modest sky earned at the top of a difficult pre-dawn hike. This is the show's core tension and must be explained on-camera in E01.

A score of 100 is the theoretical perfect sunrise — the show's ultimate objective and the definition of "Finding Zora."

### AI scoring protocol
- The Eos Index is scored primarily by Claude vision analyzing the submitted sunrise photo
- Claude vision evaluates each sub-component independently and returns scores with brief reasoning
- Players may accept the AI score or challenge it through their Watch's vote process
- Every submission must have an AI-scored Eos Index — no exceptions, including honor-system Watches
- For global leaderboard consideration, EXIF timestamp verification is a hard requirement
- The AI quality gate (runs before scoring): image must be real outdoor photo, must contain sky and horizon, timestamp must fall within a plausible sunrise window for the coordinates, minimum resolution enforced

---

## Zora Score — Additional Points

### Travel Distance
Measured from player home base (or registered approximate location) to sunrise GPS coordinates.
Internal storage: kilometers. Display: user-preferred unit.

| Distance | Points |
|----------|--------|
| 0–5 mi (0–8 km) | 0 |
| 6–15 mi (9–24 km) | 1 |
| 16–30 mi (25–48 km) | 2 |
| 31–75 mi (49–120 km) | 3 |
| 76–150 mi (121–241 km) | 4 |
| 150+ mi (242+ km) | 5 |

### Travel Difficulty Bonuses (stackable)
| Condition | Points | Validation |
|-----------|--------|------------|
| At least 1 mile off-pavement | +1 | Honor system |
| At least 1 mile requiring high-clearance vehicle | +1 | Honor system |
| Any mode other than car/truck (boat, plane, train, etc.) | +1 | Honor system |
| International — outside continental US | +3 | Auto from GPS coordinates |

### Elevation Gain
Self-reported; players are encouraged to log with AllTrails or equivalent. Honor system.
Internal storage: meters. Display: user-preferred unit.

| Gain | Points |
|------|--------|
| 0–200 ft (0–60 m) | 0 |
| 201–500 ft (61–152 m) | 1 |
| 501–1,000 ft (153–304 m) | 2 |
| 1,001–2,000 ft (305–609 m) | 3 |
| 2,000+ ft (610+ m) | 4 |

### Pre-Dawn Arrival Bonus
Auto-computed from EXIF timestamp delta between arrival photo and sunrise photo,
cross-referenced against computed civil twilight time for the GPS location and date.

| Arrival before sunrise | Points |
|----------------------|--------|
| 30–59 min early | 1 |
| 60+ min early | 2 |

### Weather Adversity
Historical weather auto-pulled from Open-Meteo API (temperature, wind speed, precipitation)
for the logged GPS location and timestamp. Player reviews pre-populated data and self-reports
final adversity tier, prompted with contextual guidance.

| Conditions | Points |
|-----------|--------|
| Perfect calm morning | 0 |
| Notable cold or wind | 1 |
| Rain or snow present | 2 |
| Genuinely difficult — nearly turned back | 3 |

### Discovery Points
First unlock per player (not global, not per-Watch). Cannot be farmed.

| Tier | First unlock | Subsequent finds |
|------|-------------|-----------------|
| Common | 5–10 pts | 0 |
| Uncommon | 15–20 pts | 0 |
| Rare | 25–35 pts | +1 pt (separate outings only) |
| Very rare | 40–50 pts | +1 pt (separate outings only) |
| Exceptional | 60–75 pts | +1 pt (separate outings only) |

Discovery categories:
- **Wildlife** — birds, mammals, reptiles, insects
- **Plants** — notable or rare species
- **Geographic** — formations, water bodies, elevation records
- **Cultural/Historical** — petroglyphs, ruins, abandoned structures, mining history (5–20 pts by significance)

Human history sub-tier:
| Significance | Points |
|-------------|--------|
| Minor historical marker | 5 |
| Notable site (ruins, mining camp) | 10 |
| Significant site (petroglyphs, ceremonial) | 15–20 |

### Consecutive Expedition Streak Bonus
+1 point awarded when a player completes at least one qualifying expedition in each of 4 consecutive calendar weeks. Bonus is added to the score of the expedition that completes the 4th week. Streak resets if any calendar week passes with zero logged expeditions. Counter restarts from zero after each bonus award. Applies to all players. An 8-week streak earns two total bonus points.

### International Travel Bonus
+3 pts to Zora Score for any expedition outside continental US. Auto-detected from GPS. Stackable with travel difficulty bonuses.

---

## Eos Index — Auto-computation from EXIF Data

The following fields are computed automatically from uploaded photo EXIF metadata, player home location, and external APIs. Manual form entry is minimized.

### From arrival photo EXIF
- GPS coordinates → exact location pin
- Timestamp → arrival time
- GPS + timestamp → computed civil twilight/sunrise time (suncalc library, no API)
- Arrival timestamp vs. computed sunrise → pre-dawn arrival bonus (automated)

### From sunrise photo EXIF
- GPS coordinates → confirm location consistency with arrival photo
- Timestamp → confirm photo within valid sunrise window
- Timestamp delta vs. arrival photo → pre-dawn window verification

### From player home location + photo GPS
- Distance calculation → travel distance tier (automated)
- Continental US check → international bonus flag (automated)

### From GPS coordinates via external APIs (all free/open)
- Elevation at sunrise location → OpenTopoData
- Historical weather → Open-Meteo historical API
- Reverse geocoding → Nominatim (OpenStreetMap)

### Remaining manual entries (minimized)
- Off-pavement: yes/no toggle
- High-clearance required: yes/no toggle
- Non-car transport: yes/no + optional type
- Elevation gain: numeric entry (AllTrails encouraged)
- Discoveries: photo upload + category selection + optional name
- Weather adversity tier: player-confirmed after API pre-population
- Expedition notes/journal: free text

---

## Submission State Machine

Every expedition entry moves through defined states:

```
DRAFT
  → player submits arrival photo + sunrise photo
AI_SCORING
  → Claude Haiku: content moderation + validity gate (is this a real outdoor sunrise photo?)
  → If rejected: back to DRAFT with rejection reason
  → If passed: Claude vision scores Eos Index sub-components
  → EXIF extracted; weather/elevation auto-populated
  → Form presented to player for manual fields
PLAYER_REVIEW
  → Player accepts AI score → ACCEPTED (enters Watch leaderboard)
  → Player challenges AI score → WATCH_CHALLENGE
WATCH_CHALLENGE (72-hour window)
  → Minimum 3 Watch member votes required for valid outcome
  → If quorum not met: AI score stands → AI_UPHELD
  → Majority supports player: WATCH_ADJUSTED (adjusted score; enters Watch leaderboard)
  → Majority sides with AI: AI_UPHELD (original score; enters Watch leaderboard)
  → Tie: AI score stands → AI_UPHELD
GLOBAL_PENDING (triggered if score would enter global top-20)
  → Entry held pending host review; appears on Watch leaderboard only
  → Host adjudicates via admin panel → GLOBAL_CONFIRMED or GLOBAL_REJECTED
HONOR_ACCEPTED (honor-system Watches only)
  → No EXIF verification, no challenge process
  → Contributes to player level and Watch leaderboard only
  → Excluded from global leaderboards
  → Visually marked as "honor entry" in all UI contexts
```

### Score version stamping
Every ACCEPTED entry is stamped with the current rulebook version at time of scoring.
Scores are grandfathered — rulebook updates do not retroactively recalculate existing entries.

---

## Photo Submission Protocol

### Required photos
1. **Arrival photo** — taken upon reaching sunrise position, before civil twilight. Used for EXIF metadata verification only. Not scored visually.
2. **Sunrise photo** — taken at or during peak sunrise. This is the photo scored by Claude vision for the Eos Index.

### Supplemental photos
- Up to 8 additional photos per expedition (total of 10 including arrival + sunrise)
- Journey photos, discovery photos, gear shots, journal-style captures — all encouraged
- Not scored; appear in expedition log and contribute to the shared discovery catalog when tagged

### Technical requirements
- HEIC files accepted and converted server-side to JPEG (via `sharp`)
- Client-side compression to ~2–3MB target before upload (Canvas API + `piexifjs` to preserve EXIF through compression)
- Maximum 10MB per photo pre-compression
- EXIF stripped from publicly served files; raw EXIF stored privately server-side
- Minimum resolution enforced; images too dark or too small rejected at gate
- EXIF GPS/timestamp cross-checked against computed sunrise window; anomalies flagged for review

### Single-photo submissions
Allowed, but ineligible for pre-dawn arrival bonus (delta cannot be established). Flagged as "single-photo" in UI.

---

## Discovery System

### Catalog model
- Open-ended: players photograph and submit discoveries, not limited to a predefined list
- AI identification: Claude vision + iNaturalist API (wildlife/plants) + Pl@ntNet (plants)
- AI returns: species name, confidence level, suggested rarity tier
- Player confirms or adjusts the AI suggestion
- Watch members may challenge a discovery claim
- Geographic and cultural/historical discoveries: AI confirms presence of notable feature; tier requires player input or Watch validation

### Global shared catalog
All confirmed discoveries contribute to a single global catalog visible to all users.
This becomes a living field guide — every confirmed species or feature logged anywhere on the platform,
with photo, GPS coordinates (approximate — privacy rounded), and the expedition that first logged it.
The catalog enriches over time, reducing AI calls for well-documented species as the database builds.

### First unlock rule
Per-player. If you have previously logged a Gambel's Quail, a new Gambel's Quail sighting earns no Discovery points. It still appears in your expedition log and contributes to the global catalog.

### Global first flag
If a player is the first on the entire platform to log a confirmed species or feature, the entry receives a `global_first` flag. This is permanently noted on the discovery card and earns the "First contact" achievement badge. The player's name is credited in the global catalog entry.

---

## Watch System (Community Groups)

### Definition
A Watch is a named community group within the Finding Zora game world. Members compete on a shared Watch leaderboard. Terminology: "Watch" — as in dawn watch. People who wake before the world to watch for the light.

### The Zora Files Watch
- The canonical Watch, operated by the host
- Publicly viewable: anyone can follow its leaderboard, logs, and activity
- Not open to join — membership is controlled exclusively by the host
- Series expedition entries appear in this Watch with a "series entry" treatment (episode embed, badge)

### All other Watches
- Created by any registered player
- Membership model: open (join with link), invite-link (default — link shared, approval optional), or invite-only (leader manually approves)
- Watch leaderboard: public by default; optional restriction to members-only
- Even private Watch leaderboards contribute member scores to the global leaderboard

### Watch roles
- Watch Leader (creator)
- Member

### Watch size
No hard limit. Self-regulating by community.

### Single Watch membership
Players belong to exactly one Watch at a time. A player may leave and join another; their history follows them but Watch leaderboard position reflects current membership period only.

### Honor-system Watches
A Watch Leader may enable honor-system mode. In this mode:
- EXIF verification is not required
- Players self-enter all scores using guided form with intuitive dial/slider UI
- No challenge process — scores are accepted as submitted
- All entries visually marked as "honor entry" in all UI contexts
- Entries excluded from global leaderboards entirely
- Entries still count toward player level progression

### Watch leader succession
If a Watch Leader account has no login for 90 days, the Watch enters "dormant leader" state.
Members are notified. After 30 additional days with no leader return, the longest-tenured active member is offered the leadership role. If declined, offer passes to next in tenure. If no member accepts, Watch remains functional but leaderless — challenges auto-resolve as AI_UPHELD.

### Watch challenge mechanics
- Challenge window: 72 hours from submission
- Quorum: minimum 3 votes required for a valid outcome
- If fewer than 3 active members: AI score stands automatically
- Tie: AI score stands (challenger has burden of proof)
- A player may challenge a given submission once; no re-challenge after Watch vote

---

## Level-Up System

### Philosophy
Leveling takes roughly 6 outings at average performance (~80 Zora Score per expedition).
Each level unlocks a specific piece of gear — building justification for equipment spend into the game itself.
Level 10, "Finding Zora," is the show's narrative endpoint. It has no gear reward. It IS the reward.

### Level Table

| Level | Title | Points to reach | Cumulative | Gear Unlock |
|-------|-------|----------------|------------|-------------|
| 0 | Scout | — | 0 | Phone + existing kit |
| 1 | Trailhead | 480 | 480 | DJI Mic 2 + Joby GorillaPod |
| 2 | Desert Fox | 500 | 980 | DJI OM 7 Gimbal |
| 3 | Dawnchaser | 520 | 1,500 | GoPro Hero 13 Black |
| 4 | First Light | 540 | 2,040 | DJI Mini 4 Pro (drone) |
| 5 | Horizon Hunter | 560 | 2,600 | Vortex Monocular + optics kit |
| 6 | Zora Seeker | 600 | 3,200 | DJI Osmo Action 5 Pro |
| 7 | Dawn Keeper | 650 | 3,850 | Insta360 X4 |
| 8 | Eos Adept | 700 | 4,550 | Premium tripod + slider system |
| 9 | Zora Master | 800 | 5,350 | TBD — viewer vote or personal milestone |
| 10 | Finding Zora | 1,000 | 6,350 | The perfect sunrise. No gear. That was always the destination. |

### Notes
- Level 4 (drone unlock) is intentional — appears after ~24 outings of proven commitment
- Gear unlocks for community players are aspirational guidance, not enforced requirements
- Level titles are confirmed final

### Level-up display
- Profile shows current level badge + progress bar toward next threshold
- When a threshold is crossed, a level-up moment is triggered in the UI (animated badge reveal)
- A shareable achievement card is generated automatically (see Badge System below)
- For the host: level-up moments get 90 seconds of dedicated on-camera time at episode end

---

## Badge System

### Category 1: Level progression badges (primary identity)

Shape: hexagonal. Complexity increases with level. Color progression: muted silver-gray (Scout) through amber mid-levels into amber-and-teal dual-tone (levels 9–10). Finding Zora badge is the only badge that uses both amber and teal together.

| Level | Badge name |
|-------|-----------|
| 0 | Scout |
| 1 | Trailhead |
| 2 | Desert Fox |
| 3 | Dawnchaser |
| 4 | First Light |
| 5 | Horizon Hunter |
| 6 | Zora Seeker |
| 7 | Dawn Keeper |
| 8 | Eos Adept |
| 9 | Zora Master |
| 10 | Finding Zora |

Displayed: on profile, in expedition logs, on leaderboard, in shareable achievement cards.
Permanent once earned. Cannot be revoked.

### Category 2: Achievement badges

Shape: circular, smaller than level badges, color-coded by domain. Secondary position on profile.

**Expedition volume:**
| Badge | Trigger |
|-------|---------|
| First light | First expedition submitted |
| Iron dawn | 10 expeditions logged |
| Night owl | 25 expeditions logged |
| Century watcher | 100 expeditions logged |

**Eos Index performance:**
| Badge | Trigger |
|-------|---------|
| Golden hour | Eos Index of 85+ achieved |
| Zenith | Eos Index of 95+ achieved |
| Perfect sky | Eos Index of 100 (theoretical) |

**Effort and range:**
| Badge | Trigger |
|-------|---------|
| Deep field | 150+ miles from home base on a single expedition |
| Summit | 2,000 ft+ elevation gain logged |
| Off-road | 10 expeditions with off-pavement travel |
| Globe trotter | Expeditions logged on 3+ continents |
| Storm walker | Weather adversity score of 3 on 5 separate expeditions |

**Discovery:**
| Badge | Trigger |
|-------|---------|
| First contact | First player on platform to log a confirmed species (global_first) |
| Naturalist | 25 unique species/features in personal Discovery Log |
| Field guide | 100 unique species/features in personal Discovery Log |

**Streak:**
| Badge | Trigger |
|-------|---------|
| Consistent | First 4-week consecutive streak completed |
| Iron streak | 12 consecutive weeks |

**Community:**
| Badge | Trigger |
|-------|---------|
| Watch founder | Created a Watch |
| Challenge upheld | Successfully challenged AI score through Watch process |

### Category 3: Special badges

Cannot be earned through normal play. Issued administratively. Distinct visual shape.

| Badge | Description |
|-------|-------------|
| Founding member | Beta participants only. Amber-gold. Never re-issuable. Rarest badge on platform. |
| Season champion | Highest combined Eos + Zora score in a platform season. |
| The Zora Files acknowledgment | Discretionary, issued by host. No rules for earning it. |

### Shareable achievement cards

Generated server-side using Satori (React JSX → PNG, edge-rendered) when any level or achievement badge is earned.

Card contents:
- Pre-dawn background
- Earned badge, prominent and centered
- Player display name
- One-line description of achievement ("reached level 4 · first light")
- Personal-best Eos Index score (for level badges)
- Subtle CTA: "playing Finding Zora at thezorafiles.com"

Two sizes generated automatically:
- 1200 × 630px — Facebook, X/Twitter, LinkedIn
- 1080 × 1920px — Instagram Stories (download to paste manually)

Sharing targets: Facebook, X/Twitter, WhatsApp (link), copy link, download image.

---

## Seasons

- Annual seasons, one calendar year each
- Season 1 begins at public platform launch
- Global leaderboard is season-scoped; all-time leaderboard remains visible alongside current-season view
- Player level progression and personal Discovery Log are cumulative across all seasons — never reset
- Season start/end is a content beat for the show
- Season champion badge awarded at close of each season

---

## Hall of Zora

A permanent page listing every player who has reached Level 10 (Finding Zora).
Each entry shows: display name, total accumulated Zora Score, date threshold was crossed, personal-best Eos Index.
Getting on this page is the most visible long-term goal in the game.

---

## Website Architecture — thezorafiles.com

### Site rings

```
Ring 1 — thezorafiles.com (the channel site)
  Serves all viewers, not just players
  Episodes, about, the host's story, YouTube links

Ring 2 — /finding-zora (the game world)
  The rulebook, map, leaderboards, community, player accounts
  Requires account to play; browsable without account

Ring 3 — /watch/:slug (group layer)
  Individual Watch leaderboard, member feed, Watch-specific discovery catalog
```

### Page map

```
/                         → Logged-out: hero, interactive map, global top-5 preview, Watch browser, join CTA
                            Logged-in: player stats, Watch feed, next sunrise time (home location), draft expedition if pending
/finding-zora             → Game overview, rulebook link, join/start Watch CTA
/finding-zora/map         → Global interactive sunrise map — all public expedition pins
/finding-zora/leaderboard → Global top-20 Eos Index / Zora Score / Combined — season-scoped + all-time toggle
/finding-zora/catalog     → Global living field guide — all confirmed discoveries
/finding-zora/hall        → Hall of Zora — all Level 10 players
/finding-zora/rulebook    → The official rulebook (mirrors FindingZora_Rulebook vN)
/watch/:slug              → Individual Watch — leaderboard, activity feed, member list, Watch discovery log
/watch/:slug/expedition/:id → Individual expedition log — scores, photos, map pin, journal, discoveries
/player/:username         → Public player profile — level badge, stats, expedition history, achievements
/log                      → Expedition logging flow (auth required) — PWA-optimized, mobile-first
/log/draft/:id            → Resume draft expedition log
/episodes                 → Episode archive with scores, locations, YouTube embeds
/episodes/:id             → Individual episode page — full scoring breakdown, discovery log for that episode
/discovery/:id            → Individual discovery card — species/feature detail, global sightings map
/records                  → All-time records board
/about                    → The concept, the host, the mission
/admin                    → Admin panel (host only) — moderation queue, global challenge review, badge issuance
```

### Homepage differentiation

**Logged-out:**
- Hero: channel name, tagline, latest episode embed
- Interactive map: recent public expedition pins
- Global top-5 leaderboard preview
- Watch browser: searchable list of public Watches
- Join CTA

**Logged-in:**
- Player stats: level badge, cumulative score, gap to next threshold, streak counter
- Watch activity feed: recent expeditions from Watch members
- Next sunrise time: computed live from suncalc for player's home location
- Draft expedition if one is pending: prominent resume prompt

---

## Data Model — Core Entities

All distances stored internally in kilometers. All elevations stored in meters. Display converts to user preference.

```typescript
// Player
{
  id: uuid
  username: string                     // permanent, URL-safe, 3–20 chars, set once
  display_name: string                 // freeform, changeable
  email: string
  home_location: {
    lat: number                        // zipcode centerpoint or approximate — never precise
    lng: number
    display_label: string              // "Phoenix, AZ area" — never exact address
  }
  unit_preference: 'imperial' | 'metric'
  watch_id: uuid | null                // single Watch membership
  role: 'player' | 'admin'
  created_at: Date
  founding_member: boolean
}

// Watch
{
  id: uuid
  slug: string                         // URL slug
  name: string
  leader_id: uuid
  join_model: 'open' | 'invite_link' | 'invite_only'
  leaderboard_visibility: 'public' | 'members_only'
  honor_system_enabled: boolean
  is_canonical: boolean                // true only for The Zora Files Watch
  founding_date: Date
  leader_last_active: Date             // for succession logic
}

// Expedition
{
  id: uuid
  player_id: uuid
  watch_id: uuid
  rulebook_version: string             // stamped at scoring time; never retroactively changed
  status: 'draft' | 'ai_scoring' | 'player_review' | 'watch_challenge'
        | 'global_pending' | 'accepted' | 'watch_adjusted' | 'ai_upheld'
        | 'global_confirmed' | 'global_rejected' | 'honor_accepted'
  is_public: boolean                   // private expeditions count toward level; excluded from map/leaderboard
  is_honor_entry: boolean

  // Location
  location_name: string                // reverse-geocoded from GPS
  country: string
  region: string | null
  coordinates: { lat: number, lng: number }

  // Timestamps
  arrival_timestamp: Date              // from EXIF
  sunrise_timestamp: Date              // from EXIF
  computed_civil_twilight: Date        // from suncalc
  minutes_before_sunrise: number       // derived

  // Eos Index
  eos_score: {
    sky_color_intensity: number        // max 20
    sky_cloud_engagement: number       // max 15
    sky_horizon_definition: number     // max 15
    sky_total: number                  // max 50
    setting_foreground: number         // max 15
    setting_uniqueness: number         // max 15
    setting_total: number              // max 30
    conditions_effort: number          // max 10
    conditions_weather: number         // max 10
    conditions_total: number           // max 20
    total: number                      // max 100
    ai_reasoning: string               // Claude's brief explanation per sub-component
  }

  // Zora Score components
  zora_score: {
    eos_index: number
    travel_distance_km: number
    travel_distance_points: number
    off_pavement: boolean
    high_clearance: boolean
    alt_transport: boolean
    international: boolean
    travel_difficulty_points: number
    elevation_gain_m: number
    elevation_points: number
    predawn_bonus: number
    weather_adversity: number
    discovery_points: number
    streak_bonus: number
    total: number
  }

  // Weather (from Open-Meteo)
  weather_data: {
    temperature_c: number
    wind_speed_kmh: number
    precipitation_mm: number
    condition_description: string
  }

  // Photos
  arrival_photo_url: string            // EXIF-stripped, processed
  sunrise_photo_url: string
  supplemental_photo_urls: string[]    // max 8
  exif_metadata: object               // stored privately, never served publicly

  // Episode link (host entries only)
  episode_id: uuid | null
  youtube_url: string | null
  episode_number: number | null

  // Player content
  notes: string                        // journal entry
  gear_level_at_time: number          // player's level when outing occurred
  player_reported_elevation_source: string | null  // "AllTrails", "Strava", etc.

  created_at: Date
  submitted_at: Date | null
  scored_at: Date | null
}

// Discovery
{
  id: uuid
  expedition_id: uuid
  player_id: uuid
  category: 'wildlife' | 'plant' | 'geographic' | 'cultural' | 'historical'
  name: string
  scientific_name: string | null
  rarity_tier: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'exceptional'
  points_awarded: number
  is_first_player_unlock: boolean      // first time this player logged this species
  is_global_first: boolean             // first time anyone on platform logged this species
  photo_url: string
  ai_identification: object            // raw AI ID response including confidence
  ai_suggested_tier: string
  player_confirmed_tier: string
  coordinates_approx: { lat: number, lng: number }  // privacy-rounded
  country: string
  fun_fact: string | null
  catalog_entry_id: uuid              // link to global catalog
}

// Catalog (global living field guide)
{
  id: uuid
  category: 'wildlife' | 'plant' | 'geographic' | 'cultural' | 'historical'
  name: string
  scientific_name: string | null
  rarity_tier: string
  first_logged_by: uuid               // player_id of global first
  first_logged_at: Date
  first_logged_expedition_id: uuid
  total_sightings: number
  contributor_count: number
  representative_photo_url: string
  description: string | null          // community-editable over time
}

// PlayerLevel
{
  player_id: uuid
  current_level: number
  current_level_title: string
  total_zora_score: number
  season_zora_score: number           // current season only
  total_expeditions: number
  streak_current_weeks: number
  streak_longest_weeks: number
  personal_best_eos: number
  badges: string[]                    // badge identifiers
  last_expedition_date: Date | null
}

// Episode (host entries only)
{
  id: uuid
  episode_number: number
  season: number
  title: string
  youtube_url: string
  thumbnail_url: string
  publish_date: Date
  expedition_id: uuid                 // linked expedition record
}

// Challenge
{
  id: uuid
  expedition_id: uuid
  challenger_player_id: uuid
  watch_id: uuid
  status: 'open' | 'resolved_upheld' | 'resolved_adjusted' | 'expired'
  original_eos_score: number
  proposed_eos_score: number
  votes_support_player: number
  votes_support_ai: number
  opened_at: Date
  closes_at: Date                     // 72 hours from opened_at
  resolved_at: Date | null
  final_eos_score: number
}

// Flag (content moderation)
{
  id: uuid
  target_type: 'expedition' | 'discovery' | 'player'
  target_id: uuid
  flagged_by: uuid
  reason: string
  status: 'pending' | 'reviewed_upheld' | 'reviewed_dismissed'
  created_at: Date
}
```

---

## Infrastructure

### Server
- Single cloud VM: Hetzner CAX21 (ARM, 4 cores, 8GB RAM, ~$7/month)
- Docker Compose for all services on the same VM
- Caddy as reverse proxy with automatic HTTPS
- No Kubernetes — correct scale for this project

### Services (Docker Compose)
| Service | Tool | Notes |
|---------|------|-------|
| Frontend | Next.js | SSR for SEO on map/leaderboard/discovery pages; PWA shell |
| API | NestJS | REST API; business logic; auth middleware; job queue management |
| Database | PostgreSQL | Primary data store; geographic queries via PostGIS |
| Job queue | BullMQ + Redis | Async: AI scoring, EXIF processing, image conversion, email |
| File storage | Cloudflare R2 | Images only — S3-compatible, near-zero egress, Cloudflare CDN |
| Auth | Lucia (open source) | Email + OAuth; no SaaS dependency |
| Analytics | Plausible (self-hosted) | No cookies, no personal data, GDPR-compliant |
| Reverse proxy | Caddy | Automatic HTTPS, simple config |
| Email (transactional) | Resend | Badges, challenges, weekly digest, level-up notifications |
| Email (operational) | Google Workspace | hello@thezorafiles.com |

### External APIs (all free/open)
| API | Purpose |
|-----|---------|
| Anthropic (Claude vision) | Eos Index scoring; image validation; discovery ID assist |
| Open-Meteo | Historical weather for auto-populated conditions |
| OpenTopoData | Elevation at GPS coordinates |
| Nominatim (OpenStreetMap) | Reverse geocoding |
| iNaturalist | Wildlife/plant identification assist |
| Pl@ntNet | Plant identification assist |
| suncalc (npm library) | Civil twilight/sunrise computation — no API, runs locally |

### AI cost management
- Content moderation gate runs on Claude Haiku (cheaper) before scoring pass
- Scoring pass runs on Claude vision — one call per submission
- Accepted scores are cached; no re-run unless challenged
- Re-score requests rate-limited: once per 24 hours per submission
- Global catalog reduces AI calls over time as common species are identified

### PWA strategy
- Next.js PWA with service worker and web manifest
- Installable to home screen; runs in standalone mode; feels native
- Offline support via IndexedDB: expedition drafts queue locally and sync on reconnect
- EXIF read client-side before upload; GPS and timestamp extracted in-browser
- Client-side image compression (Canvas API + piexifjs to preserve EXIF through compression)
- Target upload size: 2–3MB per photo
- HEIC converted server-side via `sharp`
- Capacitor available as future escape hatch for native app wrapper if needed

### Mobile-first logging constraints
- All logging UI must work one-handed on a phone screen in low light
- Large tap targets throughout logging flow
- Expedition can be started in the field with minimal required fields (location pin + photo)
- Full score entry and notes can be completed after returning home
- Draft/unpublished state is a first-class concept

### SEO architecture
- Expedition log pages are server-rendered with full metadata
- URL pattern: `/watch/:slug/expedition/:location-slug-:eos-score`
- Map page and top expedition logs are crawlable
- Target: "best sunrise spots in [location]" discovery traffic

---

## Image Policy

- Maximum 10 photos per expedition (arrival + sunrise + 8 supplemental)
- No large file storage: the platform is not a print shop
- All photos stored at compressed web-display resolution only
- EXIF stripped from all publicly served images; raw EXIF stored privately
- Users retain full ownership of their photos
- License granted to platform: non-exclusive right to display for community purposes
- Account deletion: personal data deleted; expedition photos anonymized (attributed to "a player") — not removed from map or catalog
- Players may export their own data at any time (see Data Export)

---

## Data Export

Two export formats available in-app:

### Full archive export
ZIP file containing:
- JSON: all expedition metadata, Eos Index breakdowns, Zora Scores, discoveries, level history, badge history
- All player photos (processed, EXIF-stripped versions)

### Single expedition PDF
- Generated on-demand per expedition
- Uses brand design language (pre-dawn background, amber/teal typography)
- Contents: sunrise photo, full score breakdown, map pin, journal entry, weather data, discoveries logged
- Suitable for printing or personal archiving
- In scope for v1

---

## Monetization

Community-forward. Non-commercial-forward. No ads in any Anthropic product sense; no advertiser placement.

- **Donations:** Ko-fi or native tip button, unobtrusive, optional
- **Gear affiliate links:** Listed on equipment pages and individual expedition logs ("what I use"). One sentence: "These are the tools I actually carry. If you buy through this link, it helps keep the lights on." Clearly labeled. No banners, no pop-ups, no landing pages.
- The framing is always utility-first: the gear exists in the context of the game and the show, not as a commercial destination.

---

## Privacy

- Home location stored as approximate (zipcode centerpoint or player-entered approximate). Never precise.
- EXIF GPS stripped from all public-facing images
- Discovery catalog coordinates privacy-rounded (~1km radius)
- Analytics: Plausible, no cookies, no personal data collected
- Account deletion: personal data permanently deleted; expedition records anonymized, not removed
- Plain-language privacy statement at account creation and on a dedicated /privacy page
- GDPR-aligned regardless of player country

### Account management
- Username: permanent, set once at registration, 3–20 chars, URL-safe. Players warned explicitly.
- Display name: freeform, changeable at any time
- Reserved usernames at launch: admin, zora, thezorafiles, findingzora, eos, system, support, help, scout, trailhead, desertfox, dawnchaser, firstlight, horizonhunter, zoraseeker, dawnkeeper, eosadept, zoramaster, findingzora
- Offensive username prevention via blocklist at registration

---

## Content Moderation

- Flag mechanism available from day one on all expedition entries and discovery submissions
- Flagged items generate notification to admin queue
- Admin panel at /admin: moderation queue with one-click approve/remove
- Flag rate limiting: players with >5 flags in 30 days and <20% upheld rate are rate-limited
- At launch scale: host handles review. System designed to scale moderation team later.

---

## Social / Activity

- **Watch feed (default):** Recent expedition activity from Watch members. Visible on logged-in homepage and Watch page.
- **Global feed:** Recent public expeditions from all players. Secondary tab.
- **No algorithmic ranking:** feeds are chronological
- **Notifications (email digest only at launch):** badge earned, challenge opened/resolved, level-up, weekly Watch activity summary

---

## Beta Program

- Closed beta before public launch
- Recruitment via YouTube audience after first episodes air, and any other channel at host's discretion
- Beta participants receive permanent **Founding Member** badge — amber-gold, distinct shape, never re-issuable
- Beta purpose: calibrate AI scoring against real submissions; test challenge workflow; surface EXIF edge cases across device types; test Watch dynamics with real users
- Target size: 20–50 participants

---

## Records Board

All-time records, publicly visible. Records belong to specific expeditions, not just players.

| Record | Current holder | Value | Expedition |
|--------|---------------|-------|---------|
| Best Eos Index | Ocean cliff | 85 | Calibration |
| Highest elevation | TBD | — | — |
| Longest travel distance | TBD | — | — |
| Best water view | TBD | — | — |
| Most unusual location | TBD | — | — |
| Most species in one expedition | TBD | — | — |
| Highest Zora Score | TBD | — | — |

---

## Episode Format (host)

### Structure (target 15–20 min)
1. **Cold open** (30–60 sec) — trailhead/vehicle, target location, current leaderboard position
2. **The approach** — pre-dawn travel, road conditions, gear talk lives here naturally
3. **Discovery window** — dark-to-dawn wildlife and feature hunting
4. **The sunrise** — camera locked down, scoring live
5. **The score** — Eos Index reveal, Zora Score calculation, leaderboard update
6. **Level-up moment** (if applicable) — 90 seconds dedicated, at end of episode

### Color grade
- Consistent LUT applied every episode — develop in DaVinci before E01
- Warm amber-shifted grade for golden hour footage
- Cooler blue-shifted grade for pre-dawn / blue hour footage
- Eos Index score reveal: consistent motion graphic template every episode

---

## Equipment

### Current gear
- Samsung S25 Ultra (primary camera)

### Level 1 gear unlock — Trailhead (480 pts)
- DJI Mic 2 + Joby GorillaPod 3K

### Level 2 gear unlock — Desert Fox (980 pts)
- DJI OM 7 Gimbal

### Level 3 gear unlock — Dawnchaser (1,500 pts)
- GoPro Hero 13 Black

### Level 4 gear unlock — First Light (2,040 pts)
- DJI Mini 4 Pro (drone)

### Level 5 gear unlock — Horizon Hunter (2,600 pts)
- Vortex Monocular + optics kit

### Level 6 gear unlock — Zora Seeker (3,200 pts)
- DJI Osmo Action 5 Pro

### Level 7 gear unlock — Dawn Keeper (3,850 pts)
- Insta360 X4

### Level 8 gear unlock — Eos Adept (4,550 pts)
- Premium tripod + slider system

### Level 9 gear unlock — Zora Master (5,350 pts)
- TBD — viewer vote or personal milestone

### Level 10 — Finding Zora (6,350 pts)
- No gear. That was always the destination.

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

### Immediate
- [ ] Set up Google Workspace → hello@thezorafiles.com
- [ ] Connect hello@ to YouTube channel Google account
- [ ] Write consistent bio across YouTube, Instagram, TikTok
- [ ] Upload placeholder channel banner to YouTube
- [ ] Register X/Twitter @thezorafiles (defensive)
- [ ] Install Merlin Bird ID, iNaturalist, eBird, PhotoPills on S25 Ultra

### Before shooting E01
- [ ] Acquire Level 1 gear minimum (DJI Mic 2 + GorillaPod)
- [ ] Set up DaVinci Resolve project with episode template
- [ ] Develop color grade LUT — test on existing footage
- [ ] Design channel icon — amber sunrise motif or Zora wordmark
- [ ] Design thumbnail template — consistent visual language

### Before publishing E01
- [ ] Film channel trailer (60–90 sec — concept + scoring system explanation)
- [ ] Shoot and edit E01, E02, E03 — never launch with one episode
- [ ] Build thezorafiles.com home page (logged-out state) and global leaderboard
- [ ] Set up Resend for transactional email
- [ ] Set up Plausible analytics (self-hosted)

### Before platform public launch
- [ ] Complete closed beta with founding members
- [ ] Calibrate AI scoring against beta submissions
- [ ] Test Watch challenge workflow with real users
- [ ] EXIF edge case testing across Android and iOS device types
- [ ] Admin moderation panel functional
- [ ] Data export (full archive + single expedition PDF) functional
- [ ] Privacy page and Terms published

### Publishing rhythm
- Upload E01 → wait 1 week → E02 → wait 1 week → E03
- Recruit beta players from early YouTube audience
- Platform public launch aligned with episode cadence, not before beta complete

---

## Planned Features (v2)

- **Sunrise planning tool:** enter location + date → civil twilight times + 7-day weather forecast + sky quality prediction from cloud cover. Data infrastructure is already in place; this is a UI build.
- **Strava / AllTrails integration:** optional link for auto-pulling elevation gain to replace honor system entry
- **Native app (Capacitor wrapper):** if PWA limitations become friction at scale

---

## Notes & Decisions Log

- **2026-03** — Concept originated from morning nature walks in Queen Creek/Chandler Heights area
- **2026-03** — Zora chosen over Akatsuki, Fajr, Madrugada for brevity and owability
- **2026-03** — Eos Index chosen as scoring system name — clinical, named after Greek goddess of dawn
- **2026-03** — "The Zora Files" = channel name; "Finding Zora" = show name/game within channel
- **2026-03** — Calibration scoring session completed on 11 existing photos — ocean cliff holds series record at 85
- **2026-03** — All platform handles secured: @TheZoraFiles (YouTube), @thezorafiles (Instagram, TikTok)
- **2026-03** — Domain thezorafiles.com registered
- **2026-03** — Dual scoring system confirmed: Eos Index (sunrise quality, 0–100) + Zora Score (full expedition, ~215 max). Never conflate or rename.
- **2026-03** — Level-up system confirmed: D&D-style progression, ~6 outings per level, gear unlocks at each level
- **2026-03** — Level titles confirmed final: Scout, Trailhead, Desert Fox, Dawnchaser, First Light, Horizon Hunter, Zora Seeker, Dawn Keeper, Eos Adept, Zora Master, Finding Zora
- **2026-03** — Geographic scope confirmed as global — Arizona/Sonoran Desert is home base and brand identity; website architecture must never hardcode regional assumptions
- **2026-03** — International travel bonus: +3 pts to Zora Score for any expedition outside continental US
- **2026-03** — WEBSITE DESIGN SESSION — all decisions below from this session
- **2026-03** — Community group term confirmed: Watch (dawn watch — people who wake before the world to watch for the light)
- **2026-03** — Eos Index scoring: AI-forward (Claude vision) with Watch challenge process; AI score is baseline
- **2026-03** — EXIF timestamp verification: hard requirement for global/official leaderboard inclusion
- **2026-03** — Every submission requires AI-scored Eos Index — no exceptions including honor-system Watches
- **2026-03** — EXIF auto-computation defined: arrival time, sunrise time, pre-dawn delta, distance, international flag, elevation, weather all auto-computed or auto-populated
- **2026-03** — Elevation gain: honor system, AllTrails/Strava encouraged; builds good habits
- **2026-03** — All measurements stored internally in metric; displayed in user-preferred unit
- **2026-03** — Rulebook version stamped on every expedition entry; scores grandfathered on rulebook updates
- **2026-03** — Submission state machine defined: DRAFT → AI_SCORING → PLAYER_REVIEW → WATCH_CHALLENGE → GLOBAL_PENDING → final state
- **2026-03** — Honor-system Watch entries: excluded from global leaderboards, visually marked as "honor entry," still contribute to player level
- **2026-03** — Supplemental photos: yes, max 10 total per expedition (arrival + sunrise + 8 supplemental)
- **2026-03** — Single Watch membership only; player belongs to one Watch at a time
- **2026-03** — Watch leaderboard: public by default, optional members-only restriction
- **2026-03** — Streak bonus updated: 4 consecutive calendar weeks minimum, +1 pt at 4th-week completion, counter resets after bonus, applies to all players
- **2026-03** — Private expeditions: yes — contribute to player level; excluded from public map/leaderboard
- **2026-03** — Discovery catalog: open-ended with AI ID (Claude vision + iNaturalist + Pl@ntNet)
- **2026-03** — Global shared discovery catalog confirmed: single living field guide for all players
- **2026-03** — First unlock per-player (not global, not per-Watch)
- **2026-03** — The Zora Files Watch: publicly viewable, not open to join; host controls membership
- **2026-03** — All other Watches: optionally open (open / invite-link / invite-only)
- **2026-03** — Dark mode only — no light mode toggle, ever
- **2026-03** — Closed beta before public launch; founding member badge for beta participants — amber-gold, never re-issuable, rarest badge on platform
- **2026-03** — Infrastructure confirmed: Hetzner CAX21 VM + Docker Compose + Caddy + Cloudflare R2 (images only)
- **2026-03** — Tech stack confirmed: Next.js (frontend/SSR/PWA) + NestJS (API) + PostgreSQL + BullMQ + Redis + Lucia auth
- **2026-03** — PWA with service worker, offline draft support via IndexedDB; Capacitor as future escape hatch
- **2026-03** — Plausible Analytics self-hosted — no cookies, no personal data
- **2026-03** — Resend for transactional email ($0 to 3,000/mo)
- **2026-03** — Badge system defined: Level badges (hexagonal, 11 levels), Achievement badges (circular, domain-coded), Special badges (administrative, distinct shape)
- **2026-03** — Shareable achievement cards: server-side Satori rendering, two sizes (1200×630 + 1080×1920), share to Facebook/Twitter/WhatsApp/download
- **2026-03** — Seasons: annual, Season 1 begins at public platform launch; personal level/discoveries never reset
- **2026-03** — Hall of Zora: permanent page for all Level 10 players
- **2026-03** — Activity feed: Watch feed (default) + global feed (secondary), both chronological
- **2026-03** — Notifications: email digest only at launch (Resend)
- **2026-03** — Data export: full archive ZIP (JSON + photos) + single expedition PDF — both in v1
- **2026-03** — Watch challenge window: 72 hours; quorum: 3 minimum votes; tie → AI stands; one challenge per submission
- **2026-03** — Watch leader succession: 90-day inactivity + 30-day offer chain to longest-tenured active member
- **2026-03** — Username: permanent, set once, 3–20 chars; players warned explicitly at registration
- **2026-03** — Account deletion: personal data deleted; expedition records anonymized (not removed); photos attributed to "a player"
- **2026-03** — Monetization: Ko-fi/tip button (unobtrusive) + gear affiliate links (clearly labeled, utility-first framing); no ads, no commercial-forward design
- **2026-03** — AI cost management: Haiku for content gate, vision for scoring, cached scores, rate-limited re-score
- **2026-03** — Sunrise planning tool (auto civil twilight + forecast + sky quality): planned v2 feature; infrastructure not to preclude it