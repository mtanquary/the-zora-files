import "server-only";
import type { NightStatus } from "../types";
import { USER_AGENT, type FetchOutcome, type StayProvider } from "./types";

/**
 * Recreation.gov month availability.
 *
 * GET /api/camps/availability/campground/{facilityId}/month?start_date=YYYY-MM-01T00:00:00.000Z
 * The start_date must be URL-encoded (raw colons return 400 "query not encoded").
 * Read-only. Nothing here books, holds, or touches a cart.
 */

const BASE = "https://www.recreation.gov/api/camps/availability/campground";

export function normalizeRecgovStatus(raw: string): NightStatus {
  const s = raw.trim().toLowerCase();
  if (s === "available" || s === "open") return "available";
  if (s === "reserved") return "reserved";
  if (s === "nyr" || s.startsWith("not yet released")) return "not_released";
  if (s === "walk up" || s === "walk-up") return "walk_up";
  if (s.startsWith("lottery")) return "lottery";
  return "closed"; // "Not Available", "Not Reservable", "Not Reservable Management", "Closed", cutoffs
}

interface RecgovMonthResponse {
  campsites?: Record<
    string,
    { campsite_id: string; campsite_type?: string; availabilities?: Record<string, string> }
  >;
}

export const recgovProvider: StayProvider = {
  platform: "recgov",
  async fetchMonth(facilityId, month): Promise<FetchOutcome> {
    if (!/^\d+$/.test(facilityId)) {
      return { ok: false, httpStatus: null, blocked: false, error: "bad facility id" };
    }
    const url = `${BASE}/${facilityId}/month?start_date=${encodeURIComponent(`${month}T00:00:00.000Z`)}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          ok: false,
          httpStatus: res.status,
          blocked: res.status === 403 || res.status === 429,
          error: `HTTP ${res.status}`,
        };
      }
      const body = (await res.json()) as RecgovMonthResponse;
      const units = Object.values(body.campsites ?? {}).map((c) => ({
        unitId: String(c.campsite_id),
        type: c.campsite_type ?? null,
        days: Object.entries(c.availabilities ?? {}).map(([key, raw]) => ({
          date: key.slice(0, 10),
          status: normalizeRecgovStatus(raw),
          raw,
        })),
      }));
      return { ok: true, httpStatus: res.status, data: { units } };
    } catch (err) {
      return {
        ok: false,
        httpStatus: null,
        blocked: false,
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      clearTimeout(timer);
    }
  },
};
