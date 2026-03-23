import type { EosSubScores } from "@/components/expedition-card";

/** Extract abbreviated sub-scores from the eos_index JSONB object. */
export function extractEosSub(eosIndex: Record<string, unknown>): EosSubScores {
  const eos = eosIndex as {
    sky: { color_intensity: { score: number }; cloud_engagement: { score: number }; horizon_definition: { score: number } };
    setting: { foreground_composition: { score: number }; location_uniqueness: { score: number } };
    conditions: { access_difficulty: { score: number }; weather_challenge: { score: number } };
  };
  return {
    ci: eos.sky.color_intensity.score,
    ce: eos.sky.cloud_engagement.score,
    hd: eos.sky.horizon_definition.score,
    fc: eos.setting.foreground_composition.score,
    lu: eos.setting.location_uniqueness.score,
    ad: eos.conditions.access_difficulty.score,
    wc: eos.conditions.weather_challenge.score,
  };
}
