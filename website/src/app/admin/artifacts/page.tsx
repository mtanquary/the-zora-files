import type { Metadata } from "next";
import { Ornament } from "@/components/atmosphere";

export const metadata: Metadata = { title: "artifact demos" };

const ARTIFACTS = [
  {
    file: "scout_medallion.html",
    title: "Scout medallion",
    level: 0,
    metal: "Brushed pewter",
    gem: "None",
    description: "Starting token. Compass rose emblem, no gem slots. Static render.",
  },
  {
    file: "trailhead_medallion.html",
    title: "Trailhead medallion",
    level: 1,
    metal: "Copper",
    gem: "Rose quartz (blush pink)",
    description: "First earned medallion. Cairn emblem. Interactive: place gems, trigger streak crown, full audio.",
  },
  {
    file: "desert_fox_medallion.html",
    title: "Desert Fox medallion",
    level: 2,
    metal: "Warm bronze",
    gem: "Amber topaz",
    description: "Fox head silhouette emblem. Established the visual design system for all subsequent medallions.",
  },
  {
    file: "dawnchaser_medallion.html",
    title: "Dawnchaser medallion",
    level: 3,
    metal: "Antique gold",
    gem: "Citrine (golden yellow)",
    description: "Running figure emblem. Interactive gem placement with audio.",
  },
  {
    file: "first_light_medallion.html",
    title: "First Light medallion",
    level: 4,
    metal: "Rose gold",
    gem: "Fire opal (orange-red)",
    description: "Half-sun with radiating beams emblem. Interactive.",
  },
  {
    file: "horizon_hunter_medallion.html",
    title: "Horizon Hunter medallion",
    level: 5,
    metal: "Brushed silver",
    gem: "Aquamarine (pale blue)",
    description: "Almond-shaped eye with horizon line emblem. Interactive.",
  },
  {
    file: "zora_seeker_medallion.html",
    title: "Zora Seeker medallion",
    level: 6,
    metal: "Cool platinum",
    gem: "Amethyst (violet)",
    description: "Violet-platinum compass rose emblem. Interactive.",
  },
  {
    file: "dawn_keeper_medallion.html",
    title: "Dawn Keeper medallion",
    level: 7,
    metal: "Dark oxidized gold",
    gem: "Deep ruby (crimson)",
    description: "Oil lantern with flame emblem. Interactive.",
  },
  {
    file: "eos_adept_medallion.html",
    title: "Eos Adept medallion",
    level: 8,
    metal: "Verdigris bronze",
    gem: "Teal tourmaline",
    description: "Sun disc with Eos eye emblem. Only teal gem in the system. Interactive.",
  },
  {
    file: "zora_master_medallion.html",
    title: "Zora Master medallion",
    level: 9,
    metal: "Blackened silver",
    gem: "Moonstone (iridescent white)",
    description: "Five-pointed crown emblem. Interactive.",
  },
  {
    file: "finding_zora_medallion.html",
    title: "Finding Zora medallion",
    level: 10,
    metal: "Polished white gold",
    gem: "Diamond (pure light)",
    description: "The final medallion. Radiant Z emblem. The visual endpoint of the arc. Interactive.",
  },
  {
    file: "expedition_card.html",
    title: "Expedition share card",
    level: null,
    metal: null,
    gem: null,
    description: "The shareable visual artifact generated per episode. Photo, scores, effort sundogs, medallion emblem, brand footer.",
  },
];

const LEVEL_COLORS: Record<number, string> = {
  0: "text-mist-dim",
  1: "text-[#E8A070]",
  2: "text-[#D8A060]",
  3: "text-[#E8C868]",
  4: "text-[#E8A898]",
  5: "text-[#C0D0D8]",
  6: "text-[#D0D0D8]",
  7: "text-[#C8A048]",
  8: "text-[#80B8A0]",
  9: "text-[#A0A0A8]",
  10: "text-[#F0E8D8]",
};

export default function ArtifactsPage() {
  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        artifact demos
      </h1>
      <p className="text-mist-dim">
        Interactive HTML prototypes for medallions and the expedition card.
        These are the design source files that defined the visual system.
      </p>

      <Ornament label="Medallions · levels 0 to 10" />

      <div className="space-y-3">
        {ARTIFACTS.filter((a) => a.level !== null).map((a) => (
          <a
            key={a.file}
            href={`/artifacts/${a.file}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-pre-dawn-mid border border-rule rounded-md p-5 hover:border-zora-amber/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`font-mono text-lg font-bold ${LEVEL_COLORS[a.level!] || "text-dawn-mist"}`}>
                  {a.level}
                </span>
                <span className="font-display text-sm text-dawn-mist">
                  {a.title}
                </span>
              </div>
              <span className="font-mono text-[0.6rem] text-mist-dim/40 uppercase tracking-wider">
                open demo
              </span>
            </div>
            <p className="text-xs text-mist-dim mb-2">{a.description}</p>
            <div className="flex gap-4 font-mono text-[0.6rem] text-mist-dim/50">
              {a.metal && <span>{a.metal}</span>}
              {a.gem && (
                <>
                  <span className="text-mist-dim/20">·</span>
                  <span>{a.gem}</span>
                </>
              )}
            </div>
          </a>
        ))}
      </div>

      <Ornament label="Components" />

      {ARTIFACTS.filter((a) => a.level === null).map((a) => (
        <a
          key={a.file}
          href={`/artifacts/${a.file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-pre-dawn-mid border border-rule rounded-md p-5 hover:border-zora-amber/40 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-sm text-dawn-mist">
              {a.title}
            </span>
            <span className="font-mono text-[0.6rem] text-mist-dim/40 uppercase tracking-wider">
              open demo
            </span>
          </div>
          <p className="text-xs text-mist-dim">{a.description}</p>
        </a>
      ))}
    </div>
  );
}
