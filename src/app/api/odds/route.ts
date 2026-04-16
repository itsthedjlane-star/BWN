import { NextRequest, NextResponse } from "next/server";
import {
  fetchOdds,
  fetchOddsForCategory,
  ODDS_CATEGORIES,
  OddsCategory,
} from "@/lib/odds";

function isCategory(value: string): value is OddsCategory {
  return (ODDS_CATEGORIES as string[]).includes(value);
}

export async function GET(req: NextRequest) {
  const sportParam = req.nextUrl.searchParams.get("sport");
  const categoryParam = req.nextUrl.searchParams.get("category");

  try {
    if (categoryParam) {
      if (!isCategory(categoryParam)) {
        return NextResponse.json(
          { error: `Unknown category: ${categoryParam}` },
          { status: 400 }
        );
      }
      const odds = await fetchOddsForCategory(categoryParam);
      return NextResponse.json(odds);
    }

    const sportKey = sportParam ?? "soccer_epl";
    const odds = await fetchOdds(sportKey);
    return NextResponse.json(odds);
  } catch (error) {
    console.error("Odds fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch odds" },
      { status: 500 }
    );
  }
}
