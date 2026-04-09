import { NextRequest, NextResponse } from "next/server";
import { fetchOdds, FOOTBALL_LEAGUES } from "@/lib/odds";

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get("sport") ?? "soccer_epl";

  try {
    const odds = await fetchOdds(sport);
    return NextResponse.json(odds);
  } catch (error) {
    console.error("Odds fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch odds" },
      { status: 500 }
    );
  }
}
