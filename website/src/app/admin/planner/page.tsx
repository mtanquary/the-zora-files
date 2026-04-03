import type { Metadata } from "next";
import { PlannerForm } from "./planner-form";
import fs from "fs";
import path from "path";

export const metadata: Metadata = { title: "episode planner" };
export const dynamic = "force-dynamic";

interface ExistingPlan {
  folder: string;
  code: string;
  title: string;
  hasPlan: boolean;
  hasProductionSheet: boolean;
}

function getExistingPlans(): ExistingPlan[] {
  const plans: ExistingPlan[] = [];
  try {
    // Episodes directory is at repo root, one level up from website/
    const episodesDir = path.resolve(process.cwd(), "../episodes");
    if (!fs.existsSync(episodesDir)) return plans;

    const seasons = fs.readdirSync(episodesDir).filter((d) =>
      d.startsWith("season-") && fs.statSync(path.join(episodesDir, d)).isDirectory()
    );

    for (const season of seasons) {
      const seasonDir = path.join(episodesDir, season);
      const episodes = fs.readdirSync(seasonDir).filter((d) =>
        /^S\d{2}E\d{2}/.test(d) && fs.statSync(path.join(seasonDir, d)).isDirectory()
      );

      for (const ep of episodes) {
        const epDir = path.join(seasonDir, ep);
        const hasPlan = fs.existsSync(path.join(epDir, "plan.md"));
        const hasProductionSheet = fs.existsSync(path.join(epDir, "production-sheet.md"));

        // Extract title from plan.md if it exists
        let title = ep;
        if (hasPlan) {
          const content = fs.readFileSync(path.join(epDir, "plan.md"), "utf-8");
          const match = content.match(/^# S\d+E\d+ — "(.+?)"/m);
          if (match) title = match[1];
        }

        const codeMatch = ep.match(/^(S\d{2}E\d{2})/);
        const code = codeMatch ? codeMatch[1] : ep;

        plans.push({ folder: ep, code, title, hasPlan, hasProductionSheet });
      }
    }
  } catch {
    // Filesystem may not be available (e.g. deployed on Vercel)
  }
  return plans.sort((a, b) => a.code.localeCompare(b.code));
}

export default function PlannerPage() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const existingPlans = getExistingPlans();

  // Compute next episode number
  const maxEpisode = existingPlans.reduce((max, p) => {
    const m = p.code.match(/E(\d+)/);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);

  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2 print-none">
        episode planner
      </h1>
      <p className="text-mist-dim print-none">
        Plan your next expedition. From location scouting to production-ready shoot sheet.
      </p>

      {hasApiKey ? (
        <PlannerForm
          existingPlans={existingPlans}
          nextEpisodeNumber={maxEpisode + 1}
        />
      ) : (
        <div className="mt-8 bg-pre-dawn-mid border border-rule rounded-md p-5">
          <p className="text-mist-dim">
            Set <code className="text-zora-amber">ANTHROPIC_API_KEY</code> to enable AI-powered episode planning.
          </p>
        </div>
      )}
    </div>
  );
}
