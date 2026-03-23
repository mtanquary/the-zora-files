import type { Metadata } from "next";
import { Ornament } from "@/components/atmosphere";

export const metadata: Metadata = { title: "discovery log" };

export default function DiscoveryLogPage() {
  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        discovery log
      </h1>
      <p className="text-mist-dim">
        Every species, feature, and landmark encountered across all expeditions.
      </p>

      <Ornament label="Unlocks" />

      <p className="text-mist-dim">
        No discoveries logged yet. First unlocks earn bonus points — the log
        accumulates over the life of the series and becomes its own documentary
        record.
      </p>
    </div>
  );
}
