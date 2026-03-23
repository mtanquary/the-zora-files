import type { Metadata } from "next";
import { Ornament } from "@/components/atmosphere";

export const metadata: Metadata = { title: "records" };

export default function RecordsPage() {
  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        records
      </h1>
      <p className="text-mist-dim">
        All-time bests across every expedition.
      </p>

      <Ornament label="The record board" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Highest Eos Index score",
          "Highest Zora Score",
          "Most discoveries in one expedition",
          "Most unusual location",
          "Longest consecutive streak",
          "Total Discovery Log entries",
        ].map((category) => (
          <div
            key={category}
            className="bg-pre-dawn-mid border border-rule rounded-md p-5"
          >
            <p className="font-mono text-[0.65rem] tracking-wider text-mist-dim uppercase mb-2">
              {category}
            </p>
            <p className="font-mono text-2xl text-mist-dim/20">--</p>
          </div>
        ))}
      </div>
    </div>
  );
}
