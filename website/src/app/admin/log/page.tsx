import type { Metadata } from "next";
import Link from "next/link";
import { LogForm } from "./log-form";
import { getEpisodes } from "@/lib/queries";

export const metadata: Metadata = { title: "expedition log" };
export const dynamic = "force-dynamic";

export default async function AdminLogPage() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const episodes = await getEpisodes();
  const totalExpeditions = episodes.length;
  const shootDates = episodes.map((e) => e.shoot_date).sort();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-zora-amber mb-2">
        log expedition
      </h1>
      <p className="text-dawn-mist/60 mb-8">
        Score the sunrise, rate the effort, log discoveries.
      </p>

      <LogForm
        hasApiKey={hasApiKey}
        totalExpeditions={totalExpeditions}
        shootDates={shootDates}
      />

      {/* Existing episodes */}
      {episodes.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-xl font-semibold text-dawn-mist mb-4">
            logged expeditions
          </h2>
          <div className="space-y-2">
            {episodes.map((ep) => {
              const slug = `s${String(ep.season).padStart(2, "0")}e${String(ep.episode_number).padStart(2, "0")}`;
              return (
                <div
                  key={ep.id}
                  className="flex items-center justify-between rounded-xl border border-dawn-mist/10 bg-dawn-mist/5 p-4"
                >
                  <div>
                    <p className="text-sm text-dawn-mist">
                      S{String(ep.season).padStart(2, "0")}E
                      {String(ep.episode_number).padStart(2, "0")} —{" "}
                      &ldquo;{ep.title}&rdquo;
                    </p>
                    <p className="text-xs text-dawn-mist/40">
                      {ep.location_name} — Eos {ep.eos_total}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/log/${ep.id}`}
                      className="rounded-lg border border-dawn-mist/20 px-3 py-1.5 text-xs text-dawn-mist/60 hover:border-zora-amber/40 hover:text-zora-amber transition-colors"
                    >
                      edit
                    </Link>
                    <Link
                      href={`/admin/card/${slug}`}
                      className="rounded-lg border border-dawn-mist/20 px-3 py-1.5 text-xs text-dawn-mist/60 hover:border-dawn-mist/40 transition-colors"
                    >
                      card
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
