import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import exifr from "exifr";

// Larger payload limit for video uploads (handler runs as Node runtime).
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "photos";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const mime = file.type || "";
  const isVideo = mime.startsWith("video/");
  const isImage = mime.startsWith("image/");
  const kind: "photo" | "video" = isVideo ? "video" : "photo";

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // EXIF only on images — exifr does not parse video containers
  let exif: {
    latitude?: number;
    longitude?: number;
    DateTimeOriginal?: Date;
    Make?: string;
    Model?: string;
  } | null = null;

  if (isImage) {
    try {
      exif = await exifr.parse(buffer, {
        gps: true,
        pick: ["latitude", "longitude", "DateTimeOriginal", "Make", "Model"],
      });
    } catch {
      // EXIF extraction is best-effort - continue without it
    }
  }

  const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("photos")
    .upload(filename, buffer, {
      contentType: mime || (isVideo ? "video/mp4" : "image/jpeg"),
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("photos")
    .getPublicUrl(data.path);

  return NextResponse.json({
    path: data.path,
    url: urlData.publicUrl,
    kind,
    mime_type: mime,
    size_bytes: file.size,
    exif: exif
      ? {
          coordinates:
            exif.latitude != null && exif.longitude != null
              ? { lat: exif.latitude, lng: exif.longitude }
              : null,
          taken_at: exif.DateTimeOriginal
            ? exif.DateTimeOriginal.toISOString()
            : null,
          camera: [exif.Make, exif.Model].filter(Boolean).join(" ") || null,
        }
      : null,
  });
}
