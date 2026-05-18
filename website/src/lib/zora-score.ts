import pool from "./db";

/**
 * Recomputes an episode's `zora_score` JSONB from authoritative DB state
 * (eos_total, effort_points, and the sum of all discovery points) and
 * persists it on the row. Returns the new score breakdown.
 *
 * Called after any write that can change discovery_points (discovery POST,
 * episode PUT) so the score is always derived, never trusted from the client.
 */
export async function recomputeAndStoreZoraScore(episodeId: string): Promise<{
  eos_index: number;
  effort_points: number;
  discovery_points: number;
  total: number;
} | null> {
  const res = await pool.query(
    `UPDATE episodes e
       SET zora_score = jsonb_build_object(
             'eos_index', e.eos_total,
             'effort_points', e.effort_points,
             'discovery_points', COALESCE(
               (SELECT SUM(points)::int FROM discoveries WHERE episode_id = e.id), 0),
             'total', e.eos_total + e.effort_points + COALESCE(
               (SELECT SUM(points)::int FROM discoveries WHERE episode_id = e.id), 0)
           ),
           updated_at = now()
     WHERE e.id = $1
     RETURNING zora_score`,
    [episodeId]
  );
  return res.rows[0]?.zora_score ?? null;
}
