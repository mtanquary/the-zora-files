import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/** Search existing discovery names for autocomplete. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const type = request.nextUrl.searchParams.get("type") || "";

  let query = `
    SELECT DISTINCT name, type, rarity_tier, points,
           (SELECT COUNT(*) FROM discoveries d2 WHERE d2.name = d.name) as find_count
    FROM discoveries d
    WHERE 1=1
  `;
  const params: string[] = [];

  if (q) {
    params.push(`%${q}%`);
    query += ` AND name ILIKE $${params.length}`;
  }
  if (type) {
    params.push(type);
    query += ` AND type = $${params.length}`;
  }

  query += " ORDER BY name LIMIT 20";

  try {
    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Discovery search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      episode_id, type, name, rarity_tier, points,
      photo_url, fun_fact, first_spotted, location_name, is_first_unlock,
    } = body;

    // Count previous finds to set subsequent_find_number
    const prev = await pool.query(
      "SELECT COUNT(*) FROM discoveries WHERE name = $1",
      [name]
    );
    const findCount = parseInt(prev.rows[0].count, 10);
    const subsequentNum = findCount > 0 ? findCount : null;
    const actualFirstUnlock = findCount === 0;

    const result = await pool.query(
      `INSERT INTO discoveries (
        episode_id, type, name, country, rarity_tier, points,
        photo_url, fun_fact, first_spotted, location_name,
        is_first_unlock, subsequent_find_number
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, is_first_unlock`,
      [
        episode_id, type, name, "US", rarity_tier, points,
        photo_url || null, fun_fact || null, first_spotted, location_name,
        actualFirstUnlock, subsequentNum,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Failed to save discovery:", err);
    return NextResponse.json({ error: "Failed to save discovery" }, { status: 500 });
  }
}
