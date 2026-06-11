/**
 * Episode airing helpers.
 *
 * An episode is "aired" when its `publish_date` is set AND on or before today
 * (UTC). Unscheduled (null) and future-dated episodes are "upcoming" — public
 * surfaces should show the air date but hide score/discovery/notes/embed.
 */

function toDateOnly(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function todayUTCDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isAired(publishDate: string | Date | null | undefined): boolean {
  const pd = toDateOnly(publishDate);
  if (!pd) return false;
  return pd <= todayUTCDateOnly();
}

/** "June 12, 2026" — for callouts. */
export function formatAirsDate(
  publishDate: string | Date | null | undefined
): string {
  const pd = toDateOnly(publishDate);
  if (!pd) return "date to be announced";
  return new Date(`${pd}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "Jun 12" — for inline list rows. */
export function formatAirsDateShort(
  publishDate: string | Date | null | undefined
): string {
  const pd = toDateOnly(publishDate);
  if (!pd) return "tba";
  return new Date(`${pd}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
