import type { NightStatus, SiteSummary } from "@/lib/stays/types";

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
  CA: "California", CO: "Colorado", ID: "Idaho", MT: "Montana", OR: "Oregon",
  SD: "South Dakota", WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming",
};

/** "YAAK MTN. LOOKOUT RENTAL" style names are already cleaned by the seed;
 *  this just trims the trailing word "Lookout" for compact list rows. */
export function shortName(name: string): string {
  return name.replace(/\s+(Fire\s+)?Lookout$/i, "");
}
