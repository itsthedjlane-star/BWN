import { NextRequest, NextResponse } from "next/server";
import { verifyAgentRequest } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { resolveDecimalOddsStrict } from "@/lib/agent-settle";

/**
 * GET /api/agent/tips/[id]
 *
 * Returns a single tip with everything the Tip Settler agent needs
 * to decide a settlement: the canonical pick/event/odds plus a
 * server-resolved `resolvedOddsDecimal` that strict-parses the
 * `odds` string as a fallback if the DB column is null. The agent
 * must NOT re-parse the `odds` string itself — see the
 * bwn-api-conventions skill.
 *
 * Also includes the linked Bet count so the agent knows how many
 * tails will be cascaded by a settle call.
 *
 * Auth: Bearer ${BWN_AGENT_TOKEN}.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = verifyAgentRequest(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const tip = await prisma.tip.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      sport: true,
      event: true,
      pick: true,
      reasoning: true,
      odds: true,
      oddsDecimal: true,
      confidence: true,
      stake: true,
      source: true,
      result: true,
      pnl: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { id: true, name: true } },
      _count: { select: { bets: true, tails: true } },
    },
  });

  if (!tip) {
    return NextResponse.json(
      { error: { code: "tip_not_found", message: `No tip with id ${id}.` } },
      { status: 404 }
    );
  }

  const resolvedOddsDecimal = resolveDecimalOddsStrict(tip);

  return NextResponse.json({
    tip: {
      id: tip.id,
      authorId: tip.authorId,
      authorName: tip.author?.name ?? null,
      sport: tip.sport,
      event: tip.event,
      pick: tip.pick,
      reasoning: tip.reasoning,
      odds: tip.odds,
      oddsDecimal: tip.oddsDecimal,
      resolvedOddsDecimal,
      oddsParseable: resolvedOddsDecimal !== null,
      confidence: tip.confidence,
      stake: tip.stake,
      source: tip.source,
      result: tip.result,
      pnl: tip.pnl,
      createdAt: tip.createdAt.toISOString(),
      updatedAt: tip.updatedAt.toISOString(),
      linkedBetCount: tip._count.bets,
      tailCount: tip._count.tails,
    },
  });
}
