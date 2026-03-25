/**
 * Generate a placeholder image URL for discoveries without a photo.
 * Uses loremflickr.com to fetch Creative Commons images by keyword.
 */
export function getPlaceholderUrl(
  name: string,
  size: { w: number; h: number } = { w: 400, h: 300 }
): string {
  // Clean the name for use as a search keyword
  // "Gambel's Quail" -> "quail", "Gila Woodpecker" -> "woodpecker"
  const keyword = name
    .toLowerCase()
    .replace(/['']/g, "")
    // Drop common prefixes/possessives that don't help image search
    .replace(/\b(gambels?|gilas?|desert|arizona|sonoran|greater|lesser|western|eastern|northern|southern)\b/gi, "")
    .trim()
    .split(/\s+/)
    .pop() || name.toLowerCase().split(/\s+/).pop() || "wildlife";

  return `https://loremflickr.com/${size.w}/${size.h}/${encodeURIComponent(keyword)}`;
}
