import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllDiscoveries, type DiscoveryRow } from "@/lib/queries";
import { ParkHero, HeroTitle, ParkSection, Kicker } from "@/components/park";

export const metadata: Metadata = {
  title: "Field guide",
  description: "Wildlife, plants, landforms, and history met along the trail.",
};
export const dynamic = "force-dynamic";

const SECTIONS: { type: string; title: string; kicker: string }[] = [
  { type: "wildlife", title: "Wildlife", kicker: "Fauna" },
  { type: "plant", title: "Plants", kicker: "Flora" },
  { type: "geographic", title: "Landforms and features", kicker: "Geology and water" },
  { type: "cultural_historical", title: "History and culture", kicker: "Human story" },
];

const METHOD: Record<string, string> = {
  photographed: "Photographed",
  visual: "Seen",
  audio: "Heard",
  visual_and_audio: "Seen and heard",
};

const RARITY: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  very_rare: "Very rare",
  exceptional: "Exceptional",
};

interface Entry {
  name: string;
  type: string;
  scientific_name: string | null;
  rarity_tier: string;
  photo_url: string | null;
  fun_fact: string | null;
  method: string;
  sightings: number;
  places: string[];
}

function buildEntries(rows: (DiscoveryRow & { episode_title?: string })[]): Entry[] {
  const map = new Map<string, Entry>();
  for (const d of rows) {
    const e = map.get(d.name);
    if (e) {
      e.sightings++;
      if (d.photo_url && !e.photo_url) {
        e.photo_url = d.photo_url;
        e.method = "photographed";
      }
      if (!e.fun_fact && d.fun_fact) e.fun_fact = d.fun_fact;
      if (!e.scientific_name && d.scientific_name) e.scientific_name = d.scientific_name;
      if (d.location_name && !e.places.includes(d.location_name)) e.places.push(d.location_name);
    } else {
      map.set(d.name, {
        name: d.name,
        type: d.type,
        scientific_name: d.scientific_name,
        rarity_tier: d.rarity_tier,
        photo_url: d.photo_url,
        fun_fact: d.fun_fact,
        method: d.photo_url ? "photographed" : d.detection_method || "visual",
        sightings: 1,
        places: d.location_name ? [d.location_name] : [],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function TypeGlyph({ type }: { type: string }) {
  const common = {
    width: 56,
    height: 56,
    viewBox: "0 0 52 52",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (type === "plant")
    return (
      <svg {...common}>
        <path d="M26 44 V20" />
        <path d="M26 30 C16 30 12 22 12 14 c8 0 14 6 14 16" />
        <path d="M26 24 C34 24 40 18 40 10 c-8 0 -14 6 -14 14" />
      </svg>
    );
  if (type === "geographic")
    return (
      <svg {...common}>
        <path d="M4 42 L18 18 L26 30 L34 14 L48 42 Z" />
        <path d="M30 22 l4 -8 4 8" />
      </svg>
    );
  if (type === "cultural_historical")
    return (
      <svg {...common}>
        <path d="M8 44 h36 M12 44 V22 M40 44 V22 M20 44 V22 M32 44 V22 M8 22 h36 L26 10 Z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M10 30 c4 -10 14 -14 22 -10 l10 -6 -2 10 c2 8 -4 16 -14 16 -8 0 -14 -4 -16 -10 z" />
      <circle cx="34" cy="24" r="1.5" fill="currentColor" />
    </svg>
  );
}

function GuideCard({ entry }: { entry: Entry }) {
  return (
    <article className="flex overflow-hidden border-[3px] border-ink bg-bone">
      <div className="relative w-[38%] shrink-0 bg-park-paper-3">
        {entry.photo_url ? (
          <Image src={entry.photo_url} alt={entry.name} fill sizes="(min-width: 768px) 200px, 38vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-rhyolite">
            <TypeGlyph type={entry.type} />
            <span className="font-park-sans text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-park-ink-faint">
              No photo yet
            </span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-park-display text-lg font-bold leading-snug text-park-ink">{entry.name}</h3>
          {entry.rarity_tier !== "common" && RARITY[entry.rarity_tier] && (
            <span className="shrink-0 stamp border border-ink px-1.5 py-0.5 text-[0.65rem] text-ink">
              {RARITY[entry.rarity_tier]}
            </span>
          )}
        </div>
        {entry.scientific_name && (
          <p className="text-sm italic text-park-ink-faint">{entry.scientific_name}</p>
        )}
        {entry.fun_fact && (
          <p className="mt-2 line-clamp-4 text-[0.95rem] leading-snug text-park-ink-soft">{entry.fun_fact}</p>
        )}
        <p className="mt-auto pt-3 font-park-sans text-xs text-park-ink-faint">
          {METHOD[entry.method] ?? "Seen"}
          {entry.sightings > 1 && ` · ${entry.sightings} sightings`}
          {entry.places.length > 0 && ` · ${entry.places.slice(0, 2).join(", ")}${entry.places.length > 2 ? "…" : ""}`}
        </p>
      </div>
    </article>
  );
}

export default async function FieldGuidePage() {
  const rows = await getAllDiscoveries();
  const entries = buildEntries(rows);
  const known = new Set(SECTIONS.map((s) => s.type));
  const sections = [
    ...SECTIONS,
    ...(entries.some((e) => !known.has(e.type)) ? [{ type: "__other", title: "Other notes", kicker: "Miscellany" }] : []),
  ];

  return (
    <div className="park">
      <ParkHero size="sm">
        <Kicker tone="amber">Naturalist notes</Kicker>
        <div className="mt-3">
          <HeroTitle size="sm">Field guide</HeroTitle>
        </div>
        <p className="mt-4 max-w-[520px] font-park-sans text-lg text-bone/85">
          Everything met along the trail: the animals, the plants, the
          landforms, and the stories left behind.
        </p>
      </ParkHero>

      {entries.length > 0 && (
        <nav className="mx-auto flex max-w-[1080px] flex-wrap gap-2 px-6 pt-10" aria-label="Field guide sections">
          {sections.map((s) => {
            const n = entries.filter((e) => (s.type === "__other" ? !known.has(e.type) : e.type === s.type)).length;
            if (n === 0) return null;
            return (
              <a
                key={s.type}
                href={`#${s.type}`}
                className="rounded-sm border-2 border-park-ink/25 px-4 py-1.5 font-park-sans text-sm font-semibold text-park-ink-soft transition-colors hover:border-park-forest hover:text-park-forest"
              >
                {s.title} <span className="text-park-ink-faint">· {n}</span>
              </a>
            );
          })}
        </nav>
      )}

      {sections.map((s) => {
        const list = entries.filter((e) => (s.type === "__other" ? !known.has(e.type) : e.type === s.type));
        if (list.length === 0) return null;
        return (
          <div key={s.type} id={s.type} className="scroll-mt-20">
            <ParkSection kicker={s.kicker} title={s.title} className="pb-4">
              <div className="grid gap-4 md:grid-cols-2">
                {list.map((e) => (
                  <GuideCard key={e.name} entry={e} />
                ))}
              </div>
            </ParkSection>
          </div>
        );
      })}

      {entries.length === 0 && (
        <ParkSection title="The guide is empty, for now">
          <p className="text-park-ink-soft">
            Entries appear here as expeditions air. Check back soon.
          </p>
        </ParkSection>
      )}

      <section className="mx-auto max-w-[1080px] px-6 pb-20 pt-10">
        <p className="font-park-sans text-sm text-park-ink-faint">
          Keeping score? The same finds earn points in the{" "}
          <Link href="/finding-zora/discovery-log" className="font-semibold text-park-forest underline decoration-park-amber underline-offset-4">
            Finding Zora discovery log
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
