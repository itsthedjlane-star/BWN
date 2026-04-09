import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Toggle tail
    const existing = await prisma.tail.findUnique({
      where: {
        tipId_userId: { tipId: id, userId: session.user.id },
      },
    });

    if (existing) {
      await prisma.tail.delete({ where: { id: existing.id } });
      return NextResponse.json({ tailed: false });
    }

    await prisma.tail.create({
      data: { tipId: id, userId: session.user.id },
    });

    // Auto-create a bet entry when tailing
    const tip = await prisma.tip.findUnique({ where: { id: id } });
    if (tip) {
      await prisma.bet.create({
        data: {
          userId: session.user.id,
          tipId: id,
          sport: tip.sport,
          event: tip.event,
          pick: tip.pick,
          odds: tip.odds,
          oddsDecimal: tip.oddsDecimal,
          stake: tip.stake,
        },
      });
    }

    return NextResponse.json({ tailed: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to tail tip" },
      { status: 500 }
    );
  }
}
