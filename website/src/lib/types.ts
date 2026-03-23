// ── Eos Index ──

export interface EosSubScore {
  score: number;
  max: number;
  rationale?: string;
}

export interface EosIndex {
  sky: {
    color_intensity: EosSubScore;
    cloud_engagement: EosSubScore;
    horizon_definition: EosSubScore;
  };
  setting: {
    foreground_composition: EosSubScore;
    location_uniqueness: EosSubScore;
  };
  conditions: {
    access_difficulty: EosSubScore;
    weather_challenge: EosSubScore;
  };
}

export function eosSkyTotal(eos: EosIndex): number {
  const s = eos.sky;
  return s.color_intensity.score + s.cloud_engagement.score + s.horizon_definition.score;
}

export function eosSettingTotal(eos: EosIndex): number {
  const s = eos.setting;
  return s.foreground_composition.score + s.location_uniqueness.score;
}

export function eosConditionsTotal(eos: EosIndex): number {
  const s = eos.conditions;
  return s.access_difficulty.score + s.weather_challenge.score;
}

export function eosTotal(eos: EosIndex): number {
  return eosSkyTotal(eos) + eosSettingTotal(eos) + eosConditionsTotal(eos);
}

// ── Effort ──

export const EFFORT_LEVELS = [
  { level: 1, label: "Roadside", points: 0 },
  { level: 2, label: "Trail", points: 5 },
  { level: 3, label: "Summit", points: 10 },
  { level: 4, label: "Remote", points: 15 },
  { level: 5, label: "Expedition", points: 20 },
] as const;

export type EffortLevel = 1 | 2 | 3 | 4 | 5;

// ── Discovery ──

export type DiscoveryType = "wildlife" | "plant" | "geographic" | "cultural_historical";
export type RarityTier = "common" | "uncommon" | "rare" | "very_rare" | "exceptional";

export interface Discovery {
  id: string;
  episode_id: string;
  type: DiscoveryType;
  name: string;
  scientific_name?: string;
  country: string;
  rarity_tier: RarityTier;
  points: number;
  photo_url: string;
  fun_fact: string;
  first_spotted: string;
  location_name: string;
  is_first_unlock: boolean;
  subsequent_find_number?: number;
}

// ── Episode ──

export interface Episode {
  id: string;
  episode_number: number;
  season: number;
  title: string;
  location_name: string;
  country: string;
  region?: string;
  coordinates: { lat: number; lng: number };
  shoot_date: string;
  publish_date: string;
  youtube_url: string;

  eos_index: EosIndex;
  eos_total: number;

  effort_rating: EffortLevel;
  effort_points: number;

  zora_score: {
    eos_index: number;
    effort_points: number;
    discovery_points: number;
    total: number;
  };

  distance_miles?: number;
  elevation_gain_ft?: number;
  minutes_before_sunrise?: number;
  weather_notes?: string;
  streak_active: boolean;

  thumbnail_url: string;
  notes: string;
  discoveries: Discovery[];
}

// ── Records ──

export interface Record {
  id: string;
  category: string;
  value: string;
  episode_id: string;
  set_date: string;
  previous_holder?: string;
}

// ── Level system ──

export const LEVELS = [
  { level: 0, title: "Scout", expeditions: 0 },
  { level: 1, title: "Trailhead", expeditions: 6 },
  { level: 2, title: "Desert Fox", expeditions: 12 },
  { level: 3, title: "Dawnchaser", expeditions: 18 },
  { level: 4, title: "First Light", expeditions: 24 },
  { level: 5, title: "Horizon Hunter", expeditions: 30 },
  { level: 6, title: "Zora Seeker", expeditions: 36 },
  { level: 7, title: "Dawn Keeper", expeditions: 42 },
  { level: 8, title: "Eos Adept", expeditions: 48 },
  { level: 9, title: "Zora Master", expeditions: 54 },
  { level: 10, title: "Finding Zora", expeditions: 60 },
] as const;

export interface PlayerProgress {
  id: string;
  user_id: string;
  current_level: number;
  current_level_title: string;
  cumulative_zora_score: number;
  expeditions_to_next_level: number;
  expeditions_total: number;
  streak_count: number;
  streak_active: boolean;
  medallions_earned: MedallionRecord[];
  badges_earned: string[];
}

export interface MedallionRecord {
  level: number;
  earned_date: string;
  streak_bonus: boolean;
  expedition_number_at_earn: number;
}
