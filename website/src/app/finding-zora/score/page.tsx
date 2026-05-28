import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMemberOverview } from "@/lib/member";
import { ScoreClient } from "./score-client";

export const metadata: Metadata = {
  title: "score your sunrise",
  description: "Members get their own sunrise photos scored on the Eos Index.",
};
export const dynamic = "force-dynamic";

export default async function ScorePage() {
  const overview = await getMemberOverview();
  if (!overview) redirect("/login?next=/finding-zora/score");

  return (
    <ScoreClient
      remaining={overview.remaining}
      limit={overview.limit}
      resetsAt={overview.resetsAt}
    />
  );
}
