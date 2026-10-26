import type { NightStatus } from "../types";

/** One month of availability for one site, normalized. */
export interface MonthAvailability {
  units: {
    unitId: string;
    /** Provider's unit type, e.g. Recreation.gov "CABIN NONELECTRIC". */
    type: string | null;
    days: { date: string; status: NightStatus; raw: string }[];
  }[];
}

export type FetchOutcome =
  | { ok: true; httpStatus: number; data: MonthAvailability }
  /** blocked = provider is refusing us (403/429). The poller cools down. */
  | { ok: false; httpStatus: number | null; blocked: boolean; error: string };

/**
 * A pollable booking platform. Lookouts, cabins, guard stations, and campsites all go
 * through this, so a new platform is one module plus a registry entry.
 */
export interface StayProvider {
  platform: string;
  /** Fetch one calendar month. `month` is "YYYY-MM-01". */
  fetchMonth(providerRef: string, month: string): Promise<FetchOutcome>;
}

/** Identifiable user agent for every outbound provider request. */
export const USER_AGENT = "TheZoraFiles-LookoutFinder/1.0 (+https://thezorafiles.com/lookouts)";
