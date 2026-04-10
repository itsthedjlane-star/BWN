import { NextRequest, NextResponse } from "next/server";
import {
  fetchOdds,
  resolveCategoryToSportKey,
  OddsCategory,
} from "@/lib/odds";

const VALID_CATEGORIES: OddsCategory[] = [
  "football",
  "tennis",
  "cricket",
  "darts",
  "golf",
];

function isCategory(value: string): value is OddsCategory {
  return (VALID_CATEGORIES as string[]).includes(value);
}

export async function GET(req: NextRequest) {
  const sportParam = req.nextUrl.searchParams.get("sport");
  const categoryParam = req.nextUrl.searchParams.get("category");

  let sportKey: string;
  try {
    if (categoryParam) {
      if (!isCategory(categoryParam)) {
        return NextResponse.json(
          { error: `Unknown category: ${categoryParam}` },
          { status: 400 }
        );
      }
      sportKey = await resolveCategoryToSportKey(categoryParam);
    } else {
      sportKey = sportParam ?? "soccer_epl";
    }

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
