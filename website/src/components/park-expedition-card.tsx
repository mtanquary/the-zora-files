import Image from "next/image";
import Link from "next/link";
import type { EpisodeRow } from "@/lib/queries";
import { EFFORT_LEVELS } from "@/lib/types";
import { extractYouTubeId } from "@/lib/youtube";
import { isAired, formatAirsDate } from "@/lib/airing";
import { ZoraMark, episodeCode, episodeSlug, episodeImage, formatLongDate } from "@/components/park";

/**
 * Brochure-style expedition card. Leads with the photo, place, and trail
 * facts. The game score shows only as a small Eos chip; the full scorecard
 * lives on the Finding Zora episode page.
 *
 * Upcoming episodes follow the airing rules: date + place only, no still,
 * stats, or scores until they air.
 */
export function ParkExpeditionCard({
  episode: ep,
  featured = false,
}: {
  episode: EpisodeRow;
  featured?: boolean;
}) {
  const aired = isAired(ep.publish_date);
  const slug = episodeSlug(ep.season, ep.episode_number);
  const code = episodeCode(ep.season, ep.episode_number);
  const image = aired ? episodeImage(ep.thumbnail_url, extractYouTubeId(ep.youtube_url)) : null;
  const effort = EFFORT_LEVELS.find((e) => e.level === ep.effort_rating);
  const recordHref = `/finding-zora/episodes/${slug}`;

  const facts: string[] = [];
  if (aired) {
    if (ep.distance_miles) facts.push(`${Number(ep.distance_miles).toFixed(1)} mi`);
    if (ep.elevation_gain_ft) facts.push(`${Math.round(Number(ep.elevation_gain_ft)).toLocaleString()} ft gain`);
    if (effort) facts.push(effort.label);
  }

  return (
    <article
      className={`group flex flex-col overflow-hidden border-[3px] border-ink bg-bone transition-shadow hover:shadow-[6px_6px_0_var(--first-light)] ${
        featured ? "md:flex-row" : ""
      }`}
    >
      <Link
        href={recordHref}
        className={`relative block aspect-[16/9] overflow-hidden bg-park-forest-deep ${
          featured ? "md:aspect-auto md:w-[58%]" : ""
        }`}
      >
        {image ? (
          <Image
            src={image}
            alt={`${ep.title}, ${ep.location_name}`}
            fill
            sizes={featured ? "(min-width: 768px) 620px, 100vw" : "(min-width: 768px) 340px, 100vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-blue-hour">
            <ZoraMark size={56} variant="reverse" />
            <span className="stamp text-sm text-bone">
              {aired ? "Film coming soon" : `Airs ${formatAirsDate(ep.publish_date)}`}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 stamp bg-blue-hour px-2 py-0.5 text-[0.72rem] text-first-light">
          {code}
        </span>
      </Link>

      <div className={`flex flex-1 flex-col p-5 ${featured ? "md:p-8" : ""}`}>
        <p className="font-park-sans text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-park-moss">
          {ep.location_name}
        </p>
        <h3
          className={`mt-1 font-park-display font-extrabold leading-none text-ink ${
            featured ? "text-5xl" : "text-3xl"
          }`}
        >
          <Link href={recordHref} className="hover:text-park-amber-ink">
            {ep.title}
          </Link>
        </h3>
        <p className="mt-1 font-park-sans text-sm text-park-ink-faint">
          {aired ? formatLongDate(ep.shoot_date) : `Premieres ${formatAirsDate(ep.publish_date)}`}
        </p>

        {featured && aired && ep.notes && (
          <p className="mt-4 line-clamp-4 text-park-ink-soft">{ep.notes}</p>
        )}

        {facts.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {facts.map((f) => (
              <li
                key={f}
                className="stamp border border-rhyolite/60 px-2 py-0.5 text-[0.7rem] text-muted"
              >
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {aired && ep.youtube_url ? (
            <a
              href={ep.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-park-sans text-sm font-bold text-park-forest hover:text-park-amber-ink"
            >
              <span aria-hidden="true">▶</span> Watch the film
            </a>
          ) : (
            <Link
              href={recordHref}
              className="font-park-sans text-sm font-bold text-park-forest hover:text-park-amber-ink"
            >
              Expedition details →
            </Link>
          )}
          {aired && (
            <Link
              href={recordHref}
              title="Eos index: the Finding Zora sunrise score"
              className="stamp border-2 border-ink px-2 py-0.5 text-[0.72rem] text-ink hover:bg-blue-hour hover:text-bone"
            >
              Eos {ep.eos_total}/100
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
