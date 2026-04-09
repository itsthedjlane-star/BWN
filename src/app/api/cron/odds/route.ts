import { NextRequest, NextResponse } from "next/server";
import { fetchOdds, FOOTBALL_LEAGUES } from "@/lib/odds";

// Vercel Cron job — refreshes odds cache
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Refresh key sports
    const sports = ["soccer_epl", "soccer_uefa_champs_league"];
    const results = await Promise.allSettled(
      sports.map((sport) => fetchOdds(sport))
    );

    const summary = results.map((r, i) => ({
      sport: sports[i],
      status: r.status,
      count: r.status === "fulfilled" ? r.value.length : 0,
    }));

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
