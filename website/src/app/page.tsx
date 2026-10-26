import Image from "next/image";
import Link from "next/link";
import { getEpisodes, getAllDiscoveries } from "@/lib/queries";
import { LEVELS } from "@/lib/types";
import { groupDiscoveries } from "@/components/discovery-card";
import { isAired, airedWithinDays } from "@/lib/airing";
import { getArchiveEntries, archiveImageUrl } from "@/lib/archives";
import {
  ParkHero,
  HeroTitle,
  ParkButton,
  ParkSection,
  StatStrip,
  Wayside,
  ZoraMark,
  Kicker,
  dateKey,
  episodeImage,
  episodeSlug,
} from "@/components/park";
import { ParkExpeditionCard } from "@/components/park-expedition-card";
import { extractYouTubeId } from "@/lib/youtube";
import type { EpisodeRow } from "@/lib/queries";

export const dynamic = "force-dynamic";

const explore = [
  {
    href: "/expeditions",
    title: "Expeditions",
    body: "Every expedition, with the trail facts and the film.",
    icon: <path d="M6 40 L18 22 L26 32 L34 16 L46 40 Z M34 16 v-8 l8 3 -8 3" />,
  },
  {
    href: "/lookouts",
    title: "Lookouts",
    body: "Every rentable fire lookout, and when its dates open.",
    icon: (
      <>
        <path d="M14 44 L20 22 M38 44 L32 22 M18 32 H34" />
        <rect x="16" y="12" width="20" height="10" />
        <path d="M13 12 L26 5 L39 12" />
      </>
    ),
  },
  {
    href: "/gallery",
    title: "Gallery",
    body: "What the first light looked like.",
    icon: (
      <>
        <rect x="6" y="12" width="40" height="28" />
        <circle cx="26" cy="26" r="8" />
        <path d="M18 12 l3 -5 h10 l3 5" />
      </>
    ),
  },
  {
    href: "/field-guide",
    title: "Field guide",
    body: "The animals, plants, and history met along the way.",
    icon: (
      <>
        <path d="M26 10 C14 10 8 20 8 30 c10 0 18 -6 18 -20 Z" />
        <path d="M26 10 C38 10 44 20 44 30 c-10 0 -18 -6 -18 -20 Z" />
        <path d="M26 10 V44" />
      </>
    ),
  },
  {
    href: "/finding-zora/map",
    title: "Map",
    body: "Every trailhead pinned.",
    icon: (
      <>
        <path d="M6 12 L18 8 L32 13 L46 9 V40 L32 44 L18 39 L6 43 Z" />
        <path d="M18 8 V39 M32 13 V44" />
      </>
    ),
  },
];

/** As many whole sentences of the field notes as fit in ~150 characters. */
function teaser(notes: string | null, max = 150): string | null {
  if (!notes?.trim()) return null;
  const sentences = notes.trim().replace(/\s+/g, " ").split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    if (out && out.length + 1 + s.length > max) break;
    out = out ? `${out} ${s}` : s;
  }
  // A single sentence longer than the limit: cut at a word boundary.
  if (out.length > max) out = out.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
  return out;
}

/**
 * Hero teaser for the latest expedition: the photo with a play button, the
 * title and place, and a line from the field notes. Self-explanatory for a
 * first-time visitor, unlike a data stamp.
 */
function FeaturedFilm({ ep }: { ep: EpisodeRow }) {
  const ytId = extractYouTubeId(ep.youtube_url);
  const image = episodeImage(ep.thumbnail_url, ytId);
  const detailHref = `/finding-zora/episodes/${episodeSlug(ep.season, ep.episode_number)}`;
  const watchHref = ep.youtube_url ?? detailHref;
  const external = !!ep.youtube_url;
  const isNew = airedWithinDays(ep.publish_date, 21);
  const hook = teaser(ep.notes);

  return (
    <article className="border-[3px] border-bone bg-bone text-ink shadow-[8px_8px_0_var(--first-light)]">
      <a
        href={watchHref}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group relative block aspect-video overflow-hidden bg-blue-hour"
        aria-label={`Watch ${ep.title}`}
      >
        {image && (
          <Image
            src={image}
            alt={`${ep.title}, ${ep.location_name}`}
            fill
            sizes="(min-width: 1024px) 380px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <span className="stamp absolute left-3 top-3 bg-blue-hour px-2 py-0.5 text-[0.72rem] text-first-light">
          {isNew ? "New film" : "Latest film"}
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-first-light shadow-[0_4px_18px_rgba(27,23,25,0.45)] transition-transform group-hover:scale-110">
            <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden="true">
              <path d="M3 2 L20 12 L3 22 Z" fill="var(--blue-hour)" />
            </svg>
          </span>
        </span>
      </a>
      <div className="p-5">
        <p className="font-park-sans text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted">
          {ep.location_name}
        </p>
        <h2 className="mt-1 font-park-display text-3xl font-extrabold leading-none">{ep.title}</h2>
        {hook && <p className="mt-3 text-[0.95rem] leading-snug text-muted">{hook}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-park-sans text-sm font-bold">
          <a
            href={watchHref}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="text-ink underline decoration-first-light decoration-[3px] underline-offset-[6px] hover:text-muted"
          >
            Watch the film
          </a>
          <Link href={detailHref} className="text-muted hover:text-ink">
            The whole story →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function Home() {
  const [episodes, discoveries] = await Promise.all([getEpisodes(), getAllDiscoveries()]);
  const archives = getArchiveEntries();

  const aired = episodes.filter((e) => isAired(e.publish_date));
  const latestAired = aired[0] ?? null;
  const upcoming = episodes
    .filter((e) => !isAired(e.publish_date))
    .sort((a, b) => dateKey(a.publish_date).localeCompare(dateKey(b.publish_date)))[0];

  // Up to three cards: the next premiere (if any) plus the most recent aired.
  const latestCards = [...(upcoming ? [upcoming] : []), ...aired].slice(0, 3);

  const miles = aired.reduce((n, e) => n + (Number(e.distance_miles) || 0), 0);
  const feet = aired.reduce((n, e) => n + (Number(e.elevation_gain_ft) || 0), 0);
  const species = groupDiscoveries(discoveries).length;
  const currentLevel = LEVELS.filter((l) => aired.length >= l.expeditions).pop()!;

  const stats = [
    { value: String(aired.length), label: aired.length === 1 ? "Expedition logged" : "Expeditions logged" },
    { value: miles > 0 ? miles.toFixed(miles < 100 ? 1 : 0) : "—", label: "Trail miles" },
    { value: feet > 0 ? Math.round(feet).toLocaleString() : "—", label: "Feet climbed" },
    { value: String(species), label: "Field guide entries" },
  ];

  const photos = archives.slice(0, 9);
  const heroPhoto = archives[0] ? archiveImageUrl(archives[0]) : null;

  const featured = latestAired ? <FeaturedFilm ep={latestAired} /> : null;

  return (
    <div className="park">
      {/* ══ Hero: over a real sunrise, with the latest film ══ */}
      <ParkHero photo={heroPhoto} aside={featured}>
        <Kicker tone="amber">The Zora Files</Kicker>
        <div className="mt-4">
          <HeroTitle>The sunrise is the excuse.</HeroTitle>
        </div>
        <p className="mt-6 max-w-[540px] font-park-sans text-lg leading-relaxed text-bone/90">
          Everything else is the point. Fire lookouts you can sleep in, places
          worth the drive in the dark, the photographs, the field notes, and
          the idea that started it all.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ParkButton href="/lookouts">Find a lookout</ParkButton>
          <ParkButton href="/expeditions" variant="ghost">
            See the expeditions
          </ParkButton>
        </div>
      </ParkHero>

      {/* ══ Explore ══ */}
      <ParkSection kicker="Start here" title="Explore the files">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {explore.map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className="group flex flex-col border-[3px] border-ink bg-bone p-5 transition-colors hover:bg-blue-hour hover:text-bone"
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 52 52"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="text-ink group-hover:text-first-light"
                aria-hidden="true"
              >
                {x.icon}
              </svg>
              <span className="mt-3 font-park-display text-3xl font-extrabold leading-none">{x.title}</span>
              <span className="mt-2 font-park-sans text-sm text-muted group-hover:text-bone/80">{x.body}</span>
            </Link>
          ))}
        </div>
      </ParkSection>

      {/* ══ Photographs ══ */}
      {photos.length > 0 && (
        <div className="border-y-[3px] border-ink bg-park-paper-2">
          <ParkSection kicker="From the field" title="First light" action={{ href: "/gallery", label: "Open the gallery" }}>
            <div className="grid auto-rows-[150px] grid-cols-2 gap-2 sm:auto-rows-[180px] md:grid-cols-4">
              {photos.map((p, i) => (
                <Link
                  key={p.filename}
                  href="/gallery"
                  className={`group relative overflow-hidden bg-blue-hour ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                >
                  <Image
                    src={archiveImageUrl(p)}
                    alt={p.caption ?? p.vibe ?? "Sunrise photograph"}
                    fill
                    sizes={i === 0 ? "(min-width: 768px) 540px, 100vw" : "(min-width: 768px) 270px, 50vw"}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {p.caption && i === 0 && (
                    <span className="absolute inset-x-0 bottom-0 bg-blue-hour/85 p-4 font-park-sans text-sm leading-snug text-bone">
                      {p.caption}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </ParkSection>
        </div>
      )}

      {/* ══ The show ══ */}
      <div className="border-t-[3px] border-ink">
        <StatStrip items={stats} />
      </div>

      {/* ══ Latest expeditions ══ */}
      {latestCards.length > 0 && (
        <ParkSection
          kicker="From the show"
          title="Recent expeditions"
          action={{ href: "/expeditions", label: "All expeditions" }}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {latestCards.map((ep) => (
              <ParkExpeditionCard key={ep.id} episode={ep} />
            ))}
          </div>
        </ParkSection>
      )}

      {/* ══ The purpose ══ */}
      <section className="mx-auto max-w-[1080px] px-6 pb-12 pt-12">
        <Wayside
          title="There's always more to it."
          aside={
            <div className="hidden px-6 md:block">
              <ZoraMark size={140} title="The Z: a switchback trail with the sun rising off the top" />
            </div>
          }
        >
          <p className="text-lg">
            Zora is Slavic for dawn. Every trip starts there and ends wherever
            the story does.
          </p>
          <p className="text-muted">
            The Z is a switchback. It starts at the trailhead, climbs, and tops
            out on the horizon with the sun coming up off the end. The view is
            nice. The climb is the part you remember.
          </p>
          <Link
            href="/about"
            className="inline-block font-park-sans text-sm font-bold text-ink underline decoration-first-light decoration-[3px] underline-offset-[6px] hover:text-muted"
          >
            Meet the host →
          </Link>
        </Wayside>
      </section>

      {/* ══ The game it grew from ══ */}
      <section className="mx-auto max-w-[1080px] px-6 pb-20">
        <Link
          href="/finding-zora"
          className="night group block border-[3px] border-blue-hour p-8 transition-colors hover:border-first-light md:p-10"
        >
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="stamp text-[0.72rem] text-mist-dim">Where it started</p>
              <h2 className="mt-2 font-display text-5xl font-extrabold uppercase leading-none text-bone">
                Finding Zora, the game
              </h2>
              <p className="mt-3 max-w-[560px] text-mist-dim">
                Every dawn scored on the Eos index, every find logged for
                points, and a slow climb through eleven ranks.
                {aired.length > 0 && (
                  <>
                    {" "}Currently <strong>level {currentLevel.level} · {currentLevel.title}</strong>.
                  </>
                )}
              </p>
            </div>
            <span className="font-park-sans text-sm font-bold uppercase tracking-[0.12em] text-first-light">
              Play along →
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
