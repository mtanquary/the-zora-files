import type { Metadata } from "next";
import { getComputedRecords } from "@/lib/queries";
import { Ornament } from "@/components/atmosphere";

export const metadata: Metadata = { title: "records" };
export const dynamic = "force-dynamic";

const VALUE_COLORS = {
  teal: "text-teal-light",
  amber: "text-amber-light",
  orange: "text-sunrise-orange",
  mist: "text-dawn-mist",
};

export default async function RecordsPage() {
  const records = await getComputedRecords();

  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        records
      </h1>
      <p className="text-mist-dim">
        All-time bests across every expedition.
      </p>

      <Ornament label="The record board" />

      {records.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((r) => (
            <div
              key={r.category}
              className="bg-pre-dawn-mid border border-rule rounded-md p-5"
            >
              <p className="font-mono text-[0.65rem] tracking-wider text-mist-dim uppercase mb-3">
                {r.category}
              </p>
              <p className={`font-mono text-3xl font-bold ${VALUE_COLORS[r.color]} leading-none mb-2`}>
                {r.value}
              </p>
              <p className="text-xs text-mist-dim/50 italic">
                {r.detail}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-mist-dim">
          No records yet. Complete your first expedition to start the board.
        </p>
      )}
    </div>
  );
}
