import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJsonResponse } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, eos_total, effort_label, discoveries, notes, weather } = body;

    const discList = discoveries?.length
      ? `Discoveries: ${discoveries.map((d: { name: string }) => d.name).join(", ")}`
      : "No notable discoveries";

    const text = await callClaude(`You are naming episodes for a sunrise expedition show called The Zora Files. Episode titles are short, evocative, and often reference a specific moment, discovery, or theme from the expedition. They follow the style: "The Benchmark", "The Habitat Flip", "The Time Capsule".

Expedition details:
- Location: ${location}
- Eos Index: ${eos_total}/100
- Effort: ${effort_label}
- ${discList}
${weather ? `- Weather: ${weather}` : ""}
${notes ? `- Notes: ${notes}` : ""}

Suggest 5 episode titles. Each should be 2-4 words, start with "The", and capture something specific about this expedition. No generic titles.

Return ONLY a JSON array of strings, no explanation:
["The ...", "The ...", "The ...", "The ...", "The ..."]`, { maxTokens: 256 });

    const titles = parseJsonResponse<string[]>(text);
    return NextResponse.json({ titles });
  } catch (err) {
    console.error("Title suggestion error:", err);
    return NextResponse.json({ error: "Failed to generate titles" }, { status: 502 });
  }
}
