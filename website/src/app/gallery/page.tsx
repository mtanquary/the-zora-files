import type { Metadata } from "next";
import { getAiredEpisodePhotos } from "@/lib/queries";
import { getArchiveEntries, archiveImageUrl } from "@/lib/archives";
import { ParkHero, HeroTitle, ParkSection, Kicker, episodeSlug, formatLongDate } from "@/components/park";
import { ParkGallery, type GalleryItem } from "./park-gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Sunrise and trail photography from The Zora Files.",
};
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  let episodePhotos: Awaited<ReturnType<typeof getAiredEpisodePhotos>> = [];
  try {
    episodePhotos = await getAiredEpisodePhotos();
  } catch {
    // Media table missing or DB unreachable: the archive still renders.
  }
  const archives = getArchiveEntries();

  const items: GalleryItem[] = [
    ...episodePhotos.map((p) => ({
      key: `ep-${p.id}`,
      src: p.url,
      caption: p.caption,
      place: p.location_name,
      date: formatLongDate(p.shoot_date),
      source: "expedition" as const,
      href: `/finding-zora/episodes/${episodeSlug(p.season, p.episode_number)}`,
    })),
    ...archives.map((a) => ({
      key: `ar-${a.filename}`,
      src: archiveImageUrl(a),
      caption: a.caption ?? null,
      alt: a.caption ?? a.vibe ?? undefined,
      place: a.location_name,
      date: a.taken_at ? formatLongDate(a.taken_at) : null,
      source: "archive" as const,
      eos: a.scores.eos_total,
      width: a.width,
      height: a.height,
    })),
  ];

  return (
    <div className="park">
      <ParkHero size="sm">
        <Kicker tone="amber">Field photography</Kicker>
        <div className="mt-3">
          <HeroTitle size="sm">Gallery</HeroTitle>
        </div>
        <p className="mt-4 max-w-[520px] font-park-sans text-lg text-bone/85">
          What the first light looked like, wherever I happened to be standing.
        </p>
      </ParkHero>

      <ParkSection
        kicker={`${items.length} photograph${items.length === 1 ? "" : "s"}`}
        title="From the field"
      >
        {items.length > 0 ? (
          <ParkGallery items={items} />
        ) : (
          <p className="text-park-ink-soft">The first photographs are still drying.</p>
        )}
      </ParkSection>
    </div>
  );
}
