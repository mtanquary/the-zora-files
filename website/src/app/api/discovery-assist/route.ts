import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const location = formData.get("location") as string;
  const photo = formData.get("photo") as File | null;

  if (!name && !photo) {
    return NextResponse.json(
      { error: "Provide a name or photo" },
      { status: 400 }
    );
  }

  const content: Array<Record<string, unknown>> = [];

  // If photo provided, add it for visual ID
  if (photo) {
    const bytes = await photo.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: photo.type || "image/jpeg",
        data: base64,
      },
    });
  }

  const prompt = `You are an identification assistant for The Zora Files, a sunrise expedition show. Your job is to take a user-entered discovery and resolve it into a canonical record (correct spelling, canonical name, fun fact, rarity).

The user entered: ${name ? `"${name}"` : "(no name — see attached photo)"}
${type ? `Category they picked: ${type}` : ""}
${location ? `Expedition location (use this heavily, especially for geographic and historic features): ${location}` : ""}
${photo ? "A photo is attached — use it as the primary signal for wildlife/plant identification." : ""}

A discovery can be ANY of four types — treat them all as first-class:

  wildlife            — animals (birds, mammals, reptiles, insects, fish, etc.)
  plant               — plants of any kind
  geographic          — named landforms: mountains, peaks, canyons, washes, rock
                        formations, springs, dunes, buttes, valleys, drainages,
                        named viewpoints, named bodies of water
  cultural_historical — human-made or culturally significant: ruins, petroglyph
                        sites, historic ranches, named trails, lookouts, mining
                        relics, named structures, plaques, monuments

For GEOGRAPHIC and CULTURAL/HISTORICAL features the expedition location is your
strongest signal. A "wash" near "Coon Bluff, Arizona" should resolve to a known
Sonoran-area wash; "petroglyphs" near a specific ridge probably means a known
petroglyph site close by. Use the location to disambiguate, fix typos, and pick
the canonical local name.

Respond with ONLY a JSON object — no explanation, no markdown fences:

{
  "understood": <true if you confidently identified what the user meant; false if
                 the entry is unfamiliar, too ambiguous to resolve, or appears to
                 be a typo too far from anything you can place near the location>,
  "corrected_name": "<canonical name with correct spelling and capitalization, OR
                      null if understood=false>",
  "scientific_name": "<Latin/scientific name for wildlife or plants, null for
                       geographic/cultural_historical or if unknown>",
  "type": "<wildlife|plant|geographic|cultural_historical — your best guess>",
  "rarity_tier": "<common|uncommon|rare|very_rare|exceptional>",
  "suggested_points": <number inside the rarity range: common 5-10, uncommon
                       15-25, rare 35-50, very_rare 65-85, exceptional 100-150>,
  "fun_fact": "<one interesting, true fact about this discovery — under 140
                characters, OR null if understood=false>",
  "plausibility": "<plausible|unlikely|impossible — for wildlife/plants only,
                    where location matters; null for geographic/cultural>",
  "plausibility_note": "<if unlikely/impossible, why, under 80 chars, else null>",
  "confidence": "<high|medium|low>"
}

Rarity tier — applies to ALL four categories:

  common       — everyday encounters in this kind of environment
                 (Gambel's Quail; a small unnamed wash; ordinary granite outcrop)
  uncommon     — notable but not unusual
                 (Roadrunner; a locally-named wash; a small ruin)
  rare         — regional landmarks or notable species/features
                 (Vermilion Flycatcher; a named butte; a significant petroglyph site)
  very_rare    — recognized well beyond the immediate region
                 (Bald Eagle; a major canyon system; a registered historic site)
  exceptional  — globally famous OR once-per-series finds
                 (Condor; Grand Canyon; a UNESCO-tier landmark)

If understood = false: still return reasonable defaults for type and rarity_tier
so the form has something to fall back on (use the user's category if provided,
otherwise "geographic" + "common"). Set confidence = "low".`;

  content.push({ type: "text", text: prompt });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Claude API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "No response from Claude" },
        { status: 502 }
      );
    }

    // Parse JSON response
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Discovery assist error:", err);
    return NextResponse.json(
      { error: "Failed to get AI assistance" },
      { status: 502 }
    );
  }
}
