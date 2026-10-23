# Rentable US Fire Lookouts: Inventory, Booking Platforms & Data Sources for a Reservation-Alert Tool

About 90 fire lookouts in the US can currently be rented. Roughly 80 of them (close to 90%) are Forest Service rentals on Recreation.gov, so one Recreation.gov integration covers most of the map. The other nine or so are spread across a handful of operators: a state parks system on GoingToCamp, a WV State Parks portal, a Montana phone line and four or five Airbnb listings. Most of those can't be monitored reliably by an automated tool, and that should drive your architecture.

## TL;DR
- **Inventory:** The FFLA rental list (updated Aug 2026) plus the newly opened Red Oak lookout (WV, Sept 2026) give about 89 rentable lookouts in 10 states: ~80 on Recreation.gov and ~9 elsewhere. That's consistent with Axios Portland's July 2024 count of "about 75 'retired' lookouts … available for visitors to rent" in six western states. At least 10 of the Rec.gov listings are closed for maintenance or administratively, or are "currently unavailable," for 2026. Montana (28), Oregon (18), Idaho (17), California (10) and Washington (8) hold about 90% of the total.
- **Non-Rec.gov platforms:** These are WA State Parks (GoingToCamp/Camis, which camply supports), WV State Parks (its own portal; the vendor is unconfirmed and cancellations aren't released online), Montana DNRC (phone only on a single release day) and Airbnb (no public API). Only Quartz Mountain is realistically pollable. For the others, the most you can do is send "release day" reminders.
- **Build plan:** Seed coordinates from FFLA/NHLR state lists and OSM, take metadata and ratings from Recreation.gov, and watch availability through Recreation.gov's month endpoint and GoingToCamp. Treat everything else as calendar alerts. Don't store Google or Tripadvisor review content; both sets of terms forbid it.

## Key Findings

**1. Recreation.gov dominates, and the release mechanics are uniform.** The FFLA states that "Nearly all US Forest Service lookout rentals are managed through www.recreation.gov. These reservations open on a 6-month rolling basis at 7:00 a.m. (Pacific time). So on January 8 you can make reservations that start on July 8," and that many are "reserved within minutes after the 7:00 a.m. opening."\[1\] The alert engine gets the most value from two features: a predictable 7:00 a.m. PT release-day alert, and cancellation polling.

**2. Non-Rec.gov lookouts are few, and they're either hard or impossible to monitor.** Only Quartz Mountain (WA State Parks, GoingToCamp) sits on a platform that open-source tools already poll. Thorny Mountain (WV) sells out at midnight a year ahead, and a third-party tracker reports that "West Virginia State Parks doesn't release the Thorny Mountain Fire Tower's cancellations online."\[2\] Werner Peak (MT DNRC) is booked only by phone on one day in February.\[3\] The private and nonprofit lookouts are on Airbnb.\[1\]

**3. The inventory changes every season.** Closures rotate yearly. The FFLA marks Arid Peak, Little Guard, Lookout Butte, Evergreen Mountain and Fall Mountain as "Maintenance Closure 2026," Bishop Mountain as "Administrative Closure 2026," and Oak Flat, Walde and Mt. Wam as "Currently Unavailable."\[1\] New rentals also appear: the Monongahela National Forest announced on September 8, 2026 that "The Red Oak Fire Lookout on the Gauley Ranger District of the Monongahela National Forest is now available to rent." Your data model needs a status field that you re-validate each season, separate from the RIDB "reservable" flag.

## Details

### Deliverable 1 — State-by-state inventory

Unless otherwise noted, the platform is Recreation.gov (6-month rolling window, 7:00 a.m. PT). The Rec.gov facility IDs come from the FFLA's links and are the IDs you pass to `/api/camps/availability/campground/{id}/month`.

**Non-Recreation.gov lookouts (priority list)**

| State | Lookout | Operator | Location | Platform | Booking window / release | Status / notes |
|---|---|---|---|---|---|---|
| WA | Quartz Mountain Lookout | Washington State Parks (Mount Spokane SP) | 47.88525, -117.08250 (per trailchick.com); 2.7-mi hike/bike from Selkirk Lodge | GoingToCamp (washington.goingtocamp.com) or call center (888) 226-7688\[4\] | "You can reserve up to nine months in advance of your arrival date"; 2-night minimum; season roughly June 15–Oct 1 | Active. 10-ft tower; sleeps 4 |
| WA | North Mountain Lookout | Friends of North Mountain (nonprofit), Darrington | Darrington, SR 530 area | Airbnb | Host-managed | Active per FFLA/WTA |
| WA | Lorena Butte Relocated Lookout | Private (Lefever Holbrook Ranch), Goldendale | Near Goldendale off Hwy 97 | Airbnb (FFLA link); WTA also points to the ranch's Facebook | Host-managed | Active; added 2021 |
| WV | Thorny Mountain Fire Tower | WV State Parks (Seneca State Forest) | Seneca SF, Dunmore (forest centroid ~38.33, -79.94) | WV State Parks online portal (reservations.wvstateparks.com per a third-party blog; vendor unconfirmed) plus forest office 304-799-6213 | "Online bookings become available at 12:00 AM on the first day of the month, one year in advance"; May–Oct season\[5\] | Active. Sells out at release; cancellations reportedly not released online\[6\] |
| MT | Werner Peak Lookout | Montana DNRC (Stillwater State Forest, State Trust Land) | ~23 mi N of Whitefish, 6,960 ft | **Phone only**: 406-881-2371; "no voicemail reservation requests or email reservation requests" | 2026: calls taken Tue Feb 3, 2026, 8:00am–4:30pm; rentable July 6–31 and Sept 1–30 (staffed as an active lookout in August); max 2 nights per guest per season; $60 + bed tax | Active. Release date shifts yearly (Jan 1 before 2024, Feb 1 in 2024, first Tuesday of Feb in 2025–26) |
| ID | Crystal Peak Relocated Lookout | Private owner | N. Idaho | Airbnb | Host-managed | Active per FFLA |
| ID | Moon Pass Replica Lookout (Half Moon) | Private owner | N. Idaho (Moon Pass area) | Airbnb | Host-managed | Replica, not historic |
| ID | Moon Pass Replica Lookout (Full Moon) | Private owner | Same | Airbnb | Host-managed | Replica, not historic |
| WI | Gordon Fire Tower Cabin | Friends of the Bird Sanctuary (nonprofit) | Gordon, Douglas County | Airbnb (airbnb.com/h/gordonfiretower) | "Now booking June through October for 2026" | Active. Guests stay in a ground cabin with exclusive access to the 100-ft Aermotor tower; $99/night in 2021 |

**Recreation.gov lookouts by state (FFLA list as of Aug 2026, plus Red Oak)**

| State | Count | Lookouts (closures flagged) |
|---|---|---|
| Montana | 27 | Big Creek Baldy, Big Hole, Cougar Peak, Diamond Butte, Double Arrow, Garnet Mountain, Garver Mountain, Gem Peak, Gird Point, Granite Butte, Hornet, McCart, McGuire Mountain, Meadow Peak, Medicine Point, Minton Peak, Mission, Monument Peak, Mt. Baldy, **Mt. Wam (Currently Unavailable)**, Sex Peak, Strawberry Lookout Cabin, Thompson Peak, Up Up, Webb Mountain, West Fork Butte, Yaak Mountain |
| Oregon | 18 | Acker Rock (Aug 1–Nov 15), Acorn Woman Peak, Bald Butte, Bald Knob, Clear Lake Butte, Drake Peak, **Fall Mountain (Maintenance Closure 2026)**, Fivemile Butte, Gold Butte, Green Ridge, Hager Mountain (winter only, Nov 15–May 15; staffed in summer), Indian Ridge, Lake of the Woods, Pickett Butte, Snow Camp, Tamarack Lookout Cabin, Timber Butte Replica, Warner Mountain |
| Idaho | 14 | **Arid Peak (Maintenance Closure 2026)**, Bald Mountain, **Bishop Mountain Lookout Cabin (Administrative Closure 2026)**, Castle Butte, Deadwood, Deer Ridge, **Little Guard (Maintenance Closure 2026)**, **Lookout Butte (Maintenance Closure 2026)**, Lunch Peak, Scurvy Mountain, Shorty Peak, Spyglass Lookout Ground House, Surveyors Ridge (mid-July–end Sept), **Walde Lookout Cabin (Currently Unavailable; normally winter-only, mid-Dec–late Mar)** |
| California | 10 | Bear Basin, Black Mountain, Calpine, Girard Ridge, Hirz Mountain, Little Mt. Hoffman, **Oak Flat (Currently Unavailable)**, Pine Mountain, Post Creek, Sardine Peak |
| Washington | 5 | Clearwater Lookout Cabin (year-round), **Evergreen Mountain (Maintenance Closure 2026)**, Heybrook (May 1–Oct 31), Steliko Point, Tyee |
| Colorado | 2 | Jersey Jim (mid-May to mid-Oct), Mestaa'Ėhehe (Squaw) Mountain |
| Wyoming | 2 | Spruce Mountain (USFS page currently shows a "Site Closed" banner; when open, mid-June–Oct 1, max 2 consecutive nights), Sheep Mountain |
| South Dakota | 1 | Summit Ridge Lookout Cabin |
| West Virginia | 1 | **Red Oak Fire Lookout** (Monongahela NF; Rec.gov facility 10373939; $100/night; opened Sept 8, 2026, rentable through Nov 30; 2027 season April 15–Nov 30).\[7\]\[8\] It isn't on the FFLA list yet. |

**Lookouts worth showing as "not reservable" pins:** Washington's Hidden Lake Lookout and Mount Pilchuck are first-come-first-served overnight lookouts, not rentals. Trailchick notes "many in the lookout community have said Pilchuck is not officially open for overnight stays."\[9\] There's also a growing group of new-build "lookout-style" Airbnbs, such as the Asheville NC Lookout Tower Cabin, Glade Top Fire Tower Treehouse (MO) and The Lookout Tower at Selah Ridge (GA). They aren't historic lookouts, so put them in a separate layer if you include them at all.

**Discrepancies to resolve in your seed data:**
- Your note lists Yaak Mtn, Spruce Mtn and Monument Peak as non-reservable POIs. However, the FFLA links all three to Recreation.gov campground pages, and the Yaak page (234387) describes a working rental.\[1\]\[10\] Re-check RIDB's `Reservable` flag against the live campground endpoint each season, because they can disagree.
- Cheryl Hill's Oregon site notes that Timber Butte (built as a rental) and Tamarack (a cabin next to a tower) are "not a fire lookout," along with Fremont Point. She counted 16 true Oregon lookout rentals as of January 2023,\[11\] against FFLA's 18 for 2026. Decide whether you'll count "lookout-adjacent" cabins.
- The "only rentable lookout east of the Mississippi" claim made by The Dyrt and others about Thorny Mountain is out of date. Gordon (WI) opened around 2020 and Red Oak (WV) opened in 2026.\[7\]\[12\]\[13\]\[14\]

### Deliverable 2 — National count

| Bucket | Count (2026) | Notes |
|---|---|---|
| Recreation.gov (USFS) | ~80 (79 FFLA + Red Oak) | About 10 closed/unavailable for 2026, leaving roughly 70 bookable this season |
| State agency (WA Parks, WV Parks, MT DNRC) | 3 | GoingToCamp, WV portal, phone |
| Nonprofit/private (Airbnb) | 6 | 2 WA, 3 ID, 1 WI |
| **Total** | **~89** | Matches My Frugal Home's claim that "At present, there are at least 85 lookout towers in the U.S. that you can rent overnight" |

Supply is tiny compared with the number of surviving towers. FFLA's state tables show, for example, 512 known lookout sites in California with 217 standing, and 997 sites in Idaho with 150 standing.\[15\] In a December 2017 Oregonian report, Jamie Hale wrote that "The U.S. Forest Service manages 160 towers in Oregon and Washington, of which 22 are available for rent." Scarcity is why cancellation alerts are worth building.

### Deliverable 3 — Non-Recreation.gov platforms: API, tooling and restrictions

| Platform | Lookouts | Availability API | Open-source support | Anti-bot / ToS | Verdict |
|---|---|---|---|---|---|
| **Recreation.gov** (baseline) | ~80 | RIDB (official; API key; Airbyte's Recreation.gov connector docs state "The Recreation API has a rate limit of 50 requests per minute") plus the undocumented `/api/camps/availability/campground/{id}/month` | camply (default provider), many others | KQED reports the contractors' terms of use "prohibit the use of robots, bots and scraping," though it notes those terms weren't found legally binding unless agreement was prominently displayed. I found no primary evidence of datacenter-IP blocking | Core integration. Poll conservatively and cache |
| **GoingToCamp / Camis** (WA State Parks) | Quartz Mountain | Undocumented JSON API under `/api/` (camply issue #309 logs `GET /api/resourceLocation`)\[16\] | camply supports it, with washington.goingtocamp.com and wisconsin.goingtocamp.com in its provider list\[17\] | Some GoingToCamp tenants have added CAPTCHA. Michigan's midnrreservations.com returned a 403 via DataDome, and the camply maintainer said "If other providers implement captcha as well, they'll no longer be supported." Ontario Parks did the same (#287).\[16\] Parks Canada support also broke (#370)\[18\] | Feasible today for WA, but fragile. Watch for DataDome |
| **WV State Parks portal** | Thorny Mountain | Unknown. Vendor not confirmed (the 2019 launch announcement names none)\[19\]\[20\] | None known | Cancellations reportedly aren't released online | Don't poll. Send a "1st of month, 12:00 AM ET, 12 months out" release alert |
| **Montana DNRC** | Werner Peak | None (phone only) | N/A | N/A | Annual calendar alert ahead of the February phone day |
| **Airbnb** | 6 | No public API for availability. Airbnb's terms generally prohibit scraping (I didn't verify current clauses) | Commercial scrapers only | High | Link out only. You could manually mark "season open" dates (e.g., Gordon's "June through October") |

### Deliverable 4 — Seeding coordinates and metadata

| Source | What it gives | Licensing / completeness |
|---|---|---|
| **FFLA state lookout lists** (firelookout.org/lookouts/us/{st}/) | Per-state tables with name, county, **lat/long**, type, status (Standing/Gone/Removed) and NHLR/FFLOS register numbers. The rental page links directly to Rec.gov IDs | Best single source for coordinates of standing lookouts. No stated open license, so ask FFLA for permission and attribute them |
| **National Historic Lookout Register** (nhlr.org) | Register entries for historic lookouts (e.g., Thorny Mountain cited to nhlr.org/lookouts/us/wv/...) | Historic subset only; licensing unclear |
| **RIDB / Recreation.gov** | Facility metadata, coordinates, reservable flag, facility IDs | Federal data and freely usable, but the reservable flag can lag reality |
| **OpenStreetMap / Overpass** | `building=fire_lookout`, `emergency=fire_lookout`, `man_made=tower` + `tower:type=observation` | ODbL: share-alike on derived databases plus attribution. Tagging is inconsistent, so use OSM to snap and validate coordinates rather than as the primary list |
| **Wikidata** | Many NRHP-listed lookouts with coordinates | CC0, the easiest license for reuse |
| **Wikipedia lists** ("List of fire lookout towers" and per-state lists) | Names, NRHP links, prose (e.g., "There are 11 lookouts that may be rented in California")\[21\] | CC BY-SA, and often out of date. Use for discovery only |
| **USFS recreation sites data** | FS pages list "LOOKOUT/CABIN" as a site type (e.g., Boise NF shows 13)\[22\] | Public domain. Useful for catching new FS rentals before FFLA lists them |
| **Cheryl Hill, "Every Lookout in Oregon"** | Curated OR/WA rental spreadsheet | Personal site; ask before reusing |

The recommended seed pipeline: start from the FFLA rental list, join it to RIDB by facility ID, take coordinates from RIDB or the FFLA state lists, cross-check against OSM, and hand-curate the nine non-Rec.gov entries.

### Deliverable 5 — Reviews, ratings and popularity

- **Recreation.gov search API:** According to third-party documentation, `https://www.recreation.gov/api/search` returns `"average_rating"` and `"number_of_ratings"` per facility (e.g., `"average_rating": 4.08547`, `"number_of_ratings": 117`).\[23\] This is the cleanest first-party rating source for about 90% of the pins. Confirm it with a live request.
- **Google Places:** "You must not pre-fetch, cache, or store Places API content beyond the allowed exceptions." Only the place ID "can therefore [be stored] indefinitely," and latitude/longitude can be cached for up to 30 consecutive days.\[24\]\[25\] Reviews and ratings must be fetched live at display time and can't go into your database.\[26\]
- **Tripadvisor Content API:** "Your first 5,000 API calls are free every month." The caching policy says "Caching, storing or indexing is not permitted for any content except Location ID."\[27\]\[28\] Thorny Mountain does have a Tripadvisor listing.\[29\]
- **The Dyrt, Hipcamp, Campendium, AllTrails:** I found no public APIs. The Dyrt has lookout pages with reviews (e.g., Werner Peak has one 5.0 review),\[30\] but scraping them would likely breach ToS. Link out instead of ingesting.
- **Popularity proxy you can compute yourself:** how quickly a site sells out after its 7:00 a.m. release, and how often cancellations appear. Red Oak's first season, for instance, reportedly booked solid within four days.\[31\] This proprietary metric is probably more useful to users than star ratings.

### Deliverable 6 — Extending to cabins and campsites

| Vendor | State park systems (per a 2026 open-source survey, Tim-Army/State-Parks, plus vendor sources) | Open-source coverage |
|---|---|---|
| **Tyler / US eDirect (UseDirect)** | CA, FL, OH, AZ, NV, VA, IL, MO, ND, MN, WY\[32\] | camply covers many through its UseDirect provider (ReserveCalifornia, Florida, Ohio, Arizona, Virginia, Minnesota, Missouri, Maricopa County, Fairfax County, Oregon Metro)\[33\] |
| **Aspira / ReserveAmerica** | NY, TX, GA, OR, IA, UT, NE, NM, NC, MT, DE, MD, KY, IN, PA, OK, CT, NH, RI, MA, AK, VT; CO on Aspira's newer platform\[32\] | **Not supported by camply**, the largest gap. The kdelalic/campground-checker repo claims a native ReserveAmerica client\[34\] |
| **Brandt / Itinio** | TN, SC, AL (Alabama converted from Tyler/US eDirect in Dec 2022), SD, LA\[35\] | No camply provider. Tim-Army's scraper reads embedded `var sites` JSON from Brandt pages\[32\] |
| **GoingToCamp / Camis** | WA, WI (MI is now CAPTCHA-blocked) | camply |
| **Recreation.gov** | All federal | camply and many others |

Two cautions apply. First, vendor assignments churn: Maryland moved to ReserveAmerica ("Partner Since 2026"),\[18\]\[36\] and camply still lists an AlabamaStateParks UseDirect variation even though Alabama has since moved to Brandt.\[33\]\[35\] Second, CAPTCHA adoption is spreading across vendors. Build each provider as a pluggable module with health checks.

## Recommendations

1. **Phase 1 (covers about 90% of value):** Build on Recreation.gov. Seed from the FFLA rental list's facility IDs. Poll the month endpoint for date ranges users are watching, prioritizing the upcoming release date (today + 6 months, polled from 7:00 a.m. PT). Pull ratings from the search API.
2. **Phase 1b:** Add GoingToCamp for Quartz Mountain by reusing or porting camply's provider. Monitor for DataDome 403s.
3. **"Release-calendar" alert type** for unpollable sites: Thorny Mountain (1st of each month at midnight, 12 months out), Werner Peak (DNRC phone day, re-checked each January), and Airbnb season openings. This feature fits these sites better than polling, and you can say so to users.
4. **Status layer:** Store seasonal status (open, maintenance closure, winter-only) separately from the RIDB flag, and re-scrape the FFLA page and USFS site pages each winter.
5. **Compliance:** Run low-frequency, cached, user-driven polling with an identifiable user agent. Don't auto-book. Store only Google place IDs and Tripadvisor location IDs. Prefer residential or edge infrastructure only if you can do so within the platforms' terms; the safer approach is simply to keep request volume low.

## Caveats
- The national count depends on FFLA's list, which is volunteer-maintained. It omitted Red Oak, and earlier versions included McCarthy Point (CA), which has since dropped off. Expect ±5.
- The WV State Parks vendor, Recreation.gov's anti-bot posture toward cloud IPs, and the absence of APIs at The Dyrt, Hipcamp, Campendium and AllTrails weren't confirmed from primary sources.
- The Recreation.gov rating fields and the 50 requests/minute RIDB limit come from third-party documentation.
- An aggregator claims Red Oak's 2027 bookings open January 1. That conflicts with the standard 6-month rolling window, so verify it on Recreation.gov.\[31\]
- Coordinates in the tables are approximate; use the FFLA or RIDB values for pins.

## Sources

1. [Lookout Rentals - Forest Fire Lookout Association](https://firelookout.org/resources/rentals/)
2. [Book Thorny Mountain Fire Tower Campsite - Get Reservations & Track Cancellations](https://reservenature.com/campground/west-virginia/seneca-state-forest/thorny-mountain-fire-tower)
3. [Werner Peak Lookout](https://visitmt.com/listing/werner-peak-lookout-18308)
4. [State Parks expands same-day camping reservations to all campgrounds](https://parks.wa.gov/news/2025/state-parks-expands-same-day-camping-reservations-all-campgrounds)
5. [Lodging at Seneca State Forest - West Virginia State Parks](https://wvstateparks.com/parks/seneca-state-forest/lodging/)
6. [How do I go about renting the fire tower?](https://www.tripadvisor.com/FAQ_Answers-g59020-d10781566-t4773413-How_do_I_go_about_renting_the_fire_tower.html)
7. [Red Oak Fire Lookout Opens for Overnight Stays](https://parsonsadvocate.com/news/pa-local-stories/red-oak-fire-lookout-opens-for-overnight-stays-2026-09-16/)
8. [Red Oak Fire Lookout](https://www.recreation.gov/camping/campgrounds/10373939)
9. [Washington State Fire Lookouts Open for Overnight Stays](https://www.trailchick.com/washington-state-fire-lookouts-open-for-overnight-stays/)
10. [Yaak Mtn. Lookout Rental](https://www.recreation.gov/camping/campgrounds/234387)
11. [How to Rent a Fire Lookout](https://cherylhill.net/firelookouts/lookout-rentals/)
12. [Guardians of the Past, Treasures of the Present](https://wonderfulwv.com/guardians-of-the-past-treasures-of-the-present/)
13. [West Virginia Has the Only Reservable Fire Tower East of the Mississippi](https://thedyrt.com/magazine/local/thorny-mountain-fire-tower/)
14. [Gordon - FOREST LOOKOUTS](https://centraluslookouts.weebly.com/gordon1.html)
15. [United States - Forest Fire Lookout Association](https://firelookout.org/lookouts/us/)
16. [GoingToCamp midnrreservations.com ConnectionError](https://github.com/juftin/camply/issues/309)
17. [Providers - camply - juftin](https://juftin.com/camply/providers/)
18. [Issues · juftin/camply](https://github.com/juftin/camply/issues)
19. [Camping reservations now online for all West Virginia state parks - West Virginia Press Association](https://wvpress.org/wvpa-sharing/camping-reservations-now-online-for-all-west-virginia-state-parks/)
20. [Online camping reservations make booking your favorite campsite easier - West Virginia State Parks](https://wvstateparks.com/everything-you-need-to-know-to-reserve-a-campsite-at-wv-state-parks/)
21. [List of fire lookout towers](https://en.wikipedia.org/wiki/List_of_fire_lookout_towers)
22. [Boise National Forest - Deadwood Lookout Rental Cabin](https://www.fs.usda.gov/recarea/boise/recarea/?recid=5052)
23. [Recreation.gov API for AI agents](https://www.firecrawl.dev/alexandria/recreation-gov)
24. [Policies and attributions for Places API](https://developers.google.com/maps/documentation/places/web-service/policies)
25. [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
26. [Can you store Places API results? Every caching policy, compared](https://openplacesapi.com/blog/can-you-store-places-api-results)
27. [Caching Policy](https://tripadvisor-content-api.readme.io/reference/caching-policy)
28. [Grow your brand with powerful content](https://www.tripadvisor.com/business/solutions/hotels/content-api)
29. [THORNY MOUNTAIN FIRE TOWER - Campground Reviews](https://www.tripadvisor.com/Hotel_Review-g59020-d10781566-Reviews-Thorny_Mountain_Fire_Tower-Dunmore_West_Virginia.html)
30. [Werner Peak Lookout Camping](https://thedyrt.com/camping/montana/werner-peak-lookout)
31. [Red Oak Fire Tower opens for overnight reservations in Monongahela Forest - Archynewsy](https://www.archynewsy.com/red-oak-fire-tower-opens-for-overnight-reservations-in-monongahela-forest/)
32. [GitHub - Tim-Army/State-Parks: Searchable, sortable table of official state park systems for all 50 U.S. states · GitHub](https://github.com/Tim-Army/State-Parks)
33. [variations - camply](https://juftin.com/camply/reference/providers/usedirect/variations/)
34. [GitHub - kdelalic/campground-checker · GitHub](https://github.com/kdelalic/campground-checker)
35. [State of Nebraska, Nebraska Game & Parks Commission](https://das.nebraska.gov/materiel/purchasing/6909Z1/RFP%206909%20Z1%20BRANDT,%20File%203%20of%203%20-%20REDACTED%20Technical.pdf)
36. [Aspira Connect](https://aspiraconnect.com/state-parks/)
