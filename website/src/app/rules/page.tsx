import type { Metadata } from "next";
import { LEVELS, EFFORT_LEVELS } from "@/lib/types";
import {
  Ornament,
  Lore,
  ScoreSection,
  ScoreRow,
} from "@/components/atmosphere";

export const metadata: Metadata = { title: "rules" };

export default function RulesPage() {
  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        how it works
      </h1>
      <p className="text-mist-dim">
        The scoring system, effort rating, leveling, and streaks.
      </p>

      {/* Eos Index */}
      <Ornament label="The Eos Index" />

      <p>
        The <strong>Eos Index</strong> breaks into three components. The sky is
        the dominant factor, but where you stood to watch it, and how hard it was
        to get there, matter too.
      </p>

      <ScoreSection title="Sky · 50 points maximum" color="amber">
        <ScoreRow label="Color intensity" value="/ 20 pts" />
        <ScoreRow label="Cloud engagement" value="/ 15 pts" />
        <ScoreRow label="Horizon definition" value="/ 15 pts" />
      </ScoreSection>

      <ScoreSection title="Setting · 30 points maximum" color="teal">
        <ScoreRow label="Foreground composition" value="/ 15 pts" color="teal" />
        <ScoreRow label="Location uniqueness" value="/ 15 pts" color="teal" />
      </ScoreSection>

      <ScoreSection title="Conditions · 20 points maximum" color="orange">
        <ScoreRow label="Access difficulty" value="/ 10 pts" color="orange" />
        <ScoreRow label="Weather / environmental challenge" value="/ 10 pts" color="orange" />
      </ScoreSection>

      <Lore>
        A perfect sky witnessed from a parking lot will always score lower than a modest sky
        earned at the top of a difficult pre-dawn ascent. The Eos Index measures the sky.
        The Zora Score measures the player.
      </Lore>

      {/* Effort rating */}
      <Ornament label="Effort rating" />

      <p>
        A single post-expedition assessment of the total difficulty of the
        journey. One honest judgment call, 0–20 points.
      </p>

      <div className="bg-pre-dawn-mid border border-rule rounded-md overflow-hidden my-4">
        {EFFORT_LEVELS.map((e) => (
          <div
            key={e.level}
            className="flex items-center justify-between px-5 py-3 border-b border-dawn-mist/[0.05] last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block h-3 w-2 rounded-sm ${
                      i < e.level ? "bg-zora-amber" : "bg-dawn-mist/10"
                    }`}
                  />
                ))}
              </div>
              <span className="font-display text-sm text-dawn-mist">
                {e.label}
              </span>
            </div>
            <span className="font-mono text-sm text-amber-light font-bold">
              {e.points} pts
            </span>
          </div>
        ))}
      </div>

      {/* Zora Score */}
      <Ornament label="The Zora Score" />

      <div className="bg-pre-dawn-light border border-zora-amber rounded-md px-6 py-5 my-4 text-center">
        <p className="font-mono text-[0.6rem] tracking-[0.25em] text-zora-amber uppercase opacity-70 mb-2">
          the master formula
        </p>
        <p className="font-mono text-sm text-dawn-mist leading-relaxed">
          <span className="text-amber-light font-bold">Zora Score</span>
          {" = "}
          <span className="text-teal-light">Eos Index</span>
          {" + Effort + Discovery"}
        </p>
        <p className="font-mono text-[0.7rem] text-mist-dim mt-1">
          No fixed ceiling. The Eos Index caps at 100. Everything else is earned.
        </p>
      </div>

      {/* Level system */}
      <Ornament label="Leveling up" />

      <p>
        Six expeditions per level. Score has no effect on leveling. It drives
        leaderboard position instead. Show up, do the work, level up.
      </p>

      <div className="bg-pre-dawn-mid border border-rule rounded-md overflow-hidden my-4">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="bg-zora-amber/[0.12] border-b border-zora-amber">
              <th className="px-4 py-2.5 text-left text-[0.65rem] tracking-wider text-zora-amber uppercase">
                Level
              </th>
              <th className="px-4 py-2.5 text-left text-[0.65rem] tracking-wider text-zora-amber uppercase">
                Title
              </th>
              <th className="px-4 py-2.5 text-right text-[0.65rem] tracking-wider text-zora-amber uppercase">
                Expeditions
              </th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((l) => (
              <tr
                key={l.level}
                className="border-b border-dawn-mist/[0.05] even:bg-white/[0.02]"
              >
                <td className="px-4 py-2 text-amber-light font-bold">
                  {l.level}
                </td>
                <td className="px-4 py-2 text-dawn-mist">{l.title}</td>
                <td className="px-4 py-2 text-right text-mist-dim">
                  {l.expeditions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Streaks */}
      <Ornament label="Streaks" />

      <p>
        Complete all 6 outings for a level within 6 calendar weeks to earn a
        streak. The medallion gains a sunburst crown and the expedition card
        shows a gold bar. Visual honor only, no bonus points.
      </p>
    </div>
  );
}
