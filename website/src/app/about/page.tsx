import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { ParkHero, HeroTitle, ParkSection, Kicker, Wayside, ParkButton, ZoraMark } from "@/components/park";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="park">
      <ParkHero size="sm">
        <Kicker tone="amber">The Zora Files</Kicker>
        <div className="mt-3">
          <HeroTitle size="sm">About</HeroTitle>
        </div>
        <p className="mt-4 max-w-[520px] font-park-sans text-lg text-bone/85">
          What Finding Zora is, who is behind it, and where it goes next.
        </p>
      </ParkHero>

      <ParkSection kicker="The idea" title="Up before the sun">
        <div className="grid gap-10 md:grid-cols-[1fr_300px]">
          <div className="max-w-[640px] space-y-5 text-[1.1rem] leading-relaxed">
            <p>
              <strong>Zora</strong> is Slavic for dawn.{" "}
              <strong>Finding Zora</strong>{" "}is the show: every trip is a hunt
              for the sunrise and the story along the way. The 1916 bridge. The
              toad waiting out drought in a rock crack. The mountain that&apos;s
              secretly a collapsed supervolcano.
            </p>
            <p>
              <strong>The Zora Files</strong> is this site, the record of every
              expedition: the films, the photographs, the field notes, and the data.
              Coordinates, date, first light, and an Eos score for every
              sunrise.
            </p>
            <p>
              It started as a game.{" "}
              <Link href="/finding-zora" className="font-bold text-ink underline decoration-first-light decoration-[3px] underline-offset-[6px]">
                Finding Zora, the game
              </Link>{" "}
              still runs, with its own scoring, discovery log, and ranks, and
              its tools power a lot of what you see here.
            </p>
            <p className="font-park-display text-3xl font-extrabold uppercase leading-none">Zora found.</p>
            <p className="text-muted">That&apos;s the sign-off, the moment the sun clears the horizon.</p>
          </div>
          <div className="self-start border-[3px] border-ink bg-bone">
            <div className="flex items-center gap-3 border-b-[3px] border-ink px-4 py-2.5">
              <ZoraMark size={30} />
              <span className="font-park-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em]">
                The creed
              </span>
            </div>
            <p className="px-5 py-4 font-park-display text-[1.75rem] font-extrabold uppercase leading-none text-ink">
              Up before the sun.
              <span className="mt-1.5 block text-[1.25rem]">Find the story.</span>
            </p>
          </div>
        </div>
      </ParkSection>

      <ParkSection kicker="Your guide" title="The host" className="pt-0">
        <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
          <Image
            src="/images/profile-photo-3.jpg"
            alt="Tank on the trail"
            width={220}
            height={220}
            sizes="220px"
            className="h-[220px] w-[220px] border-[3px] border-ink object-cover shadow-[8px_8px_0_var(--first-light)]"
          />
          <div className="max-w-[640px] space-y-5 text-[1.1rem] leading-relaxed">
            <p>
              Tank here. Veteran, grandpa, infrastructure guy, musician.
              Allergic to chaos, and nature hasn&apos;t gotten the memo.
            </p>
            <p>
              I live in Queen Creek, Arizona, and I&apos;ll drive a long way in
              the dark for a good sunrise.
            </p>
          </div>
        </div>
      </ParkSection>

      <section className="mx-auto max-w-[1080px] px-6 pb-14">
        <Wayside title="Where this is headed">
          <p className="text-lg">
            More trails, more places, and more ways to help the people who go
            looking get out there too.
          </p>
          <p className="text-park-ink-soft">
            Every sunrise belongs to someone. This is the record of mine,
            wherever it leads, and an open invitation to go find your own.
          </p>
        </Wayside>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 pb-20">
        <div className="flex flex-wrap gap-3">
          <ParkButton href="/expeditions">See the expeditions</ParkButton>
          <ParkButton href="https://www.youtube.com/@TheZoraFiles" variant="forest" external>
            ▶ Subscribe on YouTube
          </ParkButton>
        </div>
      </section>
    </div>
  );
}
