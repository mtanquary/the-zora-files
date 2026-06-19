import { buildEosPrompt, parseEosResponse, type EosResponseData } from "@/lib/eos-prompt";

export interface EosScoreContext {
  location?: string;
  trail?: string;
  effort_label?: string;
  notes?: string;
}

export type EosScoreResult =
  | { success: true; data: EosResponseData }
  | { success: false; error: string; status: number };

/**
 * Scores a sunrise photo against the Eos Index rubric via the Claude API.
 * Shared by the admin tool (`/api/eos-score`) and member scoring
 * (`/api/member-score`) so both use identical scoring behavior.
 */
export async function scoreEosPhoto(
  base64: string,
  mediaType: string,
  context: EosScoreContext = {}
): Promise<EosScoreResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "API key not configured.",
      status: 503,
    };
  }

  const prompt = buildEosPrompt(context);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Claude API error: ${response.status}`, status: 502 };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      return { success: false, error: "No text in Claude response", status: 502 };
    }

    const result = parseEosResponse(text);
    if (!result.success) {
      return { success: false, error: result.error, status: 422 };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Failed to reach Claude API", status: 502 };
  }
}
