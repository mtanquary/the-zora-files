import type { MetadataRoute } from "next";
import { getEpisodes } from "@/lib/queries";
import { isAired } from "@/lib/airing";
import { episodeSlug, dateKey } from "@/components/park";

const BASE = "https://thezorafiles.com";

// Rebuilt at most once an hour so new episodes show up without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/lookouts`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/expeditions`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/gallery`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/field-guide`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/finding-zora`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/finding-zora/episodes`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/finding-zora/map`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/finding-zora/eos-index`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE}/finding-zora/discovery-log`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE}/finding-zora/records`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE}/finding-zora/archives`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/finding-zora/rules`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Aired episodes only: upcoming ones stay out of search until they premiere.
  let episodes: MetadataRoute.Sitemap = [];
  try {
    episodes = (await getEpisodes())
      .filter((e) => isAired(e.publish_date))
      .map((e) => ({
        url: `${BASE}/finding-zora/episodes/${episodeSlug(e.season, e.episode_number)}`,
        lastModified: dateKey(e.publish_date),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
  } catch {
    // Database unreachable: still serve the static pages.
  }

  return [...pages, ...episodes];
}
