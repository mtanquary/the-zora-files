import Link from "next/link";
import { getEpisodes } from "@/lib/queries";
import { LEVELS } from "@/lib/types";
import { LivingCover } from "@/components/living-cover";
import {
  Ornament,
  Lore,
} from "@/components/atmosphere";

export const dynamic = "force-dynamic";

export default async function Home() {
  const episodes = await getEpisodes();
  const totalExpeditions = episodes.length;
  const currentLevel = LEVELS.filter(
    (l) => totalExpeditions >= l.expeditions
  ).pop()!;

  return (
    <div>
      {/* ══ COVER ══ */}
      <LivingCover>
        <div className="max-w-[600px]">
          <h1
            className="font-display-ornate text-zora-amber font-bold leading-none"
            style={{
              fontSize: "clamp(2.4rem, 8vw, 4.5rem)",
              textShadow: "0 0 70px rgba(240,165,0,0.35)",
            }}
          >
            The Zora Files
          </h1>
          <p className="font-display text-dawn-mist text-sm tracking-[0.15em] mt-2">
            early to rise
          </p>
        </div>
      </LivingCover>

      {/* Subtext overlaps into the landscape feel */}
      <div className="text-center px-6 py-8 -mt-2">
        <p className="italic text-mist-dim text-lg leading-relaxed max-w-md mx-auto">
          The best things discovered in life come through early to rise.
        </p>
      </div>

      {/* ══ CONTENT ══ */}
      <div className="max-w-[780px] mx-auto px-8 pb-16">
        {/* Flagship series: Finding Zora */}
        <Ornament label="Flagship series" />

        <Link
          href="/finding-zora"
          className="block bg-pre-dawn-mid border border-rule rounded-md overflow-hidden hover:border-zora-amber/40 transition-colors"
        >
          <div className="p-6">
            <p className="font-mono text-[0.6rem] tracking-[0.2em] text-mist-dim uppercase mb-2">
              now airing
            </p>
            <h2
              className="font-display-ornate text-zora-amber font-bold leading-none mb-2"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)" }}
            >
              Finding Zora
            </h2>
            <p className="font-display text-dawn-mist text-sm tracking-[0.1em] mb-4">
              the pursuit of the perfect sunrise
            </p>
            <p className="text-mist-dim">
              Every sunrise gets scored. A game played before most people wake up
              scored by sky quality, discovery, and the effort to get there.
              {totalExpeditions > 0 && (
                <> {totalExpeditions} expedition{totalExpeditions !== 1 ? "s" : ""} logged.
                Level {currentLevel.level} · {currentLevel.title}.</>
              )}
            </p>
            <p className="font-mono text-xs text-zora-amber mt-4 tracking-wider">
              enter →
            </p>
          </div>
        </Link>

        {/* Future series placeholder */}
        <Ornament label="The philosophy" />

        <Lore>
          The best discoveries happen before the world wakes up. Early to rise
          isn&apos;t a discipline. It&apos;s an unfair advantage. The Zora Files is a
          collection of pursuits that prove it.
        </Lore>

        <p className="text-mist-dim mt-4">
          <strong>Finding Zora</strong> is the flagship series, a sunrise-chasing
          expedition series with its own scoring system, discovery log, and
          level-up progression. More series may follow as the pursuit expands.
        </p>

        {/* Subscribe CTA */}
        <div className="bg-pre-dawn-mid border border-rule rounded-lg p-8 mt-12 text-center">
          <p className="font-display text-lg text-zora-amber mb-3">
            Follow the pursuit
          </p>
          <p className="text-mist-dim mb-5">
            Season one of Finding Zora begins soon.
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
