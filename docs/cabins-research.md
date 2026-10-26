# Rentable federal cabins and guard stations: sources and seeding

Companion to `fire-lookout-research.md`. Scope for this phase: **standalone federal rentals** — cabins, guard stations, ranger stations, bunkhouses, and historic houses that rent as a whole building — run by the Forest Service, BLM, Park Service, Fish and Wildlife Service, and Corps of Engineers. Yurts, cabins that are a few units inside a big campground, and state park cabins are later layers.

## Result (seed of 2026-10-26)

| | Count |
|---|---|
| Cabins | 446 |
| Guard / ranger stations | 126 |
| **Total** | **572** (plus the 89 lookouts already on the map) |
| By agency | USFS 532 · NPS 31 · BLM 7 · FWS 2 |
| Top states | AK 199 · MT 103 · ID 47 · OR 36 · CO 34 · UT 27 · WY 25 · AZ 21 · WA 17 · CA 16 |
| With a Recreation.gov rating / price / photo | 531 / 530 / 565 |
| Matched to a Forest Service page (season, info link) | 450 |

Every one of them books on Recreation.gov: six-month rolling window, new nights at 7:00 a.m. Pacific, the same rule as the lookouts. That's why one poller covers all of it.

## Sources, and what each one is good for

| Source | Access | What it gives | Notes |
|---|---|---|---|
| **Recreation.gov search, faceted by unit type** — `/api/search?fq=entity_type:campground&fq=campsite_type:CABIN NONELECTRIC` (and `CABIN ELECTRIC`) | Public JSON, no key | Every facility with at least one cabin-typed unit: 470 + 159 = 627 facilities, with coordinates, unit count, rating, rating count, price range, photo, agency, managing unit | The backbone. Also returns lookouts typed as cabins (deduped against the lookout seed) and campgrounds with a cabin or two (filtered by unit count). |
| **Recreation.gov keyword search** — `q=cabin`, `guard station`, `ranger station`, `bunkhouse`, `cottage`, `hut`, `homestead`, `lodge`, `house`, `remount`, `crew quarters`, `work center` | Same | Facilities whose units were entered with the wrong type | Necessary: most Sitka-area Tongass cabins are typed `STANDARD NONELECTRIC`. Only kept when the name ends in a building word and there are at most two units (four if the Forest Service lists it as a cabin rental). Search stops paging around 800 results per query. |
| **Recreation.gov campsite search** — `/api/search/campsites?fq=asset_id:<id>` | Same | Per-unit type, name, coordinates | Used for the ~40 multi-unit or unclear facilities: how many units are cabins, which types to track, and coordinates when the facility has none. |
| **Recreation.gov month availability** — `/api/camps/availability/campground/<id>/month` | Same (already used for lookouts) | Nightly status per unit, and each unit's `campsite_type` | The type lets the poller keep only the cabins in mixed facilities (Lake Wedington, White Rock Mountain, Warner Lake). |
| **USDA Forest Service EDW "Recreation Opportunities"** — `apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RecreationOpportunities_01/MapServer/0`, `markeractivity = 'Cabin Rentals'` | Public ArcGIS REST, CORS-enabled, public domain | 568 FS records: season text, open status, the FS recarea page, coordinates, reservation text (often with a Recreation.gov link) | Cross-check and enrichment. Many links carry *legacy* Recreation.gov ids (`parkId=71857`) that don't match current facility ids, so matching falls back to name + distance + forest. Also lists things we don't track: Tongass three-sided shelters (first-come, free), concessionaire resorts and lodges, campgrounds. |
| RIDB API (`ridb.recreation.gov`) | Free key | Same facility data, official coordinates and `Reservable` flag | Not needed for cabins; the search API has everything. Still optional for lookouts. |
| RIDB bulk export (`RIDBFullExport_V1_CSV.zip`) | No key | Every facility and campsite with `CampsiteType` | A good fallback if the search API ever changes. |
| NPS API, BLM, FWS, Corps sites | Varies | — | Their reservable cabins are all on Recreation.gov already. |

## How the seed decides what's in

1. Union of the facet sweep, the keyword sweep, and any Recreation.gov facility the Forest Service layer links to.
2. Drop anything in the lookout seed, anything named like a lookout (→ `candidates.lookouts`), yurts (→ `candidates.yurts`), and names that read like campgrounds or day-use sites.
3. More than 30 units, or a campground name with mixed units → `candidates.campground_cabins` (Hardin Ridge, Zilpo, Colter Bay Tent Village, …).
4. Mixed facilities with 30 or fewer units stay, tracking only their cabin units (`unit_types`). Their price range is dropped because it includes the tent sites.
5. Kind: names with guard station, ranger station/cabin/residence/house/office, "… Station", remount depot, work center, crew quarters, or administrative site → `guard_station`; everything else → `cabin`.
6. Season: from the Forest Service record when there is one ("Forest Service season: 06/15 to 10/15", "Open year-round"). `seasonal` when both ends are known; otherwise `open`. Availability comes from the poller either way.

Hand corrections live in `website/data/stays/cabins-supplement.json` (coordinates for three facilities Recreation.gov lists without them, two name-matching misses, one rename).

## Known gaps (review each winter)

- **Forest Service rentals not matched to Recreation.gov (10):** Stringham Cabin and Upper Stillwater House (Ashley), Resurrection River Cabin (Chugach), Swan Cabin (NC; added through the supplement on the next fetch), Boreas Pass Section House (temporarily closed), Silver Falls Guard Station (closed), Distin Lake Cabin (Tongass), Fremont Miner's Retreat (Recreation.gov listing has no bookable units), Hemlock Butte Cabin (Umpqua), Jim Liberty Cabin (White Mountain; likely first-come, unconfirmed). They're in `candidates.usfs_not_on_recgov`.
- **Multi-cabin listings are one pin:** Kenai NWR (14 cabins), White Mountains NRA (15), Kodiak NWR (10), Haleakalā (3), Kenai Fjords (2), and a few cabin camps. The poller already stores availability per unit; splitting them into one pin per cabin is a UI change.
- **Rock Creek Guard Station (Ashley NF)** has no coordinates anywhere; its pin is approximate.
- Recreation.gov search won't page past about 800 results per keyword. The facet sweep doesn't have that limit, so this only matters for mistyped facilities.

## Polling budget

572 cabins × 7 months every 48 hours, plus 80 pollable lookouts × 7 months every 24 hours, is about 2,600 site-month fetches a day. The default schedule (15 per 5-minute run, 2.5 s apart) does about 4,300 a day, roughly 3 requests a minute, about an eighth of the throttle observed on 2026-10-07. The first full cabin sweep takes about a day.

## Next layers

- **Yurts** (3 in Utah on Recreation.gov now) and **campground cabins** (11 big federal campgrounds): already found by the seed, just not added.
- **State park cabins**: Washington and Wisconsin on GoingToCamp (camply-supported, CAPTCHA risk); Alaska, Oregon, Montana, Idaho and most others on Aspira/ReserveAmerica or Tyler/UseDirect (see Deliverable 6 in `fire-lookout-research.md`). Same tables, one provider module each.
