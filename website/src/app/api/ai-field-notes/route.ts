import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title, location, shoot_date, eos_total, effort_label,
      discoveries, scores, weather, notes_so_far,
    } = body;

    const discList = discoveries?.length
      ? discoveries.map((d: { name: string; type: string; rarity_tier: string }) =>
          `${d.name} (${d.type}, ${d.rarity_tier})`
        ).join(", ")
      : "none logged";

    const text = await callClaude(`You are writing field notes for a sunrise expedition show called The Zora Files. The host is a systems thinker with dry humor who is methodical but warm. Notes should read like a field journal: observational, specific, honest about what worked and didn't.

Expedition:
- Title: "${title}"
- Location: ${location}
- Date: ${shoot_date}
- Eos Index: ${eos_total}/100 (Sky: ${scores?.sky || "?"}/50, Setting: ${scores?.setting || "?"}/30, Conditions: ${scores?.conditions || "?"}/20)
- Effort: ${effort_label}
- Discoveries: ${discList}
${weather ? `- Weather: ${weather}` : ""}
${notes_so_far ? `- Host's rough notes: ${notes_so_far}` : ""}

Write 3-5 sentences of field notes. Be specific to this expedition. Include:
- What the sunrise was like (based on the scores)
- Any notable discoveries or conditions
- One thing learned or one thing to do differently next time

Write in first person. No headers or bullet points. Return only the text, no JSON.`, { maxTokens: 512 });

    return NextResponse.json({ notes: text.trim() });
  } catch (err) {
    console.error("Field notes error:", err);
    return NextResponse.json({ error: "Failed to generate notes" }, { status: 502 });
  }
}
