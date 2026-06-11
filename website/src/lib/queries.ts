import pool from "./db";

/**
 * SQL fragment that limits a query to AIRED episodes (publish_date set and on
 * or before today). Used by every score-sensitive query so unaired expeditions
 * never leak into leaderboards, records, the discovery log, or the map.
 *
 * `getEpisodes()` itself stays unfiltered — list pages need the upcoming rows
 * so they can render "airs <date>" callouts instead of scores.
 */
const AIRED_WHERE_EP = "publish_date IS NOT NULL AND publish_date <= CURRENT_DATE";

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
  track_geojson: {
    type: "LineString";
    coordinates: Array<[number, number, number?]>;
  } | null;
  gpx_storage_path: string | null;
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
    `SELECT * FROM episodes WHERE ${AIRED_WHERE_EP} ORDER BY shoot_date DESC, episode_number DESC LIMIT 1`
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

export interface EpisodeMediaRow {
  id: string;
  episode_id: string;
  kind: "photo" | "video";
  url: string;
  storage_path: string | null;
  caption: string | null;
  mime_type: string | null;
  size_bytes: string | null;
  sort_order: number;
  created_at: string;
}

export async function getEpisodeMedia(episodeId: string): Promise<EpisodeMediaRow[]> {
  const result = await pool.query(
    "SELECT * FROM episode_media WHERE episode_id = $1 ORDER BY sort_order, created_at",
    [episodeId]
  );
  return result.rows;
}

export async function getEpisodeMediaCounts(episodeId: string): Promise<{ photos: number; videos: number }> {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE kind = 'photo')::int AS photos,
       COUNT(*) FILTER (WHERE kind = 'video')::int AS videos
     FROM episode_media WHERE episode_id = $1`,
    [episodeId]
  );
  const row = result.rows[0] || { photos: 0, videos: 0 };
  return { photos: row.photos || 0, videos: row.videos || 0 };
}

export async function getAllDiscoveries(): Promise<(DiscoveryRow & { episode_title?: string })[]> {
  // Only surface discoveries whose episode has aired — otherwise we'd leak
  // species and points from upcoming expeditions before they air.
  const result = await pool.query(`
    SELECT d.*, e.title as episode_title
    FROM discoveries d
    JOIN episodes e ON d.episode_id = e.id
    WHERE e.publish_date IS NOT NULL AND e.publish_date <= CURRENT_DATE
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
    `SELECT title, season, episode_number, eos_total FROM episodes WHERE ${AIRED_WHERE_EP} ORDER BY eos_total DESC LIMIT 1`
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
    `SELECT title, season, episode_number, zora_score->>'total' as zora_total FROM episodes WHERE ${AIRED_WHERE_EP} ORDER BY (zora_score->>'total')::int DESC LIMIT 1`
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
     WHERE e.publish_date IS NOT NULL AND e.publish_date <= CURRENT_DATE
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
  const expRes = await pool.query(`SELECT COUNT(*) as count FROM episodes WHERE ${AIRED_WHERE_EP}`);
  records.push({
    category: "Total expeditions",
    value: expRes.rows[0].count,
    detail: "completed",
    color: "mist",
  });

  // Total species discovered
  const speciesRes = await pool.query(
    `SELECT COUNT(DISTINCT d.name) as count
       FROM discoveries d JOIN episodes e ON e.id = d.episode_id
      WHERE e.publish_date IS NOT NULL AND e.publish_date <= CURRENT_DATE`
  );
  records.push({
    category: "Species discovered",
    value: speciesRes.rows[0].count,
    detail: "unique species",
    color: "amber",
  });

  // Total discovery points
  const ptsRes = await pool.query(
    `SELECT COALESCE(SUM(d.points), 0) as total
       FROM discoveries d JOIN episodes e ON e.id = d.episode_id
      WHERE e.publish_date IS NOT NULL AND e.publish_date <= CURRENT_DATE`
  );
  records.push({
    category: "Discovery points earned",
    value: String(ptsRes.rows[0].total),
    detail: "total points",
    color: "orange",
  });

  // Highest effort
  const effortRes = await pool.query(
    `SELECT title, season, episode_number, effort_rating FROM episodes WHERE ${AIRED_WHERE_EP} ORDER BY effort_rating DESC LIMIT 1`
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
    `SELECT title, season, episode_number, eos_total FROM episodes WHERE ${AIRED_WHERE_EP} ORDER BY eos_total ASC LIMIT 1`
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
    `SELECT * FROM episodes WHERE ${AIRED_WHERE_EP} ORDER BY eos_total DESC`
  );
  return result.rows;
}

// ── Map data ──

export interface MapExpedition {
  id: string;
  season: number;
  episode_number: number;
  slug: string;
  title: string;
  location_name: string;
  country: string;
  region: string | null;
  coordinates: { lat: number; lng: number };
  shoot_date: string;
  eos_total: number;
  effort_rating: number;
  effort_points: number;
  effort_label: string;
  zora_total: number;
  discovery_points: number;
  thumbnail_url: string | null;
  youtube_url: string | null;
  distance_miles: number | null;
  elevation_gain_ft: number | null;
  track_geojson: {
    type: "LineString";
    coordinates: Array<[number, number, number?]>;
  } | null;
  discoveries: Array<{
    id: string;
    type: string;
    name: string;
    rarity_tier: string;
    points: number;
  }>;
}

const EFFORT_LABELS: Record<number, string> = {
  1: "Roadside",
  2: "Trail",
  3: "Summit",
  4: "Remote",
  5: "Expedition",
};

export async function getMapData(): Promise<MapExpedition[]> {
  const epRes = await pool.query(
    `SELECT id, season, episode_number, title, location_name, country, region,
            coordinates, shoot_date, eos_total, effort_rating, effort_points,
            zora_score, thumbnail_url, youtube_url, distance_miles, elevation_gain_ft,
            track_geojson
     FROM episodes
     WHERE coordinates IS NOT NULL
       AND (coordinates->>'lat')::float != 0
       AND (coordinates->>'lng')::float != 0
       AND publish_date IS NOT NULL
       AND publish_date <= CURRENT_DATE
     ORDER BY shoot_date DESC, episode_number DESC`
  );

  if (epRes.rows.length === 0) return [];

  const ids = epRes.rows.map((r) => r.id);
  const dRes = await pool.query(
    `SELECT id, episode_id, type, name, rarity_tier, points
     FROM discoveries
     WHERE episode_id = ANY($1::text[])
     ORDER BY type, name`,
    [ids]
  );

  const byEp = new Map<string, MapExpedition["discoveries"]>();
  for (const d of dRes.rows) {
    const list = byEp.get(d.episode_id) ?? [];
    list.push({
      id: d.id,
      type: d.type,
      name: d.name,
      rarity_tier: d.rarity_tier,
      points: d.points,
    });
    byEp.set(d.episode_id, list);
  }

  return epRes.rows.map((r) => ({
    id: r.id,
    season: r.season,
    episode_number: r.episode_number,
    slug: `s${String(r.season).padStart(2, "0")}e${String(r.episode_number).padStart(2, "0")}`,
    title: r.title,
    location_name: r.location_name,
    country: r.country,
    region: r.region,
    coordinates: r.coordinates,
    shoot_date: r.shoot_date,
    eos_total: r.eos_total,
    effort_rating: r.effort_rating,
    effort_points: r.effort_points,
    effort_label: EFFORT_LABELS[r.effort_rating] ?? String(r.effort_rating),
    zora_total: r.zora_score?.total ?? 0,
    discovery_points: r.zora_score?.discovery_points ?? 0,
    thumbnail_url: r.thumbnail_url,
    youtube_url: r.youtube_url,
    distance_miles: r.distance_miles,
    elevation_gain_ft: r.elevation_gain_ft,
    track_geojson: r.track_geojson ?? null,
    discoveries: byEp.get(r.id) ?? [],
  }));
}
