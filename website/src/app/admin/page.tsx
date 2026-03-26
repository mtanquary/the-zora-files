import type { Metadata } from "next";
import Link from "next/link";
import { getEpisodes } from "@/lib/queries";
import { LEVELS } from "@/lib/types";
import { Ornament } from "@/components/atmosphere";

export const metadata: Metadata = { title: "admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const episodes = await getEpisodes();
  const totalExpeditions = episodes.length;
  const currentLevel = LEVELS.filter((l) => totalExpeditions >= l.expeditions).pop()!;
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  const tools = [
    {
      href: "/admin/log",
      title: "log expedition",
      description: "Score a sunrise, rate the effort, log discoveries",
      icon: "📝",
      always: true,
    },
    {
      href: "/admin/scout",
      title: "pre-shoot intel",
      description: "AI scouting report for your next location",
      icon: "🔭",
      always: false,
    },
    {
      href: "/admin/card/s01e01",
      title: "export share card",
      description: "Generate social cards for any episode",
      icon: "🃏",
      always: true,
      note: episodes.length > 0 ? undefined : "log an expedition first",
    },
    {
      href: "/admin/artifacts",
      title: "artifact demos",
      description: "Interactive medallion and card prototypes",
      icon: "🪙",
      always: true,
    },
  ];

  const recentEpisodes = episodes.slice(0, 5);

  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        admin
      </h1>
      <p className="text-mist-dim">
        Level {currentLevel.level} · {currentLevel.title} · {totalExpeditions} expedition{totalExpeditions !== 1 ? "s" : ""}
        {hasApiKey && <span className="ml-2 text-eos-teal">· AI enabled</span>}
      </p>

      <Ornament label="Tools" />

      <div className="grid gap-3 sm:grid-cols-2">
        {tools
          .filter((t) => t.always || hasApiKey)
          .map((t) => (
            <Link
              key={t.href}
              href={t.note ? "#" : t.href}
              className={`bg-pre-dawn-mid border border-rule rounded-md p-5 transition-colors ${
                t.note
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:border-zora-amber/40"
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <p className="font-display text-sm text-dawn-mist mt-2">
                {t.title}
              </p>
              <p className="text-xs text-mist-dim mt-1">{t.description}</p>
              {t.note && (
                <p className="text-[0.6rem] text-sunrise-orange mt-2">{t.note}</p>
              )}
            </Link>
          ))}
      </div>

      {/* Quick episode access */}
      {recentEpisodes.length > 0 && (
        <>
          <Ornament label="Logged expeditions" />

          <div className="bg-pre-dawn-mid border border-rule rounded-md">
            {recentEpisodes.map((ep, i) => {
              const slug = `s${String(ep.season).padStart(2, "0")}e${String(ep.episode_number).padStart(2, "0")}`;
              return (
                <div
                  key={ep.id}
                  className={`flex items-center justify-between px-5 py-3 ${
                    i < recentEpisodes.length - 1 ? "border-b border-dawn-mist/[0.05]" : ""
                  }`}
                >
                  <div>
                    <span className="font-display text-sm text-dawn-mist">
                      S{String(ep.season).padStart(2, "0")}E
                      {String(ep.episode_number).padStart(2, "0")} · &ldquo;{ep.title}&rdquo;
                    </span>
                    <span className="ml-2 font-mono text-xs text-teal-light">
                      {ep.eos_total}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/log/${ep.id}`}
                      className="font-mono text-[0.6rem] text-mist-dim hover:text-zora-amber transition-colors"
                    >
                      edit
                    </Link>
                    <Link
                      href={`/admin/card/${slug}`}
                      className="font-mono text-[0.6rem] text-mist-dim hover:text-zora-amber transition-colors"
                    >
                      card
                    </Link>
                    <Link
                      href={`/episodes/${slug}`}
                      className="font-mono text-[0.6rem] text-mist-dim hover:text-zora-amber transition-colors"
                    >
                      view
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
