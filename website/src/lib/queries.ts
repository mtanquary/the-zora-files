import pool from "./db";

export interface EpisodeRow {
  id: string;
  episode_number: number;
  season: number;
  title: string;
  location_name: string;
  country: string;
  region: string | null;
  coordinates: { lat: number; lng: number };
  shoot_date: string;
  publish_date: string | null;
  youtube_url: string | null;
  eos_index: Record<string, unknown>;
  eos_total: number;
  effort_rating: number;
  effort_points: number;
  zora_score: {
    eos_index: number;
    effort_points: number;
    discovery_points: number;
    total: number;
  };
  distance_miles: number | null;
  elevation_gain_ft: number | null;
  minutes_before_sunrise: number | null;
  weather_notes: string | null;
  streak_active: boolean;
  thumbnail_url: string | null;
  notes: string | null;
  created_at: string;
}

export async function getEpisodes(): Promise<EpisodeRow[]> {
  const result = await pool.query(
    "SELECT * FROM episodes ORDER BY episode_number DESC"
  );
  return result.rows;
}

export async function getEpisodeByNumber(
  season: number,
  episodeNumber: number
): Promise<EpisodeRow | null> {
  const result = await pool.query(
    "SELECT * FROM episodes WHERE season = $1 AND episode_number = $2 LIMIT 1",
    [season, episodeNumber]
  );
  return result.rows[0] || null;
}

export async function getLatestEpisode(): Promise<EpisodeRow | null> {
  const result = await pool.query(
    "SELECT * FROM episodes ORDER BY shoot_date DESC, episode_number DESC LIMIT 1"
  );
  return result.rows[0] || null;
}

export async function getEpisodeById(id: string): Promise<EpisodeRow | null> {
  const result = await pool.query("SELECT * FROM episodes WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] || null;
}

export async function getEpisodesSortedByEos(): Promise<EpisodeRow[]> {
  const result = await pool.query(
    "SELECT * FROM episodes ORDER BY eos_total DESC"
  );
  return result.rows;
}
