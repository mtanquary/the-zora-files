import "server-only";
import type { StayProvider } from "./types";
import { recgovProvider } from "./recgov";

/**
 * Pollable providers by platform id. Platforms not listed here (phone,
 * Airbnb, WV State Parks, and GoingToCamp until phase 1b) show release
 * rules instead of live availability.
 */
export const PROVIDERS: Record<string, StayProvider> = {
  recgov: recgovProvider,
};

export function getProvider(platform: string): StayProvider | null {
  return PROVIDERS[platform] ?? null;
}
