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

  const prompt = `You are a wildlife and nature identification assistant for a sunrise expedition show called The Zora Files.

${photo ? "Identify the species or feature in the attached photo." : ""}
${name ? `The user entered: "${name}"` : ""}
${type ? `Category: ${type}` : ""}
${location ? `Location: ${location}` : ""}

Respond with ONLY a JSON object, no explanation or markdown fences:

{
  "corrected_name": "<standardized common name with correct spelling>",
  "scientific_name": "<scientific/Latin name if applicable, null otherwise>",
  "type": "<wildlife|plant|geographic|cultural_historical>",
  "rarity_tier": "<common|uncommon|rare|very_rare|exceptional>",
  "suggested_points": <number within the rarity range: common 5-10, uncommon 15-20, rare 25-35, very_rare 40-50, exceptional 60-75>,
  "fun_fact": "<one interesting fact about this species/feature, under 120 characters>",
  "plausibility": "<plausible|unlikely|impossible>",
  "plausibility_note": "<if unlikely or impossible, explain why in under 80 characters, otherwise null>",
  "confidence": "<high|medium|low>"
}

Rarity guidelines for the southwestern US:
- Common: Gambel's Quail, Cactus Wren, Cottontail, common desert plants
- Uncommon: Gila Woodpecker, Roadrunner, Rock Wren
- Rare: Vermilion Flycatcher, Javelina, Osprey
- Very rare: Bald Eagle, Desert Tortoise, Chuckwalla
- Exceptional: once-per-series finds

Adjust rarity based on the specific location. A species common in Arizona might be rare elsewhere.`;

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
