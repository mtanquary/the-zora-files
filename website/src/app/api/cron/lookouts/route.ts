import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runPollBatch } from "@/lib/stays/poller";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/cron/lookouts
 * Runs one polite availability batch. Called every few minutes by Supabase
 * pg_cron (see scripts/setup-stays-cron.sql) with
 *   Authorization: Bearer <CRON_SECRET>
 * Locally, with no CRON_SECRET set, it runs without auth in development only.
 */
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limitParam = request.nextUrl.searchParams.get("limit");
  try {
    const result = await runPollBatch("recgov", {
      limit: limitParam ? Number(limitParam) || undefined : undefined,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("lookouts cron", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;
