import type { Metadata } from "next";
import { Ornament, Lore, Stars, HorizonGlow } from "@/components/atmosphere";

export const metadata: Metadata = { title: "about" };
export default function AboutPage() {
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
        <Ornament label="The channel" />

        <p>
          The Zora Files is built on a simple idea: the best things discovered
          in life come through early to rise. The name comes from{" "}
          <strong>Zora</strong>, the Slavic word for dawn.
        </p>

        <p>
          The flagship series is{" "}
          <strong>
            <a href="/finding-zora" className="text-zora-amber hover:text-amber-light transition-colors">
              Finding Zora
            </a>
          </strong>{" "}
          , a sunrise-chasing expedition game with its own scoring system,
          discovery log, and level-up progression. Every episode is a scored
          attempt at the perfect dawn.
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
          The host is a veteran, devoted husband and grandpa, technical
          infrastructure consultant, musician, and desert hiker who is allergic
          to chaos but keeps getting surprised by nature. Based in the Queen Creek area
          of Arizona. Home base is the Sonoran Desert, but the pursuit goes
          wherever the next scored sunrise leads.
        </p>

        <Ornament label="The mission" />

        <p>
          Every sunrise belongs to someone. This is the record of one
          person&apos;s pursuit of the perfect one, wherever it leads.
        </p>

        <Lore>
          Home base is the Sonoran Desert of Arizona. But the pursuit does not
          belong to any single landscape. Wherever dawn breaks, the game is on.
        </Lore>

      </div>
    </div>
  );
}
