import { NextResponse, type NextRequest } from "next/server";
import { getStaysWithAvailability, parseRange } from "@/lib/stays/queries";
import type { StaysResponse } from "@/lib/stays/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/lookouts?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Lookouts with availability for the requested nights, read from our own
 * snapshot tables. The browser never talks to Recreation.gov.
 */
export async function GET(request: NextRequest) {
  let range;
  try {
    range = parseRange(request.nextUrl.searchParams.get("start"), request.nextUrl.searchParams.get("end"));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  try {
    const sites = await getStaysWithAvailability("lookout", range);
    const body: StaysResponse = { generated_at: new Date().toISOString(), range, sites };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("lookouts api", err);
    return NextResponse.json({ error: "Could not load lookouts" }, { status: 500 });
  }
}
