import { NextRequest, NextResponse } from "next/server";
import { fetchActiveSports, fetchOdds, FOOTBALL_LEAGUES } from "@/lib/odds";

// Groups we care about — anything Odds API groups under one of these will
// be pre-cached. Matches the categories exposed on /odds.
const TARGETED_GROUPS = new Set([
  "Soccer",
  "Tennis",
  "Cricket",
  "Darts",
  "Golf",
  "Horse Racing",
  "Greyhound Racing",
]);

// Cap so we don't blow the Odds API request budget or Vercel's execution
// time. Active sports beyond this limit just won't be pre-warmed — the
// on-demand /api/odds path still serves them.
const MAX_KEYS = 20;

// Vercel Cron job — refreshes odds cache.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Prefer discovery so we follow whichever tournaments are in-season.
    // If discovery returns nothing (no API key, transient failure) fall
    // back to a sane static list so the cron still touches something.
    const active = await fetchActiveSports();
    let keys: string[] = active
      .filter((s) => s.active && TARGETED_GROUPS.has(s.group))
      .map((s) => s.key);

    if (keys.length === 0) {
      keys = Object.values(FOOTBALL_LEAGUES);
    }

    keys = keys.slice(0, MAX_KEYS);

    const results = await Promise.allSettled(keys.map((k) => fetchOdds(k)));

    const summary = results.map((r, i) => ({
      sport: keys[i],
      status: r.status,
      count: r.status === "fulfilled" ? r.value.length : 0,
    }));

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Odds cron failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
