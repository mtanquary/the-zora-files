import { NextRequest, NextResponse } from "next/server";
import { scoreEosPhoto } from "@/lib/eos-score";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const photo = formData.get("photo") as File | null;
  const location = formData.get("location") as string | null;
  const trail = formData.get("trail") as string | null;
  const effort_label = formData.get("effort_label") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!photo) {
    return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  }

  const bytes = await photo.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = photo.type || "image/jpeg";

  const result = await scoreEosPhoto(base64, mediaType, {
    location: location || undefined,
    trail: trail || undefined,
    effort_label: effort_label || undefined,
    notes: notes || undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ eos_index: result.data });
}
