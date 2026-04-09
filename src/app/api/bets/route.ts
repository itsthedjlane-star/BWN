import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id },
    include: { tip: { select: { pick: true, event: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const bet = await prisma.bet.create({
    data: {
      userId: session.user.id,
      sport: body.sport,
      event: body.event,
      pick: body.pick,
      odds: body.odds,
      oddsDecimal: body.oddsDecimal,
      stake: body.stake ?? 1,
      tipId: body.tipId || null,
    },
  });

  return NextResponse.json(bet, { status: 201 });
}
