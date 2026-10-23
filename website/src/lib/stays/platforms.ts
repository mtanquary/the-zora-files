/**
 * Booking-platform metadata. Client-safe. The fetching side of each
 * pollable platform lives in ./providers (server only).
 *
 * Adding a platform: add an entry here, and if it can be polled, add a
 * provider module under ./providers and register it in providers/index.ts.
 */

export interface PlatformInfo {
  id: string;
  label: string;
  /** Text for the outbound booking button. */
  bookLabel: string;
  /** True when the poller can read availability for it. */
  pollable: boolean;
  /** Short explanation shown when we can't show live availability. */
  whyNot?: string;
}

export const PLATFORMS: Record<string, PlatformInfo> = {
  recgov: {
    id: "recgov",
    label: "Recreation.gov",
    bookLabel: "Book on Recreation.gov",
    pollable: true,
  },
  goingtocamp: {
    id: "goingtocamp",
    label: "Washington State Parks (GoingToCamp)",
    bookLabel: "Book with WA State Parks",
    pollable: false,
    whyNot: "Live availability for GoingToCamp is planned. For now, check the park's booking site.",
  },
  wv_state_parks: {
    id: "wv_state_parks",
    label: "West Virginia State Parks",
    bookLabel: "Book with WV State Parks",
    pollable: false,
    whyNot: "WV State Parks doesn't release cancellations online, so the release date is what matters.",
  },
  phone: {
    id: "phone",
    label: "Phone reservations",
    bookLabel: "Booking details",
    pollable: false,
    whyNot: "Reservations are taken by phone only, on a single release day.",
  },
  airbnb: {
    id: "airbnb",
    label: "Airbnb",
    bookLabel: "View on Airbnb",
    pollable: false,
    whyNot: "Airbnb has no public availability feed. Check the listing for open dates.",
  },
};

export function platformInfo(id: string): PlatformInfo {
  return PLATFORMS[id] ?? { id, label: id, bookLabel: "Booking details", pollable: false };
}

export const SEASON_LABELS: Record<string, string> = {
  open: "Open this season",
  seasonal: "Seasonal",
  maintenance_closure: "Closed for maintenance",
  administrative_closure: "Administrative closure",
  unavailable: "Currently unavailable",
  unknown: "Status unknown",
};

export const SEASON_CLOSED = new Set(["maintenance_closure", "administrative_closure", "unavailable"]);
