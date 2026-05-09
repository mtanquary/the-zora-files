import type { Metadata } from "next";
import { getMapData } from "@/lib/queries";
import { ExpeditionMap } from "@/components/expedition-map";
import { Ornament } from "@/components/atmosphere";

export const metadata: Metadata = { title: "expedition map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const expeditions = await getMapData();
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;

  const countries = new Set(expeditions.map((e) => e.country));
  const totalDiscoveries = expeditions.reduce(
    (n, e) => n + e.discoveries.length,
    0
  );

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        the map
      </h1>
      <p className="text-mist-dim mb-2">
        Every scored expedition pinned. Filter by what was found there.
      </p>

      <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.65rem] tracking-wider uppercase text-mist-dim mb-2">
        <span>
          <span className="text-zora-amber">{expeditions.length}</span>{" "}
          expedition{expeditions.length !== 1 ? "s" : ""}
        </span>
        <span>
          <span className="text-zora-amber">{countries.size}</span> countr
          {countries.size !== 1 ? "ies" : "y"}
        </span>
        <span>
          <span className="text-zora-amber">{totalDiscoveries}</span> discover
          {totalDiscoveries !== 1 ? "ies" : "y"} logged
        </span>
      </div>

      <Ornament label="World atlas" />

      {expeditions.length === 0 ? (
        <div className="bg-pre-dawn-mid border border-rule rounded-md p-10 text-center">
          <p className="text-mist-dim">
            No expeditions logged yet. The map fills in once the first
            expedition is scored.
          </p>
        </div>
      ) : (
        <ExpeditionMap expeditions={expeditions} token={token} />
      )}
    </div>
  );
}
