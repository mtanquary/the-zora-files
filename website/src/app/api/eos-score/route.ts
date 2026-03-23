import { NextRequest, NextResponse } from "next/server";
import { buildEosPrompt, parseEosResponse } from "@/lib/eos-prompt";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured. Use copy-paste mode instead." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const photo = formData.get("photo") as File | null;
  const location = formData.get("location") as string | null;
  const trail = formData.get("trail") as string | null;
  const effort_label = formData.get("effort_label") as string | null;

  if (!photo) {
    return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  }

  // Convert photo to base64
  const bytes = await photo.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = photo.type || "image/jpeg";

  const prompt = buildEosPrompt({
    location: location || undefined,
    trail: trail || undefined,
    effort_label: effort_label || undefined,
  });

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
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Claude API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "No text in Claude response" },
        { status: 502 }
      );
    }

    const result = parseEosResponse(text);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({ eos_index: result.data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach Claude API" },
      { status: 502 }
    );
  }
}
