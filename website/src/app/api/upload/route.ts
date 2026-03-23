import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import exifr from "exifr";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "photos";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Extract EXIF metadata
  let exif: {
    latitude?: number;
    longitude?: number;
    DateTimeOriginal?: Date;
    Make?: string;
    Model?: string;
  } | null = null;

  try {
    exif = await exifr.parse(buffer, {
      gps: true,
      pick: ["latitude", "longitude", "DateTimeOriginal", "Make", "Model"],
    });
  } catch {
    // EXIF extraction is best-effort - continue without it
  }

  // Generate a unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("photos")
    .upload(filename, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from("photos")
    .getPublicUrl(data.path);

  return NextResponse.json({
    path: data.path,
    url: urlData.publicUrl,
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
