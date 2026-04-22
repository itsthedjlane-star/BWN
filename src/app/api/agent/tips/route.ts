import { NextRequest, NextResponse } from "next/server";
import { requireAgentScope } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import type { BetResult, Sport, Prisma } from "@prisma/client";

/**
 * GET /api/agent/tips
 *
 * Lists tips with agent-friendly filters. Used by the Tip Settler
 * agent's `list_tips` MCP tool, and (eventually) by the Odds Mover
 * and Strategy Drafter agents.
 *
 * Query params (all optional):
 *   - status: BetResult ("PENDING" | "WON" | "LOST" | "VOID"). Repeat
 *     the param to allow multiple. Default: no filter.
 *   - sport: Sport enum value. Repeat to allow multiple.
 *   - since: ISO date string; filters tips created at or after this.
 *   - until: ISO date string; filters tips created strictly before
 *     this. Together with since this is a half-open [since, until)
 *     window, matching the Daily Digest convention.
 *   - limit: 1..100, default 50.
 *   - cursor: opaque id (the `id` of the last row from the previous
 *     page). We order by createdAt DESC, id DESC for a stable tie-break.
 *
 * Response:
 *   {
 *     tips: AgentTipSummary[],
 *     nextCursor: string | null   // null means end of results
 *   }
 *
 * Auth: Bearer ${BWN_AGENT_TOKEN}.
 */

const ALLOWED_STATUSES = new Set<BetResult>(["PENDING", "WON", "LOST", "VOID"]);
const ALLOWED_SPORTS = new Set<Sport>([
  "FOOTBALL",
  "HORSE_RACING",
  "GREYHOUND_RACING",
  "CRICKET",
  "TENNIS",
  "DARTS",
  "GOLF",
]);

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function GET(req: NextRequest) {
  const auth = await requireAgentScope(req, "tips:read");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const params = url.searchParams;

  const rawStatuses = params.getAll("status");
  const statuses: BetResult[] = [];
  for (const s of rawStatuses) {
    if (!ALLOWED_STATUSES.has(s as BetResult)) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_status",
            message: `Unknown status: ${s}. Allowed: ${Array.from(ALLOWED_STATUSES).join(", ")}.`,
          },
        },
        { status: 400 }
      );
    }
    statuses.push(s as BetResult);
  }

  const rawSports = params.getAll("sport");
  const sports: Sport[] = [];
  for (const s of rawSports) {
    if (!ALLOWED_SPORTS.has(s as Sport)) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_sport",
            message: `Unknown sport: ${s}. Allowed: ${Array.from(ALLOWED_SPORTS).join(", ")}.`,
          },
        },
        { status: 400 }
      );
    }
    sports.push(s as Sport);
  }

  const sinceRaw = params.get("since");
  const untilRaw = params.get("until");
  const since = sinceRaw ? new Date(sinceRaw) : null;
  const until = untilRaw ? new Date(untilRaw) : null;
  if (sinceRaw && (since === null || isNaN(+since))) {
    return NextResponse.json(
      { error: { code: "invalid_since", message: "'since' must be an ISO date string." } },
      { status: 400 }
    );
  }
  if (untilRaw && (until === null || isNaN(+until))) {
    return NextResponse.json(
      { error: { code: "invalid_until", message: "'until' must be an ISO date string." } },
      { status: 400 }
    );
  }

  const limitRaw = params.get("limit");
  let limit = DEFAULT_LIMIT;
  if (limitRaw) {
    const parsed = Number(limitRaw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_limit",
            message: `'limit' must be an integer in [1, ${MAX_LIMIT}].`,
          },
        },
        { status: 400 }
      );
    }
    limit = parsed;
  }

  const cursor = params.get("cursor");

  const createdAtFilter: { gte?: Date; lt?: Date } = {};
  if (since) createdAtFilter.gte = since;
  if (until) createdAtFilter.lt = until;

  const where: Prisma.TipWhereInput = {
    ...(statuses.length > 0 ? { result: { in: statuses } } : {}),
    ...(sports.length > 0 ? { sport: { in: sports } } : {}),
    ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
  };

  const rows = await prisma.tip.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      authorId: true,
      sport: true,
      event: true,
      pick: true,
      odds: true,
      oddsDecimal: true,
      confidence: true,
      stake: true,
      result: true,
      pnl: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({
    tips: page.map((t) => ({
      id: t.id,
      authorId: t.authorId,
      authorName: t.author?.name ?? null,
      sport: t.sport,
      event: t.event,
      pick: t.pick,
      odds: t.odds,
      oddsDecimal: t.oddsDecimal,
      confidence: t.confidence,
      stake: t.stake,
      result: t.result,
      pnl: t.pnl,
      createdAt: t.createdAt.toISOString(),
    })),
    nextCursor,
  });
}
