import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sport = req.nextUrl.searchParams.get("sport");
  const result = req.nextUrl.searchParams.get("result");

  const where: any = {};
  if (sport && sport !== "ALL") where.sport = sport;
  if (result && result !== "ALL") where.result = result;

  try {
    const tips = await prisma.tip.findMany({
      where,
      include: {
        author: { select: { name: true, image: true } },
        _count: { select: { comments: true, tails: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(tips);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tips" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  try {
    const tip = await prisma.tip.create({
      data: {
        authorId: session.user.id,
        sport: body.sport,
        event: body.event,
        pick: body.pick,
        reasoning: body.reasoning,
        odds: body.odds,
        confidence: body.confidence ?? 3,
        stake: body.stake ?? 1,
        source: body.source || null,
      },
    });

    return NextResponse.json(tip, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create tip" },
      { status: 500 }
    );
  }
}
