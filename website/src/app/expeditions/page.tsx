import type { Metadata } from "next";
import { getEpisodes } from "@/lib/queries";
import { isAired } from "@/lib/airing";
import { ParkHero, HeroTitle, ParkSection, Kicker, ParkButton, dateKey } from "@/components/park";
import { ParkExpeditionCard } from "@/components/park-expedition-card";

export const metadata: Metadata = {
  title: "Expeditions",
  description: "Every sunrise hike from The Zora Files, with trail facts, field notes, and the film.",
};
export const dynamic = "force-dynamic";

export default async function ExpeditionsPage() {
  const episodes = await getEpisodes();
  const aired = episodes.filter((e) => isAired(e.publish_date));
  const upcoming = episodes
    .filter((e) => !isAired(e.publish_date))
    .sort((a, b) => dateKey(a.publish_date).localeCompare(dateKey(b.publish_date)));
  const [featured, ...rest] = aired;

  return (
    <div className="park">
      <ParkHero size="sm">
        <Kicker tone="amber">Trail journal</Kicker>
        <div className="mt-3">
          <HeroTitle size="sm">Expeditions</HeroTitle>
        </div>
        <p className="mt-4 max-w-[520px] font-park-sans text-lg text-bone/85">
          Every sunrise hike, from the trailhead in the dark to the light at
          the top.
        </p>
      </ParkHero>

      {featured && (
        <ParkSection kicker="Most recent" title="Latest expedition">
          <ParkExpeditionCard episode={featured} featured />
        </ParkSection>
      )}

      {upcoming.length > 0 && (
        <ParkSection kicker="On the schedule" title="Coming up" className="pt-0">
          <div className="grid gap-6 md:grid-cols-3">
            {upcoming.map((ep) => (
              <ParkExpeditionCard key={ep.id} episode={ep} />
            ))}
          </div>
        </ParkSection>
      )}

      {rest.length > 0 && (
        <ParkSection
          kicker="The archive"
          title="Earlier expeditions"
          action={{ href: "/finding-zora/map", label: "See them on the map" }}
          className="pt-0"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((ep) => (
              <ParkExpeditionCard key={ep.id} episode={ep} />
            ))}
          </div>
        </ParkSection>
      )}

      {episodes.length === 0 && (
        <ParkSection title="The trail starts soon">
          <p className="text-park-ink-soft">
            No expeditions are published yet. Check back after the first one.
          </p>
        </ParkSection>
      )}

      <section className="mx-auto max-w-[1080px] px-6 pb-20">
        <div className="flex flex-col items-start gap-4 rounded-sm bg-park-forest p-8 text-park-paper md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-park-display text-2xl font-bold">Want the scorecards?</p>
            <p className="mt-1 font-park-sans text-park-paper/75">
              Every expedition is also an episode of Finding Zora, the sunrise
              game, with a full Eos index breakdown.
            </p>
          </div>
          <ParkButton href="/finding-zora/episodes">Scored episodes</ParkButton>
        </div>
      </section>
    </div>
  );
}
