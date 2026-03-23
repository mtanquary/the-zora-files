/**
 * Generates the Eos Index scoring prompt for Claude.
 * Used by both the copy-paste flow and the direct API call.
 */
export function buildEosPrompt(context?: {
  location?: string;
  trail?: string;
  effort_label?: string;
}) {
  const contextBlock = context?.location
    ? `
## Context for this photo
- Location: ${context.location}${context.trail ? `\n- Trail/position: ${context.trail}` : ""}${context.effort_label ? `\n- Effort level: ${context.effort_label}` : ""}
`
    : "";

  return `You are scoring a sunrise photo using the Eos Index rubric. The Eos Index is a 0–100 sunrise quality score with three dimensions.

## Scoring rubric

### Sky: 50 points
| Component | Max | Description |
|-----------|-----|-------------|
| Color intensity | 20 | Saturation, vividness, range of hues |
| Cloud engagement | 15 | Dramatic lit clouds score high; clear sky moderate; flat overcast low |
| Horizon definition | 15 | Clean readable horizon = high; obstructed or flat = low |

### Setting: 30 points
| Component | Max | Description |
|-----------|-----|-------------|
| Foreground composition | 15 | Trail, cactus, water, flowers, person: compelling element in frame |
| Location uniqueness | 15 | Suburban roadside = low; remote wilderness = high |

### Conditions: 20 points
| Component | Max | Description |
|-----------|-----|-------------|
| Access difficulty | 10 | Drive-up viewpoint = 1–2; technical terrain or pre-dawn scramble to reach the vantage = 8–10 |
| Weather/environmental challenge | 10 | Perfect calm = 3–4; dramatic or difficult conditions = 7–10 |

## Scoring philosophy
The system rewards intentionality and effort, not just lucky weather. A spectacular sky at a roadside pull-off scores lower than a modest sky earned at the top of a difficult pre-dawn hike.
${contextBlock}
## Instructions
Evaluate the attached sunrise photo against the rubric above. Return ONLY a JSON object: no explanation, no markdown code fences, no commentary. Include a brief rationale string for each sub-score.

Use this exact schema:

{
  "eos_index": {
    "sky": {
      "color_intensity": { "score": <number>, "max": 20, "rationale": "<string>" },
      "cloud_engagement": { "score": <number>, "max": 15, "rationale": "<string>" },
      "horizon_definition": { "score": <number>, "max": 15, "rationale": "<string>" }
    },
    "setting": {
      "foreground_composition": { "score": <number>, "max": 15, "rationale": "<string>" },
      "location_uniqueness": { "score": <number>, "max": 15, "rationale": "<string>" }
    },
    "conditions": {
      "access_difficulty": { "score": <number>, "max": 10, "rationale": "<string>" },
      "weather_challenge": { "score": <number>, "max": 10, "rationale": "<string>" }
    }
  }
}`;
}

/**
 * Validates and parses the Claude JSON response.
 * Returns the parsed EosIndex sub-scores or an error message.
 */
export function parseEosResponse(raw: string): {
  success: true;
  data: EosResponseData;
} | {
  success: false;
  error: string;
} {
  try {
    // Strip markdown code fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    if (!parsed.eos_index) {
      return { success: false, error: "Missing eos_index key in response" };
    }

    const eos = parsed.eos_index;

    // Validate structure
    const required = {
      sky: ["color_intensity", "cloud_engagement", "horizon_definition"],
      setting: ["foreground_composition", "location_uniqueness"],
      conditions: ["access_difficulty", "weather_challenge"],
    };

    for (const [category, fields] of Object.entries(required)) {
      if (!eos[category]) {
        return { success: false, error: `Missing category: ${category}` };
      }
      for (const field of fields) {
        if (!eos[category][field] || typeof eos[category][field].score !== "number") {
          return { success: false, error: `Missing or invalid: ${category}.${field}` };
        }
      }
    }

    return { success: true, data: eos };
  } catch {
    return { success: false, error: "Invalid JSON. Make sure you copied Claude's full response." };
  }
}

export interface EosSubScoreResponse {
  score: number;
  max: number;
  rationale: string;
}

export interface EosResponseData {
  sky: {
    color_intensity: EosSubScoreResponse;
    cloud_engagement: EosSubScoreResponse;
    horizon_definition: EosSubScoreResponse;
  };
  setting: {
    foreground_composition: EosSubScoreResponse;
    location_uniqueness: EosSubScoreResponse;
  };
  conditions: {
    access_difficulty: EosSubScoreResponse;
    weather_challenge: EosSubScoreResponse;
  };
}
