import { NextRequest, NextResponse } from "next/server";
import {
  fetchOdds,
  fetchOddsForCategory,
  ODDS_CATEGORIES,
  OddsCategory,
  OddsQuotaError,
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
      // Returns { status, events } so the client can render a quota banner.
      const result = await fetchOddsForCategory(categoryParam);
      return NextResponse.json(result);
    }

    const sportKey = sportParam ?? "soccer_epl";
    const odds = await fetchOdds(sportKey);
    return NextResponse.json({ status: "ok", events: odds });
  } catch (error) {
    if (error instanceof OddsQuotaError) {
      return NextResponse.json({ status: "quota_exceeded", events: [] });
    }
    console.error("Odds fetch error:", error);
    return NextResponse.json(
      { status: "error", events: [], error: "Failed to fetch odds" },
      { status: 500 }
    );
  }
}
