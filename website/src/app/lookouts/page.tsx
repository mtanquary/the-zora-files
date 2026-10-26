import type { Metadata } from "next";
import { ParkHero, HeroTitle, ParkSection, Kicker, Wayside } from "@/components/park";
import { getStaysWithAvailability, parseKinds, parseRange } from "@/lib/stays/queries";
import { addDaysISO } from "@/lib/stays/release";
import { MAP_KINDS, type StaysResponse } from "@/lib/stays/types";
import { LookoutFinder } from "./lookout-finder";

export const metadata: Metadata = {
  title: "Fire lookouts, cabins & guard stations",
  description:
    "Every rentable fire lookout, public-land cabin, and guard station in the US on one map, with availability for your dates and the release calendar for each.",
};
export const dynamic = "force-dynamic";

export default async function LookoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; nights?: string; type?: string }>;
}) {
  const sp = await searchParams;
  // ?type= only picks the starting filter; every kind loads so the toggle is instant.
  const typeKinds = sp.type ? parseKinds(sp.type) : MAP_KINDS;
  const initialKinds = typeKinds.length === MAP_KINDS.length ? [] : typeKinds;
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
    initial = { ...initial, sites: await getStaysWithAvailability(MAP_KINDS, range) };
  } catch (err) {
    console.error("lookouts page", err);
    loadError = true;
  }

  return (
    <div className="park">
      <ParkHero size="sm">
        <Kicker tone="amber">Lookout finder</Kicker>
        <div className="mt-3">
          <HeroTitle size="sm">Lookouts, cabins &amp; guard stations</HeroTitle>
        </div>
        <p className="mt-4 max-w-[560px] font-park-sans text-lg text-bone/85">
          Every rentable fire lookout, backcountry cabin, and old guard station
          on public land, with open nights for your dates and exactly when the
          rest go on sale.
        </p>
      </ParkHero>

      <ParkSection kicker="Find a night out there" title="The map">
        {loadError ? (
          <p className="text-park-ink-soft">The map couldn&apos;t load right now. Try again shortly.</p>
        ) : (
          <LookoutFinder
            initial={initial}
            initialStart={range?.start ?? ""}
            initialNights={nights}
            initialKinds={initialKinds}
            today={new Date().toISOString().slice(0, 10)}
          />
        )}
      </ParkSection>

      <section className="mx-auto max-w-[1080px] px-6 pb-12">
        <Wayside title="How booking works">
          <p>
            Nearly all of these are federal rentals on Recreation.gov: Forest
            Service lookouts, cabins, and guard stations, plus cabins run by the
            Park Service, BLM, Fish and Wildlife Service, and the Corps of
            Engineers. Each night opens six months ahead at 7:00 a.m. Pacific, and
            the popular ones are gone within minutes. Cancellations do appear,
            which is what the map watches for. Lookouts are checked daily, cabins
            and guard stations every two days.
          </p>
          <p className="text-park-ink-soft">
            A handful of lookouts book elsewhere: a state park system, a phone line
            one day a year, or a host on Airbnb. For those, the map shows the
            release rules instead of live availability. This site never books for
            you, and never logs in anywhere on your behalf.
          </p>
        </Wayside>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 pb-20 font-park-sans text-xs leading-relaxed text-park-ink-faint">
        Rental list compiled with the help of the{" "}
        <a href="https://firelookout.org/resources/rentals/" className="underline" target="_blank" rel="noopener noreferrer">
          Forest Fire Lookout Association
        </a>
        . Facility details, photos, ratings, and availability from Recreation.gov. Cabin seasons
        from the USDA Forest Service. Map data ©{" "}
        <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>{" "}
        contributors, basemap © CARTO. Not affiliated with Recreation.gov or the USDA Forest Service.
      </section>
    </div>
  );
}
