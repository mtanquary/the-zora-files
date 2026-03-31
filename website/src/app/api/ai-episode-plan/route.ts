import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJsonResponse } from "@/lib/ai-client";

// Allow up to 60s for AI responses (default is 15s on some platforms)
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  Shared helpers (geocode + sunrise)                                 */
/* ------------------------------------------------------------------ */

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "TheZoraFiles/1.0" } });
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* fall through */ }
  return null;
}

async function getSunrise(lat: number, lng: number, date: string, tzid?: string) {
  const params = new URLSearchParams({ lat: lat.toString(), lng: lng.toString(), date, formatted: "0" });
  if (tzid) params.set("tzid", tzid);
  try {
    const res = await fetch(`https://api.sunrise-sunset.org/json?${params}`);
    const data = await res.json();
    if (data?.status === "OK") return data.results;
  } catch { /* fall through */ }
  return null;
}

function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return iso;
  const h = parseInt(m[1], 10);
  return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}

/* ------------------------------------------------------------------ */
/*  Known state — locations already planned                            */
/* ------------------------------------------------------------------ */

const PLANNED_LOCATIONS = [
  "Lost Dutchman State Park, Apache Junction, AZ",
  "Butcher Jones Recreation Site / Saguaro Lake, Fort McDowell, AZ",
  "Hieroglyphic Trailhead, Gold Canyon, AZ",
];

/* ------------------------------------------------------------------ */
/*  POST handler — dispatches by action                                */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "suggest-locations") return suggestLocations(body);
    if (action === "generate-plan") return generatePlan(body);
    if (action === "generate-production-sheet") return generateProductionSheet(body);

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Episode plan error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 502 });
  }
}

/* ------------------------------------------------------------------ */
/*  Action: suggest locations                                          */
/* ------------------------------------------------------------------ */

async function suggestLocations(body: Record<string, unknown>) {
  const { prompt, region, country } = body as {
    prompt?: string; region?: string; country?: string;
  };

  const text = await callClaude(
    `You are a location scout for a sunrise-chasing expedition show called The Zora Files. The host scores every sunrise on a 0-100 Eos Index (Sky 50, Setting 30, Conditions 20) and earns a Zora Score that adds effort, travel, and discovery points.

The show's Discovery Log tracks wildlife, plants, geographic features, and cultural/historical sites. Rarity tiers: common (5-10 pts), uncommon (15-20), rare (25-35), very rare (40-50), exceptional (60-75).

Home base: Queen Creek, Arizona, US.

Locations ALREADY planned (do NOT suggest these):
${PLANNED_LOCATIONS.map((l) => `- ${l}`).join("\n")}

${prompt ? `The host says: "${prompt}"` : "Suggest a diverse set of great sunrise locations."}
${region ? `Preferred region: ${region}` : ""}
${country ? `Country: ${country}` : ""}

Suggest 5 locations. For each, provide:
- A location well-suited for a sunrise expedition with strong scoring potential
- Why it's special for this show (sunrise quality + discovery opportunities)
- Notable uncommon/rare/very rare species or features that could be spotted there
- Estimated effort level and distance from Queen Creek, AZ

Return JSON only:
{
  "suggestions": [
    {
      "name": "<full location name with city/state>",
      "coordinates": "<lat, lng>",
      "distance_from_base": "<approximate miles>",
      "why": "<2-3 sentences: what makes this location ideal for The Zora Files — sunrise scoring potential and discovery opportunities>",
      "notable_discoveries": [
        { "name": "<species/feature>", "rarity": "<rarity tier>", "note": "<why it's findable here>" }
      ],
      "effort_level": "<Roadside|Trail|Summit|Remote|Expedition>",
      "best_season": "<when to go for best results>",
      "trail_info": "<trail name and distance if applicable, or 'roadside access'>",
      "fee": "<entry fee or 'free'>"
    }
  ]
}

Be specific and realistic. Prioritize locations with genuine sunrise quality AND interesting discovery potential. Consider terrain variety — canyons, lakes, mountains, desert flats, etc.`,
    { maxTokens: 2500 }
  );

  const result = parseJsonResponse<Record<string, unknown>>(text);
  return NextResponse.json(result);
}

/* ------------------------------------------------------------------ */
/*  Action: generate full plan                                         */
/* ------------------------------------------------------------------ */

async function generatePlan(body: Record<string, unknown>) {
  const {
    location, coordinates, region, country, date, timezone,
    episode_number, season, trail_info, fee, effort_level,
    notable_discoveries, purpose_notes, distance_from_base,
  } = body as Record<string, string>;

  // Fetch real sunrise data
  let sunriseInfo = "";
  const locationQuery = [location, region, country].filter(Boolean).join(", ");
  const coords = coordinates
    ? { lat: parseFloat(coordinates.split(",")[0]), lng: parseFloat(coordinates.split(",")[1].trim()) }
    : await geocode(locationQuery);

  if (coords && date) {
    const sun = await getSunrise(coords.lat, coords.lng, date, timezone);
    if (sun) {
      const sunrise = formatTime(sun.sunrise);
      const twilight = formatTime(sun.civil_twilight_begin);
      sunriseInfo = `
VERIFIED SUNRISE DATA for ${date}:
- Civil twilight: ${twilight}
- Sunrise: ${sunrise}
- Coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    }
  }

  const epNum = episode_number || "XX";
  const seasonNum = season || "01";
  const epCode = `S${seasonNum.toString().padStart(2, "0")}E${epNum.toString().padStart(2, "0")}`;

  const text = await callClaude(
    `You are writing an episode plan for The Zora Files, a sunrise-chasing expedition show. Generate a complete episode plan in markdown format.

Episode: ${epCode}
Location: ${location}
${region ? `Region: ${region}` : ""}
${country ? `Country: ${country}` : ""}
${coordinates ? `Coordinates: ${coordinates}` : ""}
${date ? `Target date: ${date}` : ""}
${trail_info ? `Trail info: ${trail_info}` : ""}
${fee ? `Fee: ${fee}` : ""}
${effort_level ? `Effort level: ${effort_level}` : ""}
${distance_from_base ? `Distance from home base: ${distance_from_base}` : ""}
${notable_discoveries ? `Notable discovery targets: ${notable_discoveries}` : ""}
${purpose_notes ? `Host's notes/goals: ${purpose_notes}` : ""}
${sunriseInfo}

Locations already filmed:
${PLANNED_LOCATIONS.map((l) => `- ${l}`).join("\n")}

IMPORTANT: Follow this EXACT markdown template structure. Fill in ALL sections with realistic, specific details. Generate a creative but descriptive episode title (2-4 words, starts with "The").

\`\`\`template
# ${epCode} — "The ___"

## Location
- **Name:** <full name with city, state/region, country>
- **Country:** <country code>
- **Region/state:** <state or region>
- **Coordinates:** <lat, lng>
- **Distance from home base:** <miles>
- **Trail/position:** <specific trail or viewing spot>
- **Fee:** <fee info>
- **Opens:** <access hours>

## Purpose
<2-3 sentences on what makes this episode unique, what it demonstrates about the show's scoring and discovery systems>

## Key content beats
- <4-6 bullet points of on-camera moments and educational angles>

## Sunrise note
<1-2 sentences on what to expect from the sunrise at this specific location — terrain effects, horizon type, light behavior>

## Travel details
- **Distance (mi):** <number>
- **Off-pavement (mi):** <number>
- **High-clearance required:** yes/no
- **Alt transport:** no (or specify)
- **International:** yes/no
- **Elevation gain (ft):** <number with trail context>

## Discovery targets
| Species/feature | Type | Rarity tier | Points | First unlock? |
|-----------------|------|-------------|--------|---------------|
<5-8 realistic species/features for this location and season, with correct rarity tiers and point ranges>

## Shot list
- [ ] <6-8 specific shots tailored to this location>

## Logistics
- **Sunrise time:** <use verified time if available, otherwise "fill before shoot">
- **Target arrival:** <minutes before sunrise>
- **Minutes before sunrise:** <fill on location>
- **Weather forecast:** _(fill night before)_
- **Moon phase:** _(fill night before)_
- **eBird recent sightings:** _(check night before)_

---

## Eos Index — sunrise quality (fill after filming)

### Sky (max 50)
| Component | Score | Notes |
|-----------|-------|-------|
| Color intensity (max 20) | | |
| Cloud engagement (max 15) | | |
| Horizon definition (max 15) | | <any location-specific note about horizon> |
| **Sky total** | **/50** | |

### Setting (max 30)
| Component | Score | Notes |
|-----------|-------|-------|
| Foreground composition (max 15) | | <what's in the foreground> |
| Location uniqueness (max 15) | | <what's unique> |
| **Setting total** | **/30** | |

### Conditions (max 20)
| Component | Score | Notes |
|-----------|-------|-------|
| Effort to reach (max 10) | | <effort context> |
| Weather/environmental challenge (max 10) | | |
| **Conditions total** | **/20** | |

### Eos Index: __/100

---

## Zora Score — full episode (fill after filming)

| Component | Points | Notes |
|-----------|--------|-------|
| Eos Index | /100 | From above |
| Travel distance | /5 | <distance> → <points> pts |
| Travel difficulty bonus | | <any bonuses> |
| Elevation gain | /4 | <elevation> → <points> pts |
| Pre-dawn arrival | /2 | <arrival plan> → <points> pts |
| Weather adversity | /3 | |
| Discovery points | | <discovery potential note> |
| Streak bonus | | <streak context> |
| **Zora Score total** | | |

---

## Discoveries (fill after filming)
| Name | Type | Rarity | Points | First unlock? | Photo? | Fun fact |
|------|------|--------|--------|---------------|--------|----------|
| | | | | | | |

## Field notes
_What happened, what surprised you, what would you do differently._
\`\`\`

Generate the COMPLETE plan following this template exactly. Be specific and realistic about species, terrain, and logistics. Use the verified sunrise time if provided.`,
    { maxTokens: 2500 }
  );

  // Extract markdown from the response (strip any wrapping fences)
  let plan = text.trim();
  if (plan.startsWith("```")) {
    plan = plan.replace(/^```(?:markdown|md)?\n?/, "").replace(/\n?```$/, "");
  }

  // Extract the title from the plan
  const titleMatch = plan.match(/^# S\d+E\d+ — "(.+?)"/m);
  const title = titleMatch?.[1] || "Untitled";
  const slugTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return NextResponse.json({
    plan,
    title,
    episode_code: epCode,
    folder_name: `${epCode}-${slugTitle}`.toLowerCase(),
    sunrise_time: sunriseInfo ? sunriseInfo.match(/Sunrise: (.+)/)?.[1] : null,
  });
}

/* ------------------------------------------------------------------ */
/*  Action: generate production sheet                                  */
/* ------------------------------------------------------------------ */

async function generateProductionSheet(body: Record<string, unknown>) {
  const { plan, date, timezone } = body as { plan: string; date?: string; timezone?: string };

  if (!plan) {
    return NextResponse.json({ error: "Plan content is required" }, { status: 400 });
  }

  const text = await callClaude(
    `You are creating a production sheet for a sunrise expedition episode of The Zora Files. The production sheet is a practical, day-of shoot guide derived from the episode plan.

Here is the episode plan:
---
${plan}
---

${date ? `Shoot date: ${date}` : ""}
${timezone ? `Timezone: ${timezone}` : ""}

Generate a production sheet in this EXACT style and structure. This is a real example to follow:

\`\`\`example
# S01E01 — "The Benchmark" — Production sheet

**Date:** March 22, 2026
**Location:** Lost Dutchman State Park, Apache Junction, AZ
**Trail:** Prospector's View (0.7 mi, moderate, ~200 ft gain)
**Fee:** $10/vehicle (cash or card)
**Sunrise:** 6:28 AM — arrive by 5:43 AM
**Drive time:** ~35 mi from home base — leave by 5:00 AM

---

## Tonight (night-before prep)

- [ ] Check weather forecast — cloud cover is GOOD for scoring, not bad
- [ ] Check moon phase
- [ ] Check eBird recent sightings for [location]
- [ ] Check PhotoPills for sun position at [coordinates]
- [ ] Charge phone, clear storage
- [ ] Charge backup battery
- [ ] Pack: water, layers, headlamp, cash/card for fee
- [ ] Set alarm — need to leave by [time]

---

## On arrival ([time])

- [ ] Start Merlin Bird ID passive sound logging immediately
- [ ] Open iNaturalist — location enabled, ready for photo IDs
- [ ] Set up phone on GorillaPod in locked timelapse position — do NOT move it once set
- [ ] Filmic Pro settings: manual WB 4000K, 24fps, ISO as low as possible
- [ ] Lock all camera settings before sunrise begins

---

## Shot list

| # | Shot | When | Notes |
|---|------|------|-------|
| 1 | ... | ... | ... |

---

## What to say on camera

[Section with subsections for Before sunrise, During sunrise, After sunrise, Discovery log, with specific guidance for THIS episode]

---

## Discovery targets — what to look/listen for

| Species | Type | Rarity | Points | What to watch for |
|---------|------|--------|--------|-------------------|
[Table with specific spotting tips for each target]

**Remember:** Photo-ID everything with iNaturalist. Merlin is running passively for bird audio.

---

## Sunrise scoring reference (fill live or right after)

### Eos Index (0–100)

| Category | Component | Max | Your score |
|----------|-----------|-----|------------|
| **Sky** | Color intensity | 20 | |
| | Cloud engagement | 15 | |
| | Horizon definition | 15 | |
| | **Sky total** | **50** | |
| **Setting** | Foreground composition | 15 | |
| | Location uniqueness | 15 | |
| | **Setting total** | **30** | |
| **Conditions** | Effort to reach | 10 | |
| | Weather/environmental challenge | 10 | |
| | **Conditions total** | **20** | |
| | **Eos Index** | **100** | |

### Zora Score

| Component | Points |
|-----------|--------|
[Pre-filled with estimates from the plan]

---

## Reminders

[3-5 location-specific reminders — terrain notes, character/tone guidance, things not to forget]
\`\`\`

Generate the COMPLETE production sheet for this episode. Be specific — use real details from the plan. Calculate drive times, arrival times, and departure times based on the sunrise time and distance. Include specific on-camera talking points relevant to THIS episode's unique angle. The "What to say on camera" section should have practical, natural-sounding guidance — not a script to read verbatim.`,
    { maxTokens: 2500 }
  );

  let sheet = text.trim();
  if (sheet.startsWith("```")) {
    sheet = sheet.replace(/^```(?:markdown|md)?\n?/, "").replace(/\n?```$/, "");
  }

  return NextResponse.json({ production_sheet: sheet });
}
