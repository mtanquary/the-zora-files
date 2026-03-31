import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJsonResponse } from "@/lib/ai-client";

export const maxDuration = 60;

/** Geocode a location string to lat/lng using OpenStreetMap Nominatim. */
async function geocode(
  location: string,
  region?: string,
  country?: string
): Promise<{ lat: number; lng: number } | null> {
  const query = [location, region, country].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TheZoraFiles/1.0" },
    });
    const data = await res.json();
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // fall through
  }
  return null;
}

/** Fetch exact sunrise/sunset times from sunrise-sunset.org API.
 *  When tzid is provided, the API returns times in that timezone. */
async function getSunriseTimes(
  lat: number,
  lng: number,
  date: string,
  tzid?: string
): Promise<{
  sunrise: string;
  sunset: string;
  civil_twilight_begin: string;
} | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    date,
    formatted: "0",
  });
  if (tzid) params.set("tzid", tzid);
  const url = `https://api.sunrise-sunset.org/json?${params}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data?.status === "OK") {
      return {
        sunrise: data.results.sunrise,
        sunset: data.results.sunset,
        civil_twilight_begin: data.results.civil_twilight_begin,
      };
    }
  } catch {
    // fall through
  }
  return null;
}

/** Parse time from an ISO 8601 string with offset (e.g. "2026-03-26T06:18:06-07:00").
 *  Extracts the local time directly from the string so it stays in the target timezone. */
function formatTime(iso: string): string {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return iso;
  const hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

/** Estimate golden hour end as ~1 hour after sunrise. */
function goldenHourEnd(sunriseIso: string): string {
  const match = sunriseIso.match(/T(\d{2}):(\d{2})/);
  if (!match) return "";
  let hours = parseInt(match[1], 10) + 1;
  if (hours >= 24) hours -= 24;
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, date, region, country, timezone } = body;

    // Geocode, then fetch real sunrise data using the browser's timezone
    const coords = await geocode(location, region, country);
    const sunData = coords
      ? await getSunriseTimes(coords.lat, coords.lng, date, timezone)
      : null;

    // Build sunrise context for the prompt
    let sunriseContext = "";
    if (sunData && coords) {
      const sunrise = formatTime(sunData.sunrise);
      const twilight = formatTime(sunData.civil_twilight_begin);
      const goldenEnd = goldenHourEnd(sunData.sunrise);
      sunriseContext = `
VERIFIED SUNRISE DATA (from astronomy API — use these exact times):
- Civil twilight begins: ${twilight} (local time)
- Sunrise: ${sunrise} (local time)
- Golden hour ends: ${goldenEnd} (local time)
- Coordinates: ${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°
- Timezone: ${timezone || "UTC"}`;
    }

    const text = await callClaude(
      `You are a pre-shoot intelligence analyst for a sunrise expedition show called The Zora Files. Given a location and date, provide actionable scouting intelligence.

Location: ${location}
${region ? `Region: ${region}` : ""}
${country ? `Country: ${country}` : ""}
Date: ${date}
${sunriseContext}

Provide intelligence in this JSON format only, no explanation:
{
  "likely_discoveries": [
    {
      "name": "<species or feature name>",
      "type": "<wildlife|plant|geographic|cultural_historical>",
      "rarity": "<common|uncommon|rare|very_rare|exceptional>",
      "tip": "<how to spot it, under 60 chars>",
      "detail": "<for uncommon or rarer: 2-3 sentences on habitat, behavior patterns, best time window, and what to listen/look for to increase odds of spotting. For common items: leave empty string>",
      "wiki_url": "<Wikipedia URL for this species/feature if one exists, otherwise empty string>"
    }
  ],
  "sunrise_notes": "<what to expect from the sunrise at this location and season. IMPORTANT: include the exact sunrise time and civil twilight time if provided above. 2-3 sentences.>",
  "positioning_tip": "<where to set up for best composition, 1-2 sentences>",
  "weather_watch": "<what weather patterns to watch for that affect scoring, 1 sentence>",
  "gear_priority": "<what gear matters most for this location, 1 sentence>"
}

Rules:
- Include 5-8 likely discoveries. Be specific to the actual location and season.
- Prioritize species that are realistically present at this time of year.
- For each discovery with rarity uncommon or higher, the "detail" field MUST contain specific, actionable advice for increasing odds of spotting it (habitat micro-location, time of day, calls to listen for, behavioral cues, seasonal patterns).
- For wiki_url, use the full English Wikipedia URL (e.g. "https://en.wikipedia.org/wiki/Vermilion_flycatcher"). Only include if you are confident the article exists. Use empty string if unsure.
- Use the verified sunrise times provided above — do not estimate or guess sunrise times.`,
      { maxTokens: 1200 }
    );

    const intel = parseJsonResponse<Record<string, unknown>>(text);

    // Attach raw sun data so the frontend can display authoritative times
    if (sunData && coords) {
      (intel as Record<string, unknown>).sun_data = {
        sunrise: formatTime(sunData.sunrise),
        civil_twilight: formatTime(sunData.civil_twilight_begin),
        golden_hour_end: goldenHourEnd(sunData.sunrise),
        sunrise_utc: sunData.sunrise,
        coords: { lat: coords.lat, lng: coords.lng },
      };
    }

    return NextResponse.json(intel);
  } catch (err) {
    console.error("Pre-shoot intel error:", err);
    return NextResponse.json(
      { error: "Failed to generate intel" },
      { status: 502 }
    );
  }
}
