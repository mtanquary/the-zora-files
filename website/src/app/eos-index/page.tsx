import type { Metadata } from "next";
import { getEpisodesSortedByEos } from "@/lib/queries";
import { EFFORT_LEVELS } from "@/lib/types";
import { Ornament } from "@/components/atmosphere";

export const metadata: Metadata = { title: "eos index" };
export const dynamic = "force-dynamic";

export default async function EosIndexPage() {
  const episodes = await getEpisodesSortedByEos();

  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-teal-light mb-2">
        eos index
      </h1>
      <p className="text-mist-dim mb-2">
        Leaderboard of every scored sunrise.
      </p>

      <Ornament label="Leaderboard" />

      <div className="bg-pre-dawn-mid border border-rule rounded-md overflow-hidden">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="bg-zora-amber/[0.12] border-b border-zora-amber">
              <th className="px-4 py-3 text-left text-[0.65rem] tracking-wider text-zora-amber uppercase">
                #
              </th>
              <th className="px-4 py-3 text-left text-[0.65rem] tracking-wider text-zora-amber uppercase">
                episode
              </th>
              <th className="px-4 py-3 text-left text-[0.65rem] tracking-wider text-zora-amber uppercase">
                location
              </th>
              <th className="px-4 py-3 text-right text-[0.65rem] tracking-wider text-zora-amber uppercase">
                eos
              </th>
              <th className="px-4 py-3 text-right text-[0.65rem] tracking-wider text-zora-amber uppercase">
                effort
              </th>
              <th className="px-4 py-3 text-right text-[0.65rem] tracking-wider text-zora-amber uppercase">
                zora
              </th>
            </tr>
          </thead>
          <tbody>
            {episodes.length > 0 ? (
              episodes.map((ep, i) => {
                const effort = EFFORT_LEVELS.find(
                  (e) => e.level === ep.effort_rating
                );
                return (
                  <tr
                    key={ep.id}
                    className="border-b border-dawn-mist/[0.05] even:bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-2.5 text-mist-dim">{i + 1}</td>
                    <td className="px-4 py-2.5 text-dawn-mist">
                      S{String(ep.season).padStart(2, "0")}E
                      {String(ep.episode_number).padStart(2, "0")} —{" "}
                      &ldquo;{ep.title}&rdquo;
                    </td>
                    <td className="px-4 py-2.5 text-mist-dim">
                      {ep.location_name}
                    </td>
                    <td className="px-4 py-2.5 text-right text-teal-light font-bold">
                      {ep.eos_total}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sunrise-orange">
                      {effort?.label}
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-light font-bold">
                      {ep.zora_score.total}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-mist-dim"
                >
                  No scored expeditions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
