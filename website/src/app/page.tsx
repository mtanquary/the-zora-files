import Link from "next/link";
import { getEpisodes, getAllDiscoveries } from "@/lib/queries";
import { extractEosSub } from "@/lib/eos-helpers";
import { groupDiscoveries } from "@/components/discovery-card";
import { EFFORT_LEVELS, LEVELS } from "@/lib/types";
import { LevelEmblem } from "@/components/level-emblem";
import { MedallionEmblem } from "@/components/medallion-emblem";
import { EosExpandable } from "@/components/eos-expandable";
import { ZoraExpandable } from "@/components/zora-expandable";
import { LivingCover } from "@/components/living-cover";
import {
  SunIcon,
  Ornament,
  Lore,
} from "@/components/atmosphere";

export const dynamic = "force-dynamic";

export default async function Home() {
  const episodes = await getEpisodes();
  const latest = episodes[0] ?? null;
  const totalExpeditions = episodes.length;
  const currentLevel = LEVELS.filter(
    (l) => totalExpeditions >= l.expeditions
  ).pop()!;
  const nextLevel = LEVELS.find((l) => l.expeditions > totalExpeditions);
  const gemsInCurrentLevel = nextLevel
    ? totalExpeditions - currentLevel.expeditions
    : 6;

  return (
    <div>
      {/* ══ COVER ══ */}
      <LivingCover>
        <div className="max-w-[600px]">
          <p className="font-mono text-[0.65rem] tracking-[0.35em] text-zora-amber uppercase opacity-75 mb-6">
            the zora files presents
          </p>

          <SunIcon />

          <p className="font-display-ornate text-mist-dim text-sm tracking-[0.2em] mt-5 mb-1">
            the zora files
          </p>
          <h1
            className="font-display-ornate text-zora-amber font-bold leading-none mb-1"
            style={{
              fontSize: "clamp(2.8rem, 9vw, 5.5rem)",
              textShadow: "0 0 70px rgba(240,165,0,0.35)",
            }}
          >
            Finding
            <br />
            Zora
          </h1>
          <p className="font-display text-dawn-mist text-sm tracking-[0.15em] mb-8">
            the pursuit of the perfect sunrise
          </p>

          <div className="ornament-rule w-40 mx-auto mb-6" />

          {latest ? (
            <div className="mb-8">
              <p className="italic text-mist-dim text-lg leading-relaxed max-w-md mx-auto">
                {totalExpeditions} expedition{totalExpeditions !== 1 ? "s" : ""}{" "}
                scored. The leaderboard is live.
              </p>
            </div>
          ) : (
            <p className="italic text-mist-dim text-lg leading-relaxed max-w-md mx-auto mb-8">
              A game played before most people wake up.
              <br />
              Scored by sky quality, discovery, and the audacity
              <br />
              to show up somewhere difficult in the dark.
            </p>
          )}

          <span className="inline-block font-mono text-[0.6rem] tracking-[0.2em] text-zora-amber border border-zora-amber/30 px-4 py-1.5 rounded-sm uppercase opacity-70">
            Season one · the zora files
          </span>
        </div>
      </LivingCover>

      {/* ══ CONTENT ══ */}
      <div className="max-w-[780px] mx-auto px-8 pb-16">
        {/* Latest expedition */}
        {latest && (
          <>
            <Ornament label="Latest expedition" />

            <Link
              href={`/episodes/s${String(latest.season).padStart(2, "0")}e${String(latest.episode_number).padStart(2, "0")}`}
              className="block bg-pre-dawn-mid border border-rule rounded-md overflow-hidden hover:border-zora-amber/40 transition-colors"
            >
              {latest.thumbnail_url && (
                <img
                  src={latest.thumbnail_url}
                  alt={`Sunrise at ${latest.location_name}`}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5">
                <p className="font-mono text-[0.65rem] tracking-[0.1em] text-mist-dim uppercase mb-1">
                  S{String(latest.season).padStart(2, "0")}E
                  {String(latest.episode_number).padStart(2, "0")}
                </p>
                <p className="font-display text-lg text-amber-light">
                  &ldquo;{latest.title}&rdquo;
                </p>
                <p className="text-mist-dim text-sm mb-4">
                  {latest.location_name}
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-pre-dawn-light border border-rule rounded px-3 py-2 flex flex-col items-center">
                    <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider mb-1">
                      eos index
                    </p>
                    <EosExpandable
                      total={latest.eos_total}
                      sub={extractEosSub(latest.eos_index)}
                      size="lg"
                    />
                  </div>
                  <div className="bg-pre-dawn-light border border-rule rounded px-3 py-2 text-center">
                    <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider mb-1">
                      effort
                    </p>
                    <p className="font-mono text-2xl font-bold text-sunrise-orange">
                      {latest.effort_points}
                    </p>
                  </div>
                  <div className="bg-pre-dawn-light border border-rule rounded px-3 py-2 flex flex-col items-center">
                    <p className="font-mono text-[0.6rem] text-mist-dim uppercase tracking-wider mb-1">
                      zora score
                    </p>
                    <ZoraExpandable
                      total={latest.zora_score.total}
                      eosIndex={latest.zora_score.eos_index}
                      effortPoints={latest.zora_score.effort_points}
                      effortLabel={EFFORT_LEVELS.find((e) => e.level === latest.effort_rating)?.label || ""}
                      discoveryPoints={latest.zora_score.discovery_points}
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </>
        )}

        {/* Medal cabinet */}
        <Ornament label="Medal cabinet" />

        <div className="bg-pre-dawn-mid border border-rule rounded-md p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
            {LEVELS.map((l) => {
              const earned =
                totalExpeditions >= l.expeditions && l.level > 0;
              const isNext = nextLevel && l.level === nextLevel.level;
              const isCurrentRank = l.level === currentLevel.level;
              const gemsForThis = isNext
                ? gemsInCurrentLevel
                : earned
                  ? 6
                  : 0;
              const show = l.level === 0 || earned || isNext;
              if (!show) return null;

              return (
                <div key={l.level} className="flex flex-col items-center gap-2">
                  {l.level === 0 ? (
                    <div
                      className={`${isCurrentRank ? "ring-2 ring-zora-amber/40 rounded-full" : ""}`}
                    >
                      <LevelEmblem level={0} size={72} />
                    </div>
                  ) : (
                    <div
                      className={`${isNext && !earned ? "ring-2 ring-zora-amber/30 rounded-full" : ""}`}
                    >
                      <MedallionEmblem
                        level={l.level}
                        gems={gemsForThis}
                        size={72}
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <p
                      className={`font-display text-[0.65rem] tracking-wider ${
                        isCurrentRank
                          ? "text-zora-amber"
                          : earned
                            ? "text-dawn-mist"
                            : "text-mist-dim/50"
                      }`}
                    >
                      {l.title}
                    </p>
                    {isCurrentRank && l.level === 0 && (
                      <p className="font-mono text-[0.55rem] text-zora-amber/60">
                        current
                      </p>
                    )}
                    {isNext && !earned && (
                      <p className="font-mono text-[0.55rem] text-mist-dim">
                        {gemsInCurrentLevel}/6
                      </p>
                    )}
                    {earned && l.level > 0 && (
                      <p className="font-mono text-[0.55rem] text-mist-dim/40">
                        earned
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {nextLevel && LEVELS[nextLevel.level + 1] && (
              <div className="flex flex-col items-center gap-2 opacity-20">
                <MedallionEmblem
                  level={nextLevel.level + 1}
                  gems={0}
                  size={72}
                />
                <p className="font-display text-[0.65rem] text-mist-dim/30">
                  {LEVELS[nextLevel.level + 1].title}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent episodes */}
        {episodes.length > 0 && (
          <>
            <Ornament label="Recent episodes" />

            <div className="space-y-3">
              {episodes.slice(0, 3).map((ep) => {
                const effort = EFFORT_LEVELS.find(
                  (e) => e.level === ep.effort_rating
                );
                return (
                  <Link
                    key={ep.id}
                    href={`/episodes/s${String(ep.season).padStart(2, "0")}e${String(ep.episode_number).padStart(2, "0")}`}
                    className="flex items-center justify-between bg-pre-dawn-mid border border-rule rounded-md p-4 hover:border-zora-amber/40 transition-colors"
                  >
                    <div>
                      <p className="font-display text-sm text-dawn-mist">
                        S{String(ep.season).padStart(2, "0")}E
                        {String(ep.episode_number).padStart(2, "0")} ·{" "}
                        &ldquo;{ep.title}&rdquo;
                      </p>
                      <p className="text-xs text-mist-dim">
                        {ep.location_name}
                      </p>
                    </div>
                    <div className="flex gap-6 text-right items-start">
                      <div>
                        <p className="font-mono text-[0.6rem] text-mist-dim uppercase">
                          eos
                        </p>
                        <EosExpandable
                          total={ep.eos_total}
                          sub={extractEosSub(ep.eos_index)}
                        />
                      </div>
                      <div>
                        <p className="font-mono text-[0.6rem] text-mist-dim uppercase">
                          effort
                        </p>
                        <p className="text-sunrise-orange text-sm">
                          {effort?.label}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[0.6rem] text-mist-dim uppercase">
                          zora
                        </p>
                        <ZoraExpandable
                          total={ep.zora_score.total}
                          eosIndex={ep.zora_score.eos_index}
                          effortPoints={ep.zora_score.effort_points}
                          effortLabel={effort?.label || ""}
                          discoveryPoints={ep.zora_score.discovery_points}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Discovery log preview */}
        <DiscoveryPreview />

        {/* Subscribe CTA - rendered below DiscoveryPreview */}
        <div className="bg-pre-dawn-mid border border-rule rounded-lg p-8 mt-12 text-center">
          <p className="font-display text-lg text-zora-amber mb-3">
            Follow the pursuit
          </p>
          <p className="text-mist-dim mb-5">
            Season one begins soon. The leaderboard starts at zero.
          </p>
          <p className="font-mono text-sm text-amber-light tracking-wider mb-3">
            thezorafiles.com
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <span className="font-mono text-xs text-mist-dim tracking-wider">
              YouTube · @TheZoraFiles
            </span>
            <span className="font-mono text-xs text-mist-dim tracking-wider">
              Instagram · @thezorafiles
            </span>
            <span className="font-mono text-xs text-mist-dim tracking-wider">
              TikTok · @thezorafiles
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-mist-dim",
  uncommon: "text-teal-light",
  rare: "text-zora-amber",
  very_rare: "text-sunrise-orange",
  exceptional: "text-amber-light",
};

async function DiscoveryPreview() {
  const discoveries = await getAllDiscoveries();
  const grouped = groupDiscoveries(discoveries);
  const limit = 6;

  return (
    <>
      <Ornament label="Discovery log" />
      {grouped.length > 0 ? (
        <div className="bg-pre-dawn-mid border border-rule rounded-md">
          {grouped.slice(0, limit).map((d, i) => (
            <div
              key={d.name}
              className={`flex items-center justify-between px-5 py-3 ${
                i < Math.min(grouped.length, limit) - 1
                  ? "border-b border-dawn-mist/[0.05]"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-[0.6rem] uppercase tracking-wider w-16 ${
                    RARITY_COLORS[d.rarity_tier]
                  }`}
                >
                  {d.rarity_tier.replace("_", " ")}
                </span>
                <span className="font-display text-sm text-dawn-mist">
                  {d.name}
                </span>
                {d.count > 1 && (
                  <span className="font-mono text-[0.6rem] text-mist-dim/40">
                    ×{d.count}
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-amber-light">
                +{d.total_points}
              </span>
            </div>
          ))}
          {grouped.length > limit && (
            <Link
              href="/discovery-log"
              className="block text-center py-3 border-t border-dawn-mist/[0.05] font-mono text-xs text-zora-amber hover:text-amber-light transition-colors"
            >
              view all {grouped.length} discoveries →
            </Link>
          )}
        </div>
      ) : (
        <p className="text-mist-dim">
          No discoveries yet. Species, features, and landmarks unlock as
          expeditions happen.
        </p>
      )}
    </>
  );
}
