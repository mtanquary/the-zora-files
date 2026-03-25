import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJsonResponse } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, date, region, country } = body;

    const text = await callClaude(`You are a pre-shoot intelligence analyst for a sunrise expedition show called The Zora Files. Given a location and date, provide actionable scouting intelligence.

Location: ${location}
${region ? `Region: ${region}` : ""}
${country ? `Country: ${country}` : ""}
Date: ${date}

Provide intelligence in this JSON format only, no explanation:
{
  "likely_discoveries": [
    { "name": "<species/feature name>", "type": "<wildlife|plant|geographic|cultural_historical>", "rarity": "<common|uncommon|rare|very_rare>", "tip": "<how to spot it, under 60 chars>" }
  ],
  "sunrise_notes": "<what to expect from the sunrise at this location and time of year, 1-2 sentences>",
  "positioning_tip": "<where to set up for best composition, 1-2 sentences>",
  "weather_watch": "<what weather patterns to watch for that affect scoring, 1 sentence>",
  "gear_priority": "<what gear matters most for this location, 1 sentence>"
}

Include 4-6 likely discoveries. Be specific to the actual location and season. Prioritize species that are realistically present at this time of year.`, { maxTokens: 768 });

    const intel = parseJsonResponse<Record<string, unknown>>(text);
    return NextResponse.json(intel);
  } catch (err) {
    console.error("Pre-shoot intel error:", err);
    return NextResponse.json({ error: "Failed to generate intel" }, { status: 502 });
  }
}
