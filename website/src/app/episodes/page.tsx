import type { Metadata } from "next";
import Link from "next/link";
import { getEpisodes } from "@/lib/queries";
import { EFFORT_LEVELS } from "@/lib/types";
import { Ornament } from "@/components/atmosphere";

export const metadata: Metadata = { title: "episodes" };
export const dynamic = "force-dynamic";

export default async function EpisodesPage() {
  const episodes = await getEpisodes();

  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        episodes
      </h1>
      <p className="text-mist-dim mb-2">
        Every expedition, scored and archived.
      </p>

      <Ornament label="Archive" />

      {episodes.length > 0 ? (
        <div className="space-y-3">
          {episodes.map((ep) => {
            const effort = EFFORT_LEVELS.find(
              (e) => e.level === ep.effort_rating
            );
            const slug = `s${String(ep.season).padStart(2, "0")}e${String(ep.episode_number).padStart(2, "0")}`;
            return (
              <Link
                key={ep.id}
                href={`/episodes/${slug}`}
                className="flex items-center justify-between bg-pre-dawn-mid border border-rule rounded-md p-5 hover:border-zora-amber/40 transition-colors"
              >
                <div>
                  <p className="font-display text-dawn-mist">
                    S{String(ep.season).padStart(2, "0")}E
                    {String(ep.episode_number).padStart(2, "0")} —{" "}
                    &ldquo;{ep.title}&rdquo;
                  </p>
                  <p className="text-xs text-mist-dim mt-1">
                    {ep.location_name} —{" "}
                    {new Date(ep.shoot_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="font-mono text-[0.6rem] text-mist-dim uppercase">eos</p>
                    <p className="font-mono text-lg text-teal-light">{ep.eos_total}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[0.6rem] text-mist-dim uppercase">effort</p>
                    <p className="text-sunrise-orange text-sm">{effort?.label}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[0.6rem] text-mist-dim uppercase">zora</p>
                    <p className="font-mono text-lg text-amber-light">{ep.zora_score.total}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-mist-dim">
          No episodes published yet. Check back after the first expedition.
        </p>
      )}
    </div>
  );
}
