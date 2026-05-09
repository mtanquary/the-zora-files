import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const maxDuration = 60;

// Stores a GPX file in Supabase Storage and returns its public URL + path.
// Separate from /api/upload because GPX is not media (it's a track) and we
// don't want it landing in the episode_media table.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "tracks";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Light sanity check — we accept anything for inspection but flag clearly
  // wrong types. AllTrails exports as .gpx, MIME varies (often application/xml
  // or application/gpx+xml).
  if (
    !file.name.toLowerCase().endsWith(".gpx") &&
    !(file.type || "").toLowerCase().includes("gpx") &&
    !(file.type || "").toLowerCase().includes("xml")
  ) {
    return NextResponse.json(
      { error: "Expected a .gpx file." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.gpx`;

  const { data, error } = await supabase.storage
    .from("photos")
    .upload(filename, buffer, {
      contentType: "application/gpx+xml",
      upsert: false,
    });

  if (error) {
    console.error("GPX upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("photos")
    .getPublicUrl(data.path);

  return NextResponse.json({
    path: data.path,
    url: urlData.publicUrl,
    size_bytes: file.size,
  });
}
