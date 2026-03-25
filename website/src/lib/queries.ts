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

export interface DiscoveryRow {
  id: string;
  episode_id: string;
  type: string;
  name: string;
  scientific_name: string | null;
  country: string;
  rarity_tier: string;
  points: number;
  photo_url: string | null;
  fun_fact: string | null;
  first_spotted: string;
  location_name: string;
  is_first_unlock: boolean;
  subsequent_find_number: number | null;
  detection_method: string;
  created_at: string;
}

export async function getDiscoveriesByEpisode(episodeId: string): Promise<DiscoveryRow[]> {
  const result = await pool.query(
    "SELECT * FROM discoveries WHERE episode_id = $1 ORDER BY created_at",
    [episodeId]
  );
  return result.rows;
}

export async function getAllDiscoveries(): Promise<(DiscoveryRow & { episode_title?: string })[]> {
  const result = await pool.query(`
    SELECT d.*, e.title as episode_title
    FROM discoveries d
    LEFT JOIN episodes e ON d.episode_id = e.id
    ORDER BY d.created_at DESC
  `);
  return result.rows;
}

export interface RecordEntry {
  category: string;
  value: string;
  detail: string;
  color: "teal" | "amber" | "orange" | "mist";
}

export async function getComputedRecords(): Promise<RecordEntry[]> {
  const records: RecordEntry[] = [];

  // Highest Eos Index
  const eosRes = await pool.query(
    "SELECT title, season, episode_number, eos_total FROM episodes ORDER BY eos_total DESC LIMIT 1"
  );
  if (eosRes.rows.length > 0) {
    const r = eosRes.rows[0];
    records.push({
      category: "Highest Eos Index",
      value: String(r.eos_total),
      detail: `S${String(r.season).padStart(2, "0")}E${String(r.episode_number).padStart(2, "0")} · "${r.title}"`,
      color: "teal",
    });
  }

  // Highest Zora Score
  const zoraRes = await pool.query(
    "SELECT title, season, episode_number, zora_score->>'total' as zora_total FROM episodes ORDER BY (zora_score->>'total')::int DESC LIMIT 1"
  );
  if (zoraRes.rows.length > 0) {
    const r = zoraRes.rows[0];
    records.push({
      category: "Highest Zora Score",
      value: String(r.zora_total),
      detail: `S${String(r.season).padStart(2, "0")}E${String(r.episode_number).padStart(2, "0")} · "${r.title}"`,
      color: "amber",
    });
  }

  // Most discoveries in one expedition
  const discRes = await pool.query(
    `SELECT e.title, e.season, e.episode_number, COUNT(d.id) as disc_count
     FROM episodes e JOIN discoveries d ON d.episode_id = e.id
     GROUP BY e.id, e.title, e.season, e.episode_number
     ORDER BY disc_count DESC LIMIT 1`
  );
  if (discRes.rows.length > 0) {
    const r = discRes.rows[0];
    records.push({
      category: "Most discoveries",
      value: String(r.disc_count),
      detail: `S${String(r.season).padStart(2, "0")}E${String(r.episode_number).padStart(2, "0")} · "${r.title}"`,
      color: "amber",
    });
  }

  // Total expeditions
  const expRes = await pool.query("SELECT COUNT(*) as count FROM episodes");
  records.push({
    category: "Total expeditions",
    value: expRes.rows[0].count,
    detail: "completed",
    color: "mist",
  });

  // Total species discovered
  const speciesRes = await pool.query("SELECT COUNT(DISTINCT name) as count FROM discoveries");
  records.push({
    category: "Species discovered",
    value: speciesRes.rows[0].count,
    detail: "unique species",
    color: "amber",
  });

  // Total discovery points
  const ptsRes = await pool.query("SELECT COALESCE(SUM(points), 0) as total FROM discoveries");
  records.push({
    category: "Discovery points earned",
    value: String(ptsRes.rows[0].total),
    detail: "total points",
    color: "orange",
  });

  // Highest effort
  const effortRes = await pool.query(
    "SELECT title, season, episode_number, effort_rating FROM episodes ORDER BY effort_rating DESC LIMIT 1"
  );
  if (effortRes.rows.length > 0) {
    const r = effortRes.rows[0];
    const labels: Record<number, string> = { 1: "Roadside", 2: "Trail", 3: "Summit", 4: "Remote", 5: "Expedition" };
    records.push({
      category: "Highest effort",
      value: labels[r.effort_rating] || String(r.effort_rating),
      detail: `S${String(r.season).padStart(2, "0")}E${String(r.episode_number).padStart(2, "0")} · "${r.title}"`,
      color: "orange",
    });
  }

  // Lowest Eos Index (for range context)
  const lowEosRes = await pool.query(
    "SELECT title, season, episode_number, eos_total FROM episodes ORDER BY eos_total ASC LIMIT 1"
  );
  if (lowEosRes.rows.length > 0 && eosRes.rows.length > 0 && lowEosRes.rows[0].eos_total !== eosRes.rows[0].eos_total) {
    const r = lowEosRes.rows[0];
    records.push({
      category: "Lowest Eos Index",
      value: String(r.eos_total),
      detail: `S${String(r.season).padStart(2, "0")}E${String(r.episode_number).padStart(2, "0")} · "${r.title}"`,
      color: "mist",
    });
  }

  return records;
}

export async function getEpisodesSortedByEos(): Promise<EpisodeRow[]> {
  const result = await pool.query(
    "SELECT * FROM episodes ORDER BY eos_total DESC"
  );
  return result.rows;
}
