import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserStats } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const settled = bets.filter((b) => b.result !== "PENDING");
  const won = settled.filter((b) => b.result === "WON");
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalPnl = settled.reduce((sum, b) => sum + (b.pnl ?? 0), 0);
  const totalReturn = totalStaked + totalPnl;

  // Current streak
  let streakType: "W" | "L" = "W";
  let streakCount = 0;
  for (const bet of settled) {
    if (bet.result === "VOID") continue;
    if (streakCount === 0) {
      streakType = bet.result === "WON" ? "W" : "L";
      streakCount = 1;
    } else if (
      (bet.result === "WON" && streakType === "W") ||
      (bet.result === "LOST" && streakType === "L")
    ) {
      streakCount++;
    } else {
      break;
    }
  }

  // By sport
  const bySport: Record<string, { bets: number; pnl: number; roi: number }> = {};
  for (const bet of bets) {
    if (!bySport[bet.sport]) {
      bySport[bet.sport] = { bets: 0, pnl: 0, roi: 0 };
    }
    bySport[bet.sport].bets++;
    bySport[bet.sport].pnl += bet.pnl ?? 0;
  }
  for (const sport of Object.keys(bySport)) {
    const sportBets = bets.filter((b) => b.sport === sport);
    const sportStaked = sportBets.reduce((sum, b) => sum + b.stake, 0);
    bySport[sport].roi = sportStaked > 0 ? (bySport[sport].pnl / sportStaked) * 100 : 0;
  }

  const stats: UserStats = {
    totalBets: bets.length,
    totalStaked,
    totalReturn,
    pnl: totalPnl,
    roi: totalStaked > 0 ? (totalPnl / totalStaked) * 100 : 0,
    winRate: settled.length > 0 ? (won.length / settled.length) * 100 : 0,
    currentStreak: { type: streakType, count: streakCount },
    bySport,
  };

  return NextResponse.json(stats);
}
