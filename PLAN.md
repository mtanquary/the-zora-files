# The Zora Files — project plan

> Last updated: 2026-03-21

This is the living task tracker for the project. Phases are roughly sequential but items within a phase can be tackled in any order.

---

## Phase 1 — Foundation (accounts, identity, infrastructure)

### Accounts and platforms
- [ ] Set up Google Workspace for hello@thezorafiles.com
- [ ] Connect hello@ to YouTube channel Google account
- [ ] Register X/Twitter @thezorafiles (defensive)
- [ ] Write consistent bio across YouTube, Instagram, TikTok

### Brand identity
- [ ] Choose display/logo font
- [ ] Choose body font
- [ ] Choose monospace font for Eos Index / Zora Score data
- [ ] Design channel icon — amber sunrise motif or Zora wordmark
- [ ] Design YouTube channel banner
- [ ] Design thumbnail template — consistent visual language
- [ ] Design Eos Index score card graphic (for on-screen use)
- [ ] Design Zora Score breakdown graphic (for on-screen use)
- [ ] Design lower third template
- [ ] Design "discovery unlocked" card graphic
- [ ] Design "level up" moment graphic
- [ ] Export color palette swatches for all tools

### Apps and tools
- [ ] Install Merlin Bird ID on S25 Ultra
- [ ] Install iNaturalist on S25 Ultra
- [ ] Install eBird on S25 Ultra
- [ ] Install PhotoPills on S25 Ultra
- [ ] Set up Filmic Pro with manual settings (WB 4000K, 24fps)
- [ ] Set up DaVinci Resolve with episode project template
- [ ] Evaluate Descript subscription
- [ ] Evaluate OpusClip subscription
- [ ] Evaluate TubeBuddy or VidIQ subscription

---

## Phase 2 — Gear acquisition

Gear is organized by priority tier, not level-gated. The show starts with phone + existing kit. See ZORA_PROJECT.md Equipment section for full details.

### Current
- [x] Samsung S25 Ultra (primary camera)

### Tier 1 — acquire first
- [ ] DJI Mic 2 (wireless audio)
- [ ] Joby GorillaPod 3K + phone mount (timelapse stability)
- [ ] DJI OM 7 Gimbal (walking footage)
- [ ] DJI Mini 4 Pro (aerial)

### Tier 2 — acquire soon
- [ ] GoPro Hero 13 Black (always-on wide POV)
- [ ] Vortex Solo 8x36 Monocular (wildlife spotting)

### Tier 3 — level up (see ZORA_PROJECT.md)

---

## Phase 3 — Pre-production

### Color and look
- [ ] Develop warm amber LUT for golden hour footage
- [ ] Develop cool blue LUT for pre-dawn / blue hour footage
- [ ] Test LUTs on existing sunrise photos/footage
- [ ] Build Eos Index score reveal motion graphic in DaVinci Resolve
- [ ] Build intro/outro sequence

### Episode prep
- [ ] Scout Lost Dutchman SP — confirm trail, parking, sunrise angle
- [ ] Scout Butcher Jones / Saguaro Lake — confirm gate times, early access
- [ ] Scout Hieroglyphic Trail — confirm parking, trail conditions
- [ ] Run eBird reports for all three locations
- [ ] Check PhotoPills sunrise positions for all three GPS coordinates
- [ ] Finalize discovery point values for target species

---

## Phase 4 — Filming

- [ ] Shoot E01 — "The Benchmark" — Lost Dutchman SP
- [ ] Shoot E02 — "The Habitat Flip" — Butcher Jones / Saguaro Lake
- [ ] Shoot E03 — "The Time Capsule" — Hieroglyphic Trail
- [ ] Shoot channel trailer (60-90 sec — concept + scoring system)

---

## Phase 5 — Post-production

- [ ] Edit E01 — full episode
- [ ] Score E01 — Eos Index
- [ ] Log E01 discoveries
- [ ] Edit E02 — full episode
- [ ] Score E02 — Eos Index
- [ ] Log E02 discoveries
- [ ] Edit E03 — full episode
- [ ] Score E03 — Eos Index
- [ ] Log E03 discoveries
- [ ] Edit channel trailer
- [ ] Create 2-3 short clips per episode (TikTok/Reels)
- [ ] Design thumbnails for all three episodes

---

## Phase 6 — Website (thezorafiles.com)

### Setup
- [ ] Initialize Next.js project in `website/` folder
- [ ] Set up Vercel deployment from GitHub
- [ ] Point Cloudflare DNS to Vercel
- [ ] Set up Supabase project (Postgres)
- [ ] Define database schema (episodes, discoveries, records)

### Pages
- [ ] Build home page — hero, leader, recent episodes, discovery preview, CTA
- [ ] Build Eos Index leaderboard page — sortable, all episodes
- [ ] Build Discovery Log page — all discoveries with cards
- [ ] Build Records page — all-time bests
- [ ] Build Episodes archive page — with scores and locations
- [ ] Build About page — concept, host, mission

### Data
- [ ] Seed Discovery Log with E01-E03 data (after filming)
- [ ] Set up Records board with initial data

---

## Phase 7 — Launch

- [ ] Upload channel trailer to YouTube
- [ ] Publish E01 — week 1
- [ ] Publish E02 — week 2
- [ ] Publish E03 — week 3
- [ ] Cross-post shorts to TikTok and Instagram Reels each week
- [ ] Launch thezorafiles.com
- [ ] Announce on all social platforms

---

## Phase 8 — Progression system (on-screen and website)

_Level system defined in ZORA_PROJECT.md. 11 levels (0-10), participation-gated (6 expeditions per level). Level titles and medallion palette confirmed final._

- [x] Finalize level titles (Scout through Finding Zora — confirmed)
- [ ] Design medallion artwork for each level (palette defined in ZORA_PROJECT.md)
- [ ] Design "level up" on-screen motion graphic (90 sec dedicated moment)
- [ ] Design medallion "awakening" animation (6th gem reveal)
- [ ] Design streak crown animation (sunburst crown reveal)
- [ ] Build progression tracker on website (current level, expedition count, medallion display)
- [ ] Build virtual medallion display case on website
- [ ] Build streak tracking logic (6 outings within 6 calendar weeks per level)

## Phase 9 — Community scoring and global Eos Index map

_Viewers upload sunrise photos for AI scoring. Requires website to be live first._

- [ ] Build photo upload flow with EXIF extraction (GPS + timestamp)
- [ ] Build sunrise time validation — confirm timestamp matches sunrise window at GPS location
- [ ] Integrate Claude API for automated Eos Index scoring of community photos
- [ ] Build community leaderboard (separate from or combined with show leaderboard — decide)
- [ ] Build appeal/adjustment workflow — user requests review, host adjusts score
- [ ] Build global Eos Index map — every scored sunrise plotted with pin, score, photo
- [ ] Add moderation layer for uploaded content
- [ ] Rate limiting for uploads

---

## Future / ideas backlog

_Add new ideas here as they come up. Move them into a phase when ready to commit._

- [ ] Season recap / "best of" episode
- [ ] Collaboration episodes with local Arizona creators
- [ ] Night sky / astrophotography bonus episodes
- [ ] Newsletter via hello@thezorafiles.com
- [ ] Merch — amber-on-dark aesthetic
- [ ] Patron/member tier with extended cuts or behind-the-scenes
- [ ] Community gallery/feed view alongside leaderboard
