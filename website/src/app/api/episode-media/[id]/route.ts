import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { caption, sort_order } = body;

    const result = await pool.query(
      `UPDATE episode_media
       SET caption = COALESCE($1, caption),
           sort_order = COALESCE($2, sort_order)
       WHERE id = $3
       RETURNING *`,
      [caption ?? null, sort_order ?? null, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to update media:", err);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Look up storage path so we can also remove the file from Supabase storage
    const lookup = await pool.query("SELECT storage_path FROM episode_media WHERE id = $1", [id]);
    const storagePath: string | null = lookup.rows[0]?.storage_path ?? null;

    const result = await pool.query("DELETE FROM episode_media WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (storagePath) {
      // Best-effort storage cleanup; don't fail the request if it errors
      try {
        await supabase.storage.from("photos").remove([storagePath]);
      } catch (e) {
        console.error("Storage cleanup failed:", e);
      }
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Failed to delete media:", err);
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
