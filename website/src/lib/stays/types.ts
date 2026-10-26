/**
 * Shared types for bookable stays (fire lookouts, cabins, guard stations;
 * campsites later). Safe to import from client components.
 */
import type { ReleaseRule } from "./release";

export type StayKind = "lookout" | "cabin" | "guard_station" | "campsite";

/** Kinds the map shows today, in display order. */
export const MAP_KINDS: StayKind[] = ["lookout", "cabin", "guard_station"];

export type SeasonStatus =
  | "open"
  | "seasonal"
  | "maintenance_closure"
  | "administrative_closure"
  | "unavailable"
  | "unknown";

/** Normalized nightly status across providers. */
export type NightStatus =
  | "available"
  | "reserved"
  | "not_released"
  | "walk_up"
  | "lottery"
  | "closed"
  | "unknown";

/** What a pin says at a glance. */
export type SiteSummary =
  | "available" // every requested night is open (or: has open nights, when no dates picked)
  | "partial" // some requested nights are open
  | "booked" // released, nothing open
  | "not_released" // requested nights aren't bookable yet
  | "closed" // provider shows the site closed / not offered on those nights
  | "season_closed" // our own season status: maintenance, admin closure, unavailable
  | "not_pollable" // phone / Airbnb / WV portal: release rules only
  | "unknown"; // not polled yet

export interface StaySite {
  id: string;
  kind: StayKind;
  name: string;
  state: string;
  operator: string | null;
  managing_unit: string | null;
  lat: number;
  lng: number;
  coords_approximate: boolean;
  platform: string;
  provider_ref: string | null;
  booking_url: string | null;
  info_url: string | null;
  season_status: SeasonStatus;
  season_notes: string | null;
  provider_reservable: boolean | null;
  release_rule: ReleaseRule;
  rating: number | null;
  rating_count: number | null;
  rating_source: string | null;
  /** Rentable units under this listing (multi-cabin facilities). */
  unit_count: number | null;
  /** Nightly price range on the booking site, when known. */
  price_min: number | null;
  price_max: number | null;
  image_url: string | null;
}

export interface SiteAvailability {
  summary: SiteSummary;
  /** Per-night detail for the requested range (empty when no range). */
  nights: { date: string; status: NightStatus }[];
  /** First open night from today on, if any. */
  next_open: string | null;
  /** Count of open nights from today through the release window. */
  open_nights: number;
  /** Most recent successful fetch for this site. */
  last_fetched: string | null;
}

export interface StayWithAvailability extends StaySite {
  availability: SiteAvailability;
}

export interface StaysResponse {
  generated_at: string;
  range: { start: string; end: string } | null;
  sites: StayWithAvailability[];
}
