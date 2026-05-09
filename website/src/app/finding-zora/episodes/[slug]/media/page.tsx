import Link from "next/link";
import { getEpisodeByNumber, getEpisodeMedia } from "@/lib/queries";
import { MediaGallery } from "@/components/media-gallery";
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
  const photos = media.filter((m) => m.kind === "photo").length;
  const videos = media.filter((m) => m.kind === "video").length;

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
        {ep.location_name} · {photos} photo{photos !== 1 ? "s" : ""} · {videos} video{videos !== 1 ? "s" : ""}
      </p>

      {media.length === 0 ? (
        <p className="text-dawn-mist/40 text-sm">
          No additional media has been attached to this expedition yet.
        </p>
      ) : (
        <MediaGallery
          media={media.map((m) => ({
            id: m.id,
            kind: m.kind,
            url: m.url,
            caption: m.caption,
          }))}
        />
      )}
    </div>
  );
}
