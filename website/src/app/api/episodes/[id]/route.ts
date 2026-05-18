import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { recomputeAndStoreZoraScore } from "@/lib/zora-score";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    const {
      episode_number, season, title, location_name, country, region,
      coordinates, shoot_date, eos_index, eos_total,
      effort_rating, effort_points, zora_score,
      distance_miles, elevation_gain_ft, minutes_before_sunrise,
      weather_notes, thumbnail_url, notes, streak_active,
      track_geojson, gpx_storage_path,
    } = body;

    const result = await pool.query(
      `UPDATE episodes SET
        episode_number=$1, season=$2, title=$3, location_name=$4, country=$5, region=$6,
        coordinates=$7, shoot_date=$8, eos_index=$9, eos_total=$10,
        effort_rating=$11, effort_points=$12, zora_score=$13,
        distance_miles=$14, elevation_gain_ft=$15, minutes_before_sunrise=$16,
        weather_notes=$17, thumbnail_url=$18, notes=$19, streak_active=$20,
        track_geojson=$21, gpx_storage_path=$22, updated_at=now()
      WHERE id=$23 RETURNING id`,
      [
        episode_number, season || 1, title, location_name, country || "US",
        region || null, JSON.stringify(coordinates || { lat: 0, lng: 0 }),
        shoot_date, JSON.stringify(eos_index), eos_total,
        effort_rating, effort_points, JSON.stringify(zora_score),
        distance_miles || null, elevation_gain_ft || null,
        minutes_before_sunrise || null, weather_notes || null,
        thumbnail_url || null, notes || null, streak_active === true,
        track_geojson ? JSON.stringify(track_geojson) : null,
        gpx_storage_path || null, id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    // discovery_points is derived from the discoveries table — recompute now
    // so an edit that lost the form's draft list can't zero it out.
    await recomputeAndStoreZoraScore(result.rows[0].id);

    return NextResponse.json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Failed to update episode:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await pool.query(
      "DELETE FROM episodes WHERE id=$1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Failed to delete episode:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
