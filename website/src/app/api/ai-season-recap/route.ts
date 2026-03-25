import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/ai-client";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { season } = body;

    // Fetch all episodes for this season
    const epResult = await pool.query(
      "SELECT episode_number, title, location_name, eos_total, effort_rating, zora_score, shoot_date FROM episodes WHERE season = $1 ORDER BY episode_number",
      [season || 1]
    );

    if (epResult.rows.length === 0) {
      return NextResponse.json({ error: "No episodes found for this season" }, { status: 404 });
    }

    // Fetch discovery stats
    const discResult = await pool.query(
      `SELECT COUNT(DISTINCT d.name) as species, COUNT(*) as total, SUM(d.points) as points
       FROM discoveries d JOIN episodes e ON d.episode_id = e.id
       WHERE e.season = $1`,
      [season || 1]
    );

    const episodes = epResult.rows;
    const discStats = discResult.rows[0];
    const effortLabels: Record<number, string> = { 1: "Roadside", 2: "Trail", 3: "Summit", 4: "Remote", 5: "Expedition" };

    const epSummary = episodes.map((e: Record<string, unknown>) =>
      `E${String(e.episode_number).padStart(2, "0")} "${e.title}" at ${e.location_name} (Eos ${e.eos_total}, ${effortLabels[(e.effort_rating as number)] || e.effort_rating})`
    ).join("\n");

    const bestEos = Math.max(...episodes.map((e: Record<string, unknown>) => e.eos_total as number));
    const bestZora = Math.max(...episodes.map((e: Record<string, unknown>) => (e.zora_score as { total: number }).total));

    const text = await callClaude(`You are writing a season recap for a sunrise expedition show called The Zora Files. The host is a systems thinker with dry humor. Write in the show's voice: methodical, warm, understated.

Season ${season || 1} Summary:
${epSummary}

Stats:
- ${episodes.length} expeditions completed
- Best Eos Index: ${bestEos}
- Best Zora Score: ${bestZora}
- ${discStats.species} unique species discovered
- ${discStats.points || 0} total discovery points

Write a 2-3 paragraph season recap suitable for YouTube description or the about page. Reference specific episodes and moments. Capture the arc of the season. End with something that looks forward.

No headers. No bullet points. Just prose. Return only the text.`, { maxTokens: 768 });

    return NextResponse.json({ recap: text.trim() });
  } catch (err) {
    console.error("Season recap error:", err);
    return NextResponse.json({ error: "Failed to generate recap" }, { status: 502 });
  }
}
