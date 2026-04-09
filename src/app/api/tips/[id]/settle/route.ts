import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePnL, fractionalToDecimal } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { result } = await req.json();
  if (!["WON", "LOST", "VOID"].includes(result)) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const tip = await prisma.tip.findUnique({ where: { id } });
  if (!tip) {
    return NextResponse.json({ error: "Tip not found" }, { status: 404 });
  }

  const oddsDecimal = tip.oddsDecimal ?? fractionalToDecimal(tip.odds);
  const pnl = calculatePnL(oddsDecimal, tip.stake, result);

  // Update tip and all linked bets in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.tip.update({
      where: { id: id },
      data: { result, pnl, oddsDecimal },
    });

    // Settle all bets linked to this tip
    const linkedBets = await tx.bet.findMany({
      where: { tipId: id },
    });

    for (const bet of linkedBets) {
      const betOddsDecimal = bet.oddsDecimal ?? fractionalToDecimal(bet.odds);
      const betPnl = calculatePnL(betOddsDecimal, bet.stake, result);
      await tx.bet.update({
        where: { id: bet.id },
        data: { result, pnl: betPnl, oddsDecimal: betOddsDecimal },
      });
    }
  });

  return NextResponse.json({ success: true, result, pnl });
}
