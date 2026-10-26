import type { NightStatus, SiteSummary, StayKind } from "@/lib/stays/types";

/** Pin ring per kind, shared by the map and the list. Lookouts: plain pin.
 *  Cabins: light center dot. Guard stations: dark ring. */
export const KIND_MARKS: Record<string, { stroke: string; dot: string | null }> = {
  lookout: { stroke: "#F2EBDD", dot: null },
  cabin: { stroke: "#F2EBDD", dot: "#F2EBDD" },
  guard_station: { stroke: "#1D2342", dot: null },
};

/** How each kind of stay is named in the UI. */
export const KIND_LABELS: Record<StayKind, { one: string; many: string }> = {
  lookout: { one: "Fire lookout", many: "Lookouts" },
  cabin: { one: "Cabin", many: "Cabins" },
  guard_station: { one: "Guard station", many: "Guard stations" },
  campsite: { one: "Campsite", many: "Campsites" },
};

/** Pin + chip colors. Earthy, legible on the light basemap; avoids the
 *  teal (Eos) and violet (Discovery) reservations. */
export const SUMMARY_STYLE: Record<SiteSummary, { color: string; label: string; short: string }> = {
  available: { color: "#2E7D4F", label: "Open for your dates", short: "Open" },
  partial: { color: "#F2A93B", label: "Some nights open", short: "Some nights" },
  booked: { color: "#C8667A", label: "Booked", short: "Booked" },
  not_released: { color: "#353D78", label: "Not released yet", short: "Not released" },
  closed: { color: "#9C8F7A", label: "Not offered those nights", short: "Not offered" },
  season_closed: { color: "#7D6A70", label: "Closed this season", short: "Closed" },
  not_pollable: { color: "#5E5054", label: "Release dates only", short: "Release dates" },
  unknown: { color: "#B8ADB2", label: "Not checked yet", short: "Unchecked" },
};

/** Wording when no dates are picked: "open" means "has open nights". */
export const SUMMARY_LABEL_NO_RANGE: Partial<Record<SiteSummary, string>> = {
  available: "Has open nights",
  booked: "Booked through the window",
  closed: "Off-season",
};

export const NIGHT_STYLE: Record<NightStatus, { color: string; label: string }> = {
  available: { color: "#2E7D4F", label: "Open" },
  reserved: { color: "#C8667A", label: "Reserved" },
  not_released: { color: "#353D78", label: "Not released" },
  walk_up: { color: "#8A6D3B", label: "Walk-up" },
  lottery: { color: "#8A6D3B", label: "Lottery" },
  closed: { color: "#9C8F7A", label: "Not offered" },
  unknown: { color: "#B8ADB2", label: "Unknown" },
};

export const SUMMARY_ORDER: SiteSummary[] = [
  "available",
  "partial",
  "not_released",
  "booked",
  "closed",
  "not_pollable",
  "season_closed",
  "unknown",
];

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana",
  IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico",
  VI: "U.S. Virgin Islands", GU: "Guam",
};

/** "$45", "$45–$90", or null. */
export function formatPrice(min: number | null, max: number | null): string | null {
  if (min == null) return null;
  const f = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
  return max != null && max !== min ? `${f(min)}–${f(max)}` : f(min);
}

/** Names are already cleaned by the seeds; this just trims a trailing
 *  "Lookout" for compact list rows. */
export function shortName(name: string): string {
  return name.replace(/\s+(Fire\s+)?Lookout$/i, "");
}
