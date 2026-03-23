import type { DiscoveryRow } from "@/lib/queries";

const RARITY_COLORS: Record<string, string> = {
  common: "text-mist-dim",
  uncommon: "text-teal-light",
  rare: "text-zora-amber",
  very_rare: "text-sunrise-orange",
  exceptional: "text-amber-light",
};

export interface GroupedDiscovery {
  name: string;
  type: string;
  rarity_tier: string;
  points: number;
  photo_url: string | null;
  fun_fact: string | null;
  is_first_unlock: boolean;
  count: number;
  total_points: number;
  episodes: string[];
}

/** Group discoveries by name, merging duplicates into a single card with a count. */
export function groupDiscoveries(
  discoveries: (DiscoveryRow & { episode_title?: string })[]
): GroupedDiscovery[] {
  const map = new Map<string, GroupedDiscovery>();

  for (const d of discoveries) {
    const existing = map.get(d.name);
    if (existing) {
      existing.count++;
      existing.total_points += d.points;
      if (d.is_first_unlock) existing.is_first_unlock = true;
      if (d.episode_title && !existing.episodes.includes(d.episode_title)) {
        existing.episodes.push(d.episode_title);
      }
      // Keep the best photo and fun fact
      if (!existing.photo_url && d.photo_url) existing.photo_url = d.photo_url;
      if (!existing.fun_fact && d.fun_fact) existing.fun_fact = d.fun_fact;
    } else {
      map.set(d.name, {
        name: d.name,
        type: d.type,
        rarity_tier: d.rarity_tier,
        points: d.points,
        photo_url: d.photo_url,
        fun_fact: d.fun_fact,
        is_first_unlock: d.is_first_unlock,
        count: 1,
        total_points: d.points,
        episodes: d.episode_title ? [d.episode_title] : [],
      });
    }
  }

  return Array.from(map.values());
}

export function DiscoveryCard({
  discovery,
  showEpisodes = false,
  showUnlockBadge = false,
}: {
  discovery: GroupedDiscovery;
  showEpisodes?: boolean;
  showUnlockBadge?: boolean;
}) {
  const d = discovery;

  return (
    <div className="bg-pre-dawn-mid border border-rule rounded-md overflow-hidden">
      {d.photo_url && (
        <img
          src={d.photo_url}
          alt={d.name}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="font-display text-sm text-dawn-mist">{d.name}</p>
          <div className="flex items-center gap-2">
            {d.count > 1 && (
              <span className="font-mono text-[0.6rem] bg-pre-dawn-light border border-rule rounded-full px-2 py-0.5 text-mist-dim">
                ×{d.count}
              </span>
            )}
            {showUnlockBadge && d.is_first_unlock && (
              <span className="font-mono text-[0.55rem] text-zora-amber uppercase tracking-wider">
                first unlock
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[0.65rem]">
          <span className="text-mist-dim">
            {d.type.replace("_", " ")}
          </span>
          <span className="text-mist-dim/20">·</span>
          <span className={RARITY_COLORS[d.rarity_tier]}>
            {d.rarity_tier.replace("_", " ")}
          </span>
          <span className="text-mist-dim/20">·</span>
          <span className="text-amber-light font-bold">
            {d.count > 1 ? `${d.total_points} pts total` : `+${d.points} pts`}
          </span>
        </div>
        {showEpisodes && d.episodes.length > 0 && (
          <p className="mt-2 text-[0.65rem] text-mist-dim/50">
            {d.episodes.map((e, i) => (
              <span key={e}>
                {i > 0 && ", "}
                &ldquo;{e}&rdquo;
              </span>
            ))}
          </p>
        )}
        {d.fun_fact && (
          <p className="mt-1 text-xs text-mist-dim italic">{d.fun_fact}</p>
        )}
      </div>
    </div>
  );
}
