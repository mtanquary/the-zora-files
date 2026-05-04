import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { episode_id, kind, url, storage_path, caption, mime_type, size_bytes, sort_order } = body;

    if (!episode_id || !url || (kind !== "photo" && kind !== "video")) {
      return NextResponse.json({ error: "episode_id, url, and kind (photo|video) are required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO episode_media (
        episode_id, kind, url, storage_path, caption, mime_type, size_bytes, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        episode_id,
        kind,
        url,
        storage_path || null,
        caption || null,
        mime_type || null,
        size_bytes ?? null,
        sort_order ?? 0,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to add episode media:", err);
    return NextResponse.json({ error: "Failed to add media" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const episodeId = request.nextUrl.searchParams.get("episode_id");
  if (!episodeId) {
    return NextResponse.json({ error: "episode_id query param is required" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM episode_media WHERE episode_id = $1 ORDER BY sort_order, created_at",
      [episodeId]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch episode media:", err);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}
