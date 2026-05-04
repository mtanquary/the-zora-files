import Link from "next/link";
import { getEpisodeByNumber, getEpisodeMedia } from "@/lib/queries";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const match = slug.match(/^s(\d+)e(\d+)$/i);
  if (!match) return { title: "Media" };
  const ep = await getEpisodeByNumber(parseInt(match[1], 10), parseInt(match[2], 10));
  return { title: ep ? `Media · "${ep.title}"` : "Media" };
}

export default async function EpisodeMediaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = slug.match(/^s(\d+)e(\d+)$/i);
  if (!match) return notFound();

  const season = parseInt(match[1], 10);
  const episodeNumber = parseInt(match[2], 10);
  const ep = await getEpisodeByNumber(season, episodeNumber);
  if (!ep) return notFound();

  const media = await getEpisodeMedia(ep.id);
  const photos = media.filter((m) => m.kind === "photo");
  const videos = media.filter((m) => m.kind === "video");

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href={`/finding-zora/episodes/${slug}`}
        className="text-xs text-dawn-mist/40 hover:text-zora-amber transition-colors"
      >
        ← back to episode
      </Link>
      <p className="mt-6 text-sm text-dawn-mist/40">
        S{String(ep.season).padStart(2, "0")}E{String(ep.episode_number).padStart(2, "0")}
      </p>
      <h1 className="font-display text-3xl font-bold text-zora-amber mb-1">
        &ldquo;{ep.title}&rdquo; · media
      </h1>
      <p className="text-dawn-mist/50 mb-10">
        {ep.location_name} · {photos.length} photo{photos.length !== 1 ? "s" : ""} · {videos.length} video{videos.length !== 1 ? "s" : ""}
      </p>

      {media.length === 0 && (
        <p className="text-dawn-mist/40 text-sm">No additional media has been attached to this expedition yet.</p>
      )}

      {videos.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-lg font-semibold text-dawn-mist mb-4">videos</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {videos.map((m) => (
              <figure key={m.id} className="space-y-2">
                <video
                  src={m.url}
                  controls
                  preload="metadata"
                  className="w-full rounded-xl bg-pre-dawn-mid"
                />
                {m.caption && (
                  <figcaption className="text-xs text-dawn-mist/50">{m.caption}</figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {photos.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-dawn-mist mb-4">photos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((m) => (
              <figure key={m.id} className="space-y-2">
                <a href={m.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={m.url}
                    alt={m.caption || ""}
                    className="w-full rounded-xl object-cover hover:opacity-90 transition-opacity"
                  />
                </a>
                {m.caption && (
                  <figcaption className="text-xs text-dawn-mist/50">{m.caption}</figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
