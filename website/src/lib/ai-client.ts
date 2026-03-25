/** Shared Claude API call helper for all AI features. */
export async function callClaude(
  prompt: string,
  options?: {
    image?: { base64: string; mediaType: string };
    maxTokens?: number;
  }
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const content: Array<Record<string, unknown>> = [];

  if (options?.image) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: options.image.mediaType,
        data: options.image.base64,
      },
    });
  }

  content.push({ type: "text", text: prompt });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens || 1024,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

/** Parse JSON from Claude response, stripping markdown fences if present. */
export function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return JSON.parse(cleaned);
}
