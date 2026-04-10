import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTipAlert } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sport = req.nextUrl.searchParams.get("sport");
  const result = req.nextUrl.searchParams.get("result");
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 50 ? limitParam : 20;

  const where: any = {};
  if (sport && sport !== "ALL") where.sport = sport;
  if (result && result !== "ALL") where.result = result;

  try {
    const rows = await prisma.tip.findMany({
      where,
      include: {
        author: { select: { name: true, image: true } },
        _count: { select: { comments: true, tails: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ items, nextCursor });
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

    void sendTipAlert({
      id: tip.id,
      sport: tip.sport,
      event: tip.event,
      pick: tip.pick,
      odds: tip.odds,
      confidence: tip.confidence,
      stake: tip.stake,
      authorName: session.user.name ?? null,
    });

    return NextResponse.json(tip, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create tip" },
      { status: 500 }
    );
  }
}
