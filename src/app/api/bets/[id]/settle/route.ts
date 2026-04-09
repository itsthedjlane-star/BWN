import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePnL, fractionalToDecimal } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { result } = await req.json();
  if (!["WON", "LOST", "VOID"].includes(result)) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const bet = await prisma.bet.findUnique({ where: { id: params.id } });
  if (!bet) {
    return NextResponse.json({ error: "Bet not found" }, { status: 404 });
  }

  // Only allow settling own bets (or admin can settle any)
  if (bet.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const oddsDecimal = bet.oddsDecimal ?? fractionalToDecimal(bet.odds);
  const pnl = calculatePnL(oddsDecimal, bet.stake, result);

  await prisma.bet.update({
    where: { id: params.id },
    data: { result, pnl, oddsDecimal },
  });

  return NextResponse.json({ success: true, result, pnl });
}
ess: true, result, pnl });
}
