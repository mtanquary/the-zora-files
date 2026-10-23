/**
 * Channel-page building blocks in the Finding Zora brand system
 * (brand/BRAND-GUIDE.md). Three ingredients, at most two per piece:
 *   1. First light: blue-hour, dawn-rose, first-light, with bone and rhyolite.
 *   2. Field issue: stencil display face, squared panels, wide-tracked labels.
 *   3. The record: real field data in the mono "stamp" style.
 * The Z mark is the constant. No illustrated sunsets or silhouettes, and no
 * decorative gradients: photography is the only place a sky gradient belongs.
 */

import Image from "next/image";
import Link from "next/link";

/* ─────────────────────────── Marks ─────────────────────────── */

type MarkVariant = "color" | "reverse" | "mono";

/**
 * The Z alone, "like a swoosh". `color` on light grounds, `reverse` on dark.
 * Min 24px on screen; clear space on every side equals the sun's height
 * (about a quarter of the mark), which callers should leave around it.
 */
export function ZoraMark({
  size = 40,
  variant = "color",
  className = "",
  title,
}: {
  size?: number;
  variant?: MarkVariant;
  className?: string;
  title?: string;
}) {
  const file = variant === "reverse" ? "zora-z-reverse" : variant === "mono" ? "zora-z-mono" : "zora-z";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/${file}.svg`}
      width={Math.max(size, 24)}
      height={Math.max(size, 24)}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={className}
    />
  );
}

/** FINDING ZORA lockup (primary) or the short ZORA lockup. */
export function BrandLockup({
  height = 56,
  reverse = false,
  short = false,
  className = "",
}: {
  height?: number;
  reverse?: boolean;
  short?: boolean;
  className?: string;
}) {
  const base = short ? "zora-lockup" : "finding-zora-lockup";
  const ratio = short ? 179.3 / 120 : 179.3 / 148.7;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/${base}${reverse ? "-reverse" : ""}.svg`}
      height={height}
      width={Math.round(height * ratio)}
      alt={short ? "Zora" : "Finding Zora"}
      className={className}
    />
  );
}

/* ─────────────────────────── Hero ─────────────────────────── */

/**
 * Blue-hour slab. With `photo`, a real sunrise sits behind a solid
 * blue-hour veil (no gradient), so bone and first-light text stay legible.
 */
export function ParkHero({
  children,
  size = "lg",
  photo,
  aside,
}: {
  children: React.ReactNode;
  size?: "lg" | "sm";
  photo?: string | null;
  aside?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-blue-hour text-bone">
      {photo && (
        <>
          <Image src={photo} alt="" aria-hidden="true" fill preload sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-blue-hour/70" />
        </>
      )}
      <div
        className={`relative z-10 mx-auto grid max-w-[1080px] gap-10 px-6 ${
          size === "lg" ? "py-16 sm:py-24" : "py-10 sm:py-14"
        } ${aside ? "lg:grid-cols-[1fr_380px] lg:items-center" : ""}`}
      >
        <div>{children}</div>
        {aside}
      </div>
      {/* Horizon line */}
      <div className="relative z-10 h-[3px] bg-first-light" />
    </section>
  );
}

/** Stencil page title for hero slabs. */
export function HeroTitle({ children, size = "lg" }: { children: React.ReactNode; size?: "lg" | "sm" }) {
  return (
    <h1
      className={`font-park-display font-extrabold leading-[0.92] text-bone ${
        size === "lg" ? "text-[clamp(3rem,9vw,6.5rem)]" : "text-[clamp(2.75rem,7vw,4.5rem)]"
      }`}
    >
      {children}
    </h1>
  );
}

/* ─────────────────────────── Type + layout ─────────────────────────── */

/** Small wide-tracked label (caption style). */
export function Kicker({
  children,
  tone = "ink",
}: {
  children: React.ReactNode;
  tone?: "ink" | "paper" | "amber";
}) {
  const color =
    tone === "paper" ? "text-bone/80" : tone === "amber" ? "text-first-light" : "text-muted";
  return (
    <p className={`font-park-sans text-[0.78rem] font-semibold uppercase tracking-[0.16em] ${color}`}>
      {children}
    </p>
  );
}

/** Section heading: stencil title over a heavy ink rule. */
export function ParkSection({
  kicker,
  title,
  intro,
  action,
  children,
  className = "",
}: {
  kicker?: string;
  title: string;
  intro?: React.ReactNode;
  action?: { href: string; label: string };
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-[1080px] px-6 py-12 ${className}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-3">
        <div>
          {kicker && <Kicker>{kicker}</Kicker>}
          <h2 className="mt-1 font-park-display text-4xl font-extrabold leading-none text-ink sm:text-5xl">
            {title}
          </h2>
        </div>
        {action && (
          <Link
            href={action.href}
            className="font-park-sans text-sm font-bold text-ink underline decoration-first-light decoration-[3px] underline-offset-[6px] hover:text-muted"
          >
            {action.label} →
          </Link>
        )}
      </div>
      {intro && <div className="-mt-3 mb-8 max-w-[640px] text-muted">{intro}</div>}
      {children}
    </section>
  );
}

/**
 * Field stamp: the brand's "record". Square ink frame, header with the Z,
 * a stencil title and an issue number, then mono label/value rows on
 * rhyolite rules. Mirrors brand/logos/zora-field-stamp.svg.
 */
export function FieldStamp({
  title = "Finding Zora",
  number,
  rows,
  tone = "light",
  className = "",
}: {
  title?: string;
  number?: string | number | null;
  rows: { label: string; value: React.ReactNode }[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  const frame = dark ? "border-bone text-bone bg-blue-hour" : "border-ink text-ink bg-bone";
  const label = dark ? "text-night-muted" : "text-rhyolite";
  const rule = dark ? "border-night-rule" : "border-rhyolite/60";
  return (
    <div className={`border-[3px] ${frame} ${className}`}>
      <div className={`flex items-center gap-3 border-b-[3px] px-4 py-2.5 ${dark ? "border-bone" : "border-ink"}`}>
        <ZoraMark size={30} variant={dark ? "reverse" : "color"} />
        <span className="font-park-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em]">{title}</span>
        {number != null && (
          <span className="stamp ml-auto text-sm">No. {String(number).padStart(3, "0")}</span>
        )}
      </div>
      <dl className="px-4 py-3">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[minmax(84px,auto)_1fr] items-baseline gap-x-4 py-1.5">
            <dt className={`stamp text-[0.72rem] ${label}`}>{r.label}</dt>
            <dd className={`stamp border-b pb-1 text-[0.92rem] ${rule}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Stat strip in the stamp style (the old wooden "trail register"). */
export function StatStrip({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="border-b-[3px] border-ink bg-bone">
      <dl className="mx-auto grid max-w-[1080px] grid-cols-2 gap-px px-6 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="py-5">
            <dt className="stamp text-[0.72rem] text-rhyolite">{it.label}</dt>
            <dd className="mt-1 font-park-display text-5xl font-extrabold leading-none text-ink">{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Interpretive panel: square blue-hour frame, stencil title band, bone body. */
export function Wayside({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="border-[3px] border-blue-hour bg-bone">
      <div className="bg-blue-hour px-6 py-3">
        <h3 className="font-park-display text-3xl font-extrabold leading-none text-bone">{title}</h3>
      </div>
      <div className="grid gap-6 px-6 py-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-4 text-ink">{children}</div>
        {aside}
      </div>
    </div>
  );
}

/** Button: 4px radius per the tokens. `amber` is first-light with blue-hour text. */
export function ParkButton({
  href,
  children,
  variant = "amber",
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "amber" | "ghost" | "forest";
  external?: boolean;
}) {
  const styles = {
    amber: "bg-first-light text-blue-hour border-first-light hover:bg-[#F6BC5F]",
    ghost: "bg-transparent text-bone border-bone/70 hover:bg-bone/10",
    forest: "bg-blue-hour text-bone border-blue-hour hover:bg-night-slab",
  }[variant];
  const cls = `inline-flex items-center gap-2 rounded-sm border-2 px-5 py-2.5 font-park-sans text-sm font-bold uppercase tracking-[0.08em] transition-colors ${styles}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** "48.5602 N  115.9214 W" for field stamps. */
export function formatFix(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null || (lat === 0 && lng === 0)) return "—";
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)} ${ns}  ${Math.abs(lng).toFixed(3)} ${ew}`;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

export function episodeSlug(season: number, episodeNumber: number): string {
  return `s${String(season).padStart(2, "0")}e${String(episodeNumber).padStart(2, "0")}`;
}

export function episodeCode(season: number, episodeNumber: number): string {
  return `S${String(season).padStart(2, "0")}E${String(episodeNumber).padStart(2, "0")}`;
}

/** Best available still for an episode: explicit thumbnail, else YouTube's. */
export function episodeImage(
  thumbnailUrl: string | null,
  youtubeId: string | null
): string | null {
  if (thumbnailUrl) return thumbnailUrl;
  if (youtubeId) return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  return null;
}


/**
 * "June 12, 2026" from a pg DATE (a Date at local midnight) or an ISO string.
 * Uses the local calendar parts for Date objects so the day never shifts.
 */
export function formatLongDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  let y: number, m: number, d: number;
  if (value instanceof Date) {
    y = value.getFullYear();
    m = value.getMonth();
    d = value.getDate();
  } else {
    const [ys, ms, ds] = value.slice(0, 10).split("-");
    y = Number(ys);
    m = Number(ms) - 1;
    d = Number(ds);
  }
  return new Date(Date.UTC(y, m, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Sortable "YYYY-MM-DD" key for a pg DATE or string; missing dates sort last. */
export function dateKey(value: string | Date | null | undefined): string {
  if (!value) return "9999-99-99";
  if (value instanceof Date) {
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${mm}-${dd}`;
  }
  return value.slice(0, 10);
}
