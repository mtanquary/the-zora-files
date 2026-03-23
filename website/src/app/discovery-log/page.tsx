import type { Metadata } from "next";
import { getAllDiscoveries } from "@/lib/queries";
import { Ornament } from "@/components/atmosphere";
import { DiscoveryCard, groupDiscoveries } from "@/components/discovery-card";

export const metadata: Metadata = { title: "discovery log" };
export const dynamic = "force-dynamic";

export default async function DiscoveryLogPage() {
  const discoveries = await getAllDiscoveries();
  const grouped = groupDiscoveries(discoveries);
  const totalPoints = discoveries.reduce((sum, d) => sum + d.points, 0);
  const firstUnlocks = grouped.filter((d) => d.is_first_unlock).length;

  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        discovery log
      </h1>
      <p className="text-mist-dim">
        Every species, feature, and landmark encountered across all expeditions.
      </p>

      {grouped.length > 0 && (
        <div className="flex gap-6 mt-4 font-mono text-xs">
          <span className="text-dawn-mist">
            {grouped.length} species
          </span>
          <span className="text-amber-light">{totalPoints} total pts</span>
          {discoveries.length > grouped.length && (
            <span className="text-mist-dim">
              {discoveries.length} total sightings
            </span>
          )}
        </div>
      )}

      <Ornament label="Unlocks" />

      {grouped.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {grouped.map((d) => (
            <DiscoveryCard key={d.name} discovery={d} showEpisodes />
          ))}
        </div>
      ) : (
        <p className="text-mist-dim">
          No discoveries logged yet. First unlocks earn bonus points. The log
          accumulates over the life of the series and becomes its own documentary
          record.
        </p>
      )}
    </div>
  );
}
