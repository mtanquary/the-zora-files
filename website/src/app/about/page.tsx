import type { Metadata } from "next";
import { getEpisodes } from "@/lib/queries";
import { Ornament, Lore, Stars, HorizonGlow } from "@/components/atmosphere";
import { SeasonRecapButton } from "./season-recap-button";

export const metadata: Metadata = { title: "about" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const episodes = await getEpisodes();
  const hasEpisodes = episodes.length >= 3;
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  return (
    <div>
      {/* Header with atmosphere */}
      <section className="relative overflow-hidden px-6 py-20 text-center border-b border-rule">
        <Stars />
        <div className="relative z-10">
          <p className="font-mono text-[0.65rem] tracking-[0.35em] text-zora-amber uppercase opacity-75 mb-4">
            the zora files
          </p>
          <h1
            className="font-display-ornate text-zora-amber font-bold mb-2"
            style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", textShadow: "0 0 50px rgba(240,165,0,0.25)" }}
          >
            About
          </h1>
          <p className="font-display text-dawn-mist text-sm tracking-[0.15em]">
            the concept, the host, the mission
          </p>
        </div>
      </section>

      <div className="max-w-[780px] mx-auto px-8 pb-16">
        <Ornament label="The pursuit" />

        <p>
          The Zora Files is a sunrise-chasing pursuit. Every episode is a scored
          attempt at the perfect dawn. The desert doesn&apos;t care about your
          plan.
        </p>

        <p>
          <strong>Zora</strong> is the Slavic word for dawn. <strong>Eos</strong>{" "}
          is the Greek goddess of dawn. Together they frame the two things this
          show measures: the quality of the sunrise and the full weight of the
          expedition.
        </p>

        <Lore>
          &ldquo;Every dawn is a scored event. Most people sleep through the leaderboard.&rdquo;
        </Lore>

        <Ornament label="The host" />

        <div className="float-right ml-6 mb-4">
          <img
            src="/images/profile-photo-1.jpg"
            alt="The host"
            className="w-40 h-40 rounded-xl object-cover border border-rule"
          />
        </div>

        <p>
          The host is a systems thinker who is allergic to chaos but keeps
          getting surprised by nature, a veteran, technical infrastructure
          consultant, bassoonist, and desert hiker based in the Queen Creek area
          of Arizona. Home base is the Sonoran Desert, but the pursuit goes
          wherever the next scored sunrise leads.
        </p>

        <Ornament label="The mission" />

        <p>
          Every sunrise belongs to someone. This is the record of one
          person&apos;s pursuit of the perfect one, wherever it leads.
        </p>

        <Lore>
          Home base is the Sonoran Desert of Arizona. But Zora does not belong to any single
          landscape. She has been spotted over the Atlantic, above the treeline in the Rockies,
          rising from the sea off coastal cliffs. Wherever dawn breaks, the game is on.
        </Lore>

        {hasApiKey && hasEpisodes && (
          <>
            <Ornament label="Season recap" />
            <SeasonRecapButton season={1} />
          </>
        )}
      </div>
    </div>
  );
}
