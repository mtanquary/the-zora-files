import Link from "next/link";

/**
 * Finding Zora keeps its own pre-dawn game look. This band marks it as a
 * series inside The Zora Files and gives a quick way back to the park side.
 */
export default function FindingZoraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-rule bg-pre-dawn-mid print:hidden">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-6 py-2 font-mono text-[0.6rem] uppercase tracking-[0.16em]">
          <p className="text-mist-dim">
            <Link href="/" className="transition-colors hover:text-zora-amber">
              The Zora Files
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <Link href="/finding-zora" className="text-zora-amber">
              Finding Zora
            </Link>
            <span className="ml-2 hidden opacity-60 sm:inline">· the game</span>
          </p>
          <Link href="/expeditions" className="text-mist-dim transition-colors hover:text-zora-amber">
            ← Expedition journal
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}
