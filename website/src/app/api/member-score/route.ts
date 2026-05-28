import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabase as storage } from "@/lib/supabase";
import { scoreEosPhoto } from "@/lib/eos-score";
import {
  MONTHLY_FREE_LIMIT,
  countSubmissionsThisMonth,
  startOfNextMonthUTC,
} from "@/lib/member";
import { eosTotal } from "@/lib/types";

export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to score a sunrise." }, { status: 401 });
  }

  const formData = await request.formData();
  const photo = formData.get("photo") as File | null;
  const location = (formData.get("location") as string | null)?.trim() || null;

  if (!photo) {
    return NextResponse.json({ error: "No photo provided." }, { status: 400 });
  }
  if (!photo.type.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload an image file." }, { status: 400 });
  }
  if (photo.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (15 MB max)." }, { status: 400 });
  }

  // Enforce the monthly cap before spending an API call.
  const used = await countSubmissionsThisMonth(supabase, user.id);
  if (used >= MONTHLY_FREE_LIMIT) {
    return NextResponse.json(
      {
        error: `You've used all ${MONTHLY_FREE_LIMIT} free scores this month.`,
        limitReached: true,
        resetsAt: startOfNextMonthUTC().toISOString(),
      },
      { status: 429 }
    );
  }

  const bytes = await photo.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const mediaType = photo.type || "image/jpeg";

  const result = await scoreEosPhoto(base64, mediaType, {
    location: location || undefined,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const total = eosTotal(result.data);

  // Store the photo (best-effort) under a per-member folder.
  let photoPath: string | null = null;
  let photoUrl: string | null = null;
  const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
  const filename = `member-sunrises/${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { data: uploaded, error: uploadError } = await storage.storage
    .from("photos")
    .upload(filename, buffer, { contentType: mediaType, upsert: false });
  if (!uploadError && uploaded) {
    photoPath = uploaded.path;
    photoUrl = storage.storage.from("photos").getPublicUrl(uploaded.path).data.publicUrl;
  }

  // Record the submission (this row is also the monthly-quota ledger).
  const { error: insertError } = await supabase.from("member_submissions").insert({
    user_id: user.id,
    photo_path: photoPath,
    photo_url: photoUrl,
    location,
    eos_index: result.data,
    eos_total: total,
  });
  if (insertError) {
    console.error("member_submissions insert failed:", insertError);
    return NextResponse.json(
      { error: "Scored your sunrise, but couldn't save it. Please try again." },
      { status: 500 }
    );
  }

  const usedAfter = used + 1;
  return NextResponse.json({
    eos_index: result.data,
    eos_total: total,
    photo_url: photoUrl,
    used: usedAfter,
    remaining: Math.max(0, MONTHLY_FREE_LIMIT - usedAfter),
    limit: MONTHLY_FREE_LIMIT,
  });
}
