import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      episode_number,
      season,
      title,
      location_name,
      country,
      region,
      coordinates,
      shoot_date,
      eos_index,
      eos_total,
      effort_rating,
      effort_points,
      zora_score,
      distance_miles,
      elevation_gain_ft,
      minutes_before_sunrise,
      weather_notes,
      thumbnail_url,
      youtube_url,
      publish_date,
      notes,
      streak_active,
      track_geojson,
      gpx_storage_path,
    } = body;

    const result = await pool.query(
      `INSERT INTO episodes (
        episode_number, season, title, location_name, country, region,
        coordinates, shoot_date, publish_date, eos_index, eos_total,
        effort_rating, effort_points, zora_score,
        distance_miles, elevation_gain_ft, minutes_before_sunrise,
        weather_notes, thumbnail_url, youtube_url, notes, streak_active,
        track_geojson, gpx_storage_path
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20, $21, $22,
        $23, $24
      ) RETURNING id`,
      [
        episode_number,
        season || 1,
        title,
        location_name,
        country || "US",
        region || null,
        JSON.stringify(coordinates || { lat: 0, lng: 0 }),
        shoot_date,
        publish_date || null,
        JSON.stringify(eos_index),
        eos_total,
        effort_rating,
        effort_points,
        JSON.stringify(zora_score),
        distance_miles || null,
        elevation_gain_ft || null,
        minutes_before_sunrise || null,
        weather_notes || null,
        thumbnail_url || null,
        youtube_url || null,
        notes || null,
        streak_active === true,
        track_geojson ? JSON.stringify(track_geojson) : null,
        gpx_storage_path || null,
      ]
    );

    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("Failed to save episode:", err);
    return NextResponse.json(
      { error: "Failed to save expedition log" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM episodes ORDER BY episode_number DESC"
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch episodes:", err);
    return NextResponse.json(
      { error: "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}
