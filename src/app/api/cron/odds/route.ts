import { NextRequest, NextResponse } from "next/server";
import { fetchActiveSports, fetchOdds, FOOTBALL_LEAGUES } from "@/lib/odds";
import { prisma } from "@/lib/prisma";
import type { OddsData } from "@/types";

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

// Flatten an Odds API event into one row per (bookmaker, market, outcome).
function eventToSnapshots(sportKey: string, ev: OddsData, at: Date) {
  const rows: {
    eventId: string;
    sportKey: string;
    bookmaker: string;
    market: string;
    outcome: string;
    price: number;
    at: Date;
  }[] = [];
  for (const bm of ev.bookmakers) {
    for (const market of bm.markets) {
      for (const outcome of market.outcomes) {
        rows.push({
          eventId: ev.id,
          sportKey,
          bookmaker: bm.key.toLowerCase(),
          market: market.key,
          outcome: outcome.name,
          price: outcome.price,
          at,
        });
      }
    }
  }
  return rows;
}

// Vercel Cron job — refreshes odds cache and records price snapshots.
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

    // Persist snapshots. Single "at" timestamp per run so rows line up
    // cleanly when we query history for a sparkline.
    const at = new Date();
    const rows = results.flatMap((r, i) => {
      if (r.status !== "fulfilled") return [];
      return r.value.flatMap((ev) => eventToSnapshots(keys[i], ev, at));
    });

    let snapshotsWritten = 0;
    if (rows.length > 0) {
      try {
        const created = await prisma.oddsSnapshot.createMany({ data: rows });
        snapshotsWritten = created.count;
      } catch (err) {
        // Never fail the whole cron because persistence had a blip —
        // odds refresh is more valuable than the snapshot history.
        console.error("Failed to persist odds snapshots:", err);
      }
    }

    const summary = results.map((r, i) => ({
      sport: keys[i],
      status: r.status,
      count: r.status === "fulfilled" ? r.value.length : 0,
    }));

    return NextResponse.json({ success: true, snapshotsWritten, summary });
  } catch (error) {
    console.error("Odds cron failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
