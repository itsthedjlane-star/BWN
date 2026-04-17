import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the recent price history for a single Odds API event,
 * grouped by (bookmaker, outcome). The compare page uses this to draw
 * sparklines, and the upcoming odds-drop alert trigger uses it to
 * compare current vs. prior prices.
 *
 *   GET /api/odds/<eventId>/history?hours=24
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const hoursParam = Number(req.nextUrl.searchParams.get("hours") ?? "24");
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 && hoursParam <= 168
    ? hoursParam
    : 24;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  try {
    const rows = await prisma.oddsSnapshot.findMany({
      where: { eventId, at: { gte: since } },
      orderBy: { at: "asc" },
      select: { bookmaker: true, outcome: true, price: true, at: true },
    });

    // Group into { [bookmaker]: { [outcome]: [{ price, at }, ...] } }
    const series: Record<string, Record<string, { price: number; at: string }[]>> = {};
    for (const r of rows) {
      const byBook = (series[r.bookmaker] ??= {});
      const list = (byBook[r.outcome] ??= []);
      list.push({ price: r.price, at: r.at.toISOString() });
    }

    return NextResponse.json({ eventId, hours, series });
  } catch (err) {
    console.error("Failed to load odds history:", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
