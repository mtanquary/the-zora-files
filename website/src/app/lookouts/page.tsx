import type { Metadata } from "next";
import { ParkHero, HeroTitle, ParkSection, Kicker, Wayside } from "@/components/park";
import { getStaysWithAvailability, parseRange } from "@/lib/stays/queries";
import { addDaysISO } from "@/lib/stays/release";
import type { StaysResponse } from "@/lib/stays/types";
import { LookoutFinder } from "./lookout-finder";

export const metadata: Metadata = {
  title: "Fire lookouts",
  description:
    "Every rentable fire lookout in the US on one map, with availability for your dates and the release calendar for each.",
};
export const dynamic = "force-dynamic";

export default async function LookoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; nights?: string }>;
}) {
  const sp = await searchParams;
  const nights = Math.min(Math.max(Number(sp.nights) || 2, 1), 14);
  let range: { start: string; end: string } | null = null;
  try {
    range = sp.start ? parseRange(sp.start, addDaysISO(sp.start, nights)) : null;
  } catch {
    range = null;
  }

  let initial: StaysResponse = { generated_at: new Date().toISOString(), range, sites: [] };
  let loadError = false;
  try {
    initial = { ...initial, sites: await getStaysWithAvailability("lookout", range) };
  } catch (err) {
    console.error("lookouts page", err);
    loadError = true;
  }

  return (
    <div className="park">
      <ParkHero size="sm">
        <Kicker tone="amber">Lookout finder</Kicker>
        <div className="mt-3">
          <HeroTitle size="sm">Fire lookouts</HeroTitle>
        </div>
        <p className="mt-4 max-w-[560px] font-park-sans text-lg text-bone/85">
          Every rentable fire lookout in the country, with open nights for your
          dates and exactly when the rest go on sale.
        </p>
      </ParkHero>

      <ParkSection kicker="Find a night in the sky" title="The lookout map">
        {loadError ? (
          <p className="text-park-ink-soft">The lookout list couldn&apos;t load right now. Try again shortly.</p>
        ) : (
          <LookoutFinder
            initial={initial}
            initialStart={range?.start ?? ""}
            initialNights={nights}
            today={new Date().toISOString().slice(0, 10)}
          />
        )}
      </ParkSection>

      <section className="mx-auto max-w-[1080px] px-6 pb-12">
        <Wayside title="How lookout booking works">
          <p>
            Most lookouts are Forest Service rentals on Recreation.gov. Each night
            opens six months ahead at 7:00 a.m. Pacific, and the popular ones are
            gone within minutes. Cancellations do appear, which is what the map
            watches for.
          </p>
          <p className="text-park-ink-soft">
            A handful book elsewhere: a state park system, a phone line one day a
            year, or a host on Airbnb. For those, the map shows the release rules
            instead of live availability. This site never books for you, and never logs
            in anywhere on your behalf.
          </p>
        </Wayside>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 pb-20 font-park-sans text-xs leading-relaxed text-park-ink-faint">
        Rental list compiled with the help of the{" "}
        <a href="https://firelookout.org/resources/rentals/" className="underline" target="_blank" rel="noopener noreferrer">
          Forest Fire Lookout Association
        </a>
        . Facility details, ratings, and availability from Recreation.gov. Map data ©{" "}
        <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>{" "}
        contributors, basemap © CARTO. Not affiliated with Recreation.gov or the USDA Forest Service.
      </section>
    </div>
  );
}
