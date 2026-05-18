"use client";

import { useCallback, useState } from "react";
import { DiscoveryCard, type GroupedDiscovery } from "./discovery-card";
import { Lightbox, type GalleryItem } from "./media-gallery";

interface DiscoveriesGridProps {
  discoveries: GroupedDiscovery[];
  showEpisodes?: boolean;
  showUnlockBadge?: boolean;
}

export function DiscoveriesGrid({
  discoveries,
  showEpisodes = false,
  showUnlockBadge = false,
}: DiscoveriesGridProps) {
  // Only photographed discoveries are clickable; lightbox prev/next walks
  // through just those.
  const photographed = discoveries.filter((d) => d.photo_url);
  const photoItems: GalleryItem[] = photographed.map((d) => ({
    id: d.name,
    kind: "photo",
    url: d.photo_url!,
    caption:
      d.fun_fact && d.fun_fact.trim()
        ? `${d.name} · ${d.fun_fact}`
        : d.name,
  }));

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const goPrev = useCallback(
    () =>
      setOpenIndex((i) =>
        i == null ? null : (i - 1 + photoItems.length) % photoItems.length
      ),
    [photoItems.length]
  );
  const goNext = useCallback(
    () =>
      setOpenIndex((i) =>
        i == null ? null : (i + 1) % photoItems.length
      ),
    [photoItems.length]
  );

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {discoveries.map((d) => {
          const photoIdx = d.photo_url
            ? photographed.findIndex((p) => p.name === d.name)
            : -1;
          if (photoIdx >= 0) {
            return (
              <button
                key={d.name}
                type="button"
                onClick={() => setOpenIndex(photoIdx)}
                aria-label={`View full photo of ${d.name}`}
                className="text-left rounded-md overflow-hidden ring-0 hover:ring-1 hover:ring-zora-amber/40 focus:outline-none focus:ring-1 focus:ring-zora-amber/60 transition-shadow"
              >
                <DiscoveryCard
                  discovery={d}
                  showEpisodes={showEpisodes}
                  showUnlockBadge={showUnlockBadge}
                />
              </button>
            );
          }
          return (
            <DiscoveryCard
              key={d.name}
              discovery={d}
              showEpisodes={showEpisodes}
              showUnlockBadge={showUnlockBadge}
            />
          );
        })}
      </div>

      {openIndex !== null && (
        <Lightbox
          item={photoItems[openIndex]}
          index={openIndex}
          total={photoItems.length}
          onClose={close}
          onPrev={photoItems.length > 1 ? goPrev : undefined}
          onNext={photoItems.length > 1 ? goNext : undefined}
        />
      )}
    </>
  );
}
