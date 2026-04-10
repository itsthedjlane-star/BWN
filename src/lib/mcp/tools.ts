/**
 * BWN MCP tool registry — in-process version.
 *
 * These tools are exposed over the MCP streamable HTTP transport from
 * /api/mcp. Unlike the stdio wrapper in bwn-api-mcp/, these runners
 * call BWN internals directly (Prisma, buildDigest, settleTipForAgent,
 * postDiscordMessage) with no HTTP hop. That's the whole point of
 * folding the MCP server into the Next app — fewer processes, fewer
 * secrets, no round-trip through a local loopback.
 *
 * Tool set mirrors the stdio server exactly:
 *   - build_digest         → buildDigest(from, to)
 *   - post_discord_message → postDiscordMessage(...)
 *   - list_tips            → prisma.tip.findMany(...)
 *   - get_tip              → prisma.tip.findUnique(...) + resolveDecimalOddsStrict
 *   - settle_tip           → settleTipForAgent(id, result)
 *
 * Errors are returned as structured `McpToolFailure` so the caller can
 * translate them into the MCP SDK's `isError: true` content blocks.
 */

import { z } from "zod";
import type { BetResult, Prisma, Sport } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildDigest } from "@/lib/agent-digest";
import {
  resolveDecimalOddsStrict,
  settleTipForAgent,
} from "@/lib/agent-settle";
import {
  AGENT_NOTIFY_SOURCES,
  DISCORD_CONTENT_LIMIT,
  postDiscordMessage,
} from "@/lib/agent-notify";

/* ------------------------------------------------------------------ */
/* Shared enums                                                        */
/* ------------------------------------------------------------------ */

const BET_RESULTS = ["PENDING", "WON", "LOST", "VOID"] as const;
const SPORTS = [
  "FOOTBALL",
  "HORSE_RACING",
  "GREYHOUND_RACING",
  "CRICKET",
  "TENNIS",
  "DARTS",
  "GOLF",
] as const;

/* ------------------------------------------------------------------ */
/* Tool failure type                                                   */
/* ------------------------------------------------------------------ */

export interface McpToolFailure {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export class McpToolError extends Error {
  constructor(public readonly failure: McpToolFailure) {
    super(failure.message);
    this.name = "McpToolError";
  }
}

/* ------------------------------------------------------------------ */
/* build_digest                                                        */
/* ------------------------------------------------------------------ */

export const buildDigestInputSchema = z.object({
  from: z
    .string()
    .describe("Inclusive lower bound on createdAt (ISO 8601)."),
  to: z
    .string()
    .describe("Exclusive upper bound on createdAt (ISO 8601)."),
});

export type BuildDigestInput = z.infer<typeof buildDigestInputSchema>;

async function runBuildDigest(input: BuildDigestInput): Promise<unknown> {
  const from = new Date(input.from);
  const to = new Date(input.to);
  if (isNaN(+from) || isNaN(+to)) {
    throw new McpToolError({
      code: "invalid_window",
      message: "'from' and 'to' must be parseable ISO 8601 strings.",
      status: 400,
    });
  }
  if (from >= to) {
    throw new McpToolError({
      code: "invalid_window",
      message: "'from' must be strictly before 'to'.",
      status: 400,
    });
  }
  try {
    return await buildDigest(from, to);
  } catch (err) {
    throw new McpToolError({
      code: "digest_failed",
      message: err instanceof Error ? err.message : String(err),
      status: 500,
    });
  }
}

/* ------------------------------------------------------------------ */
/* post_discord_message                                                */
/* ------------------------------------------------------------------ */

export const postDiscordInputSchema = z
  .object({
    source: z
      .enum(AGENT_NOTIFY_SOURCES)
      .describe(
        "Which agent is posting. Used for audit logging and future routing."
      ),
    content: z
      .string()
      .max(DISCORD_CONTENT_LIMIT)
      .optional()
      .describe(
        `Message body. Either content or embeds must be provided. Max ${DISCORD_CONTENT_LIMIT} chars (Discord hard cap).`
      ),
    embeds: z
      .array(z.record(z.unknown()))
      .optional()
      .describe("Discord embed objects. See discord-formatter skill."),
    username: z
      .string()
      .optional()
      .describe("Override the posting username. Defaults to 'BWN Agents'."),
  })
  .refine((v) => v.content !== undefined || v.embeds !== undefined, {
    message: "Either 'content' or 'embeds' must be provided.",
  });

export type PostDiscordInput = z.infer<typeof postDiscordInputSchema>;

async function runPostDiscord(input: PostDiscordInput): Promise<unknown> {
  const result = await postDiscordMessage({
    source: input.source,
    content: input.content,
    embeds: input.embeds,
    username: input.username,
  });
  switch (result.status) {
    case "ok":
      return { ok: true, source: result.source };
    case "webhook_not_configured":
      throw new McpToolError({
        code: "webhook_not_configured",
        message:
          "DISCORD_TIP_WEBHOOK_URL is not set; agent notifications are disabled.",
        status: 503,
      });
    case "empty_message":
      throw new McpToolError({
        code: "empty_message",
        message: "Either 'content' or 'embeds' must be provided.",
        status: 400,
      });
    case "content_too_long":
      throw new McpToolError({
        code: "content_too_long",
        message: `'content' must be <= ${DISCORD_CONTENT_LIMIT} characters.`,
        status: 400,
        details: { length: result.length },
      });
    case "webhook_failed":
      throw new McpToolError({
        code: "webhook_failed",
        message: `Discord webhook returned ${result.httpStatus}.`,
        status: 502,
        details: { upstream: result.upstream },
      });
    case "webhook_error":
      throw new McpToolError({
        code: "webhook_error",
        message: result.message,
        status: 502,
      });
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      throw new McpToolError({
        code: "internal_error",
        message: "Unhandled postDiscordMessage result",
        status: 500,
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/* list_tips                                                           */
/* ------------------------------------------------------------------ */

export const listTipsInputSchema = z.object({
  status: z
    .array(z.enum(BET_RESULTS))
    .optional()
    .describe(
      "Filter by result. Pass ['PENDING'] for the tip-settler's main use case."
    ),
  sport: z
    .array(z.enum(SPORTS))
    .optional()
    .describe("Filter by sport. Omit to include all sports."),
  since: z
    .string()
    .optional()
    .describe("Inclusive lower bound on createdAt (ISO 8601)."),
  until: z
    .string()
    .optional()
    .describe("Exclusive upper bound on createdAt (ISO 8601)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Page size, 1..100. Default 50."),
  cursor: z
    .string()
    .optional()
    .describe("Opaque pagination cursor from a previous list_tips.nextCursor."),
});

export type ListTipsInput = z.infer<typeof listTipsInputSchema>;

async function runListTips(input: ListTipsInput): Promise<unknown> {
  const limit = input.limit ?? 50;

  const where: Prisma.TipWhereInput = {};
  if (input.status && input.status.length > 0) {
    where.result = { in: input.status as BetResult[] };
  }
  if (input.sport && input.sport.length > 0) {
    where.sport = { in: input.sport as Sport[] };
  }
  if (input.since || input.until) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (input.since) {
      const d = new Date(input.since);
      if (isNaN(+d)) {
        throw new McpToolError({
          code: "invalid_since",
          message: "'since' must be a parseable ISO 8601 string.",
          status: 400,
        });
      }
      createdAt.gte = d;
    }
    if (input.until) {
      const d = new Date(input.until);
      if (isNaN(+d)) {
        throw new McpToolError({
          code: "invalid_until",
          message: "'until' must be a parseable ISO 8601 string.",
          status: 400,
        });
      }
      createdAt.lt = d;
    }
    where.createdAt = createdAt;
  }

  const rows = await prisma.tip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
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
      author: { select: { name: true } },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  return {
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
  };
}

/* ------------------------------------------------------------------ */
/* get_tip                                                             */
/* ------------------------------------------------------------------ */

export const getTipInputSchema = z.object({
  id: z.string().min(1).describe("The tip id (cuid) to fetch."),
});

export type GetTipInput = z.infer<typeof getTipInputSchema>;

async function runGetTip(input: GetTipInput): Promise<unknown> {
  const tip = await prisma.tip.findUnique({
    where: { id: input.id },
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
    throw new McpToolError({
      code: "tip_not_found",
      message: `No tip with id ${input.id}.`,
      status: 404,
    });
  }

  const resolvedOddsDecimal = resolveDecimalOddsStrict(tip);

  return {
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
  };
}

/* ------------------------------------------------------------------ */
/* settle_tip                                                          */
/* ------------------------------------------------------------------ */

export const settleTipInputSchema = z.object({
  id: z.string().min(1).describe("The tip id (cuid) to settle."),
  result: z
    .enum(["WON", "LOST", "VOID"])
    .describe(
      "The outcome. Pushes, dead-heats, and abandoned fixtures are VOID. Never pass PENDING."
    ),
});

export type SettleTipInput = z.infer<typeof settleTipInputSchema>;

async function runSettleTip(input: SettleTipInput): Promise<unknown> {
  const outcome = await settleTipForAgent(input.id, input.result);
  switch (outcome.status) {
    case "ok":
      return {
        ok: true,
        tip: outcome.tip,
        cascadedBets: outcome.cascadedBets,
      };
    case "already_settled":
      return {
        ok: true,
        alreadySettled: true,
        tip: outcome.tip,
      };
    case "not_found":
      throw new McpToolError({
        code: "tip_not_found",
        message: `No tip with id ${input.id}.`,
        status: 404,
      });
    case "invalid_result":
      throw new McpToolError({
        code: "invalid_result",
        message: "'result' must be WON, LOST, or VOID.",
        status: 400,
      });
    case "pending_not_allowed":
      throw new McpToolError({
        code: "pending_not_allowed",
        message: "Cannot settle a tip to PENDING.",
        status: 400,
      });
    case "odds_not_parseable":
      throw new McpToolError({
        code: "odds_not_parseable",
        message: `Tip odds "${outcome.odds}" is not a well-formed fraction. A human needs to backfill oddsDecimal.`,
        status: 422,
        details: { odds: outcome.odds },
      });
    default: {
      const _exhaustive: never = outcome;
      void _exhaustive;
      throw new McpToolError({
        code: "internal_error",
        message: "Unhandled settleTipForAgent result",
        status: 500,
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

export interface McpToolDefinition<I> {
  name: string;
  description: string;
  schema: z.ZodType<I>;
  run: (input: I) => Promise<unknown>;
}

function tool<I>(def: McpToolDefinition<I>): McpToolDefinition<I> {
  return def;
}

export const BWN_MCP_TOOLS = [
  tool({
    name: "build_digest",
    description:
      "Build a DigestPayload summarising BWN tip activity in the [from, to) window. Server-computed totals, per-sport breakdown, top winners, worst loss. Use this before post_discord_message to produce the daily digest content.",
    schema: buildDigestInputSchema,
    run: runBuildDigest,
  }),
  tool({
    name: "post_discord_message",
    description:
      "Post a prebuilt Discord message via BWN's configured webhook. `source` MUST match the agent name for audit logging. Either `content` or `embeds` (or both) must be present.",
    schema: postDiscordInputSchema,
    run: runPostDiscord,
  }),
  tool({
    name: "list_tips",
    description:
      "List BWN tips with optional filters on status, sport, and createdAt window. Ordered by createdAt DESC. Returns up to `limit` tips plus a `nextCursor` for paging. Pass status=['PENDING'] for the tip-settler's main use case.",
    schema: listTipsInputSchema,
    run: runListTips,
  }),
  tool({
    name: "get_tip",
    description:
      "Fetch a single BWN tip by id, including author, reasoning, a server-resolved `resolvedOddsDecimal` (strict-parsed from the fractional `odds` string when the DB column is null), the `oddsParseable` flag, and the linked Bet count that a settle call will cascade to.",
    schema: getTipInputSchema,
    run: runGetTip,
  }),
  tool({
    name: "settle_tip",
    description:
      "Settle a BWN tip. The server computes PnL from the tip's stake and resolved decimal odds — the agent does NOT pass PnL. Settlement cascades to any linked Bet rows in a single transaction. Responses: `ok:true` on success, `alreadySettled:true` if the tip was already settled (idempotent, not an error), tip_not_found, or odds_not_parseable (a human needs to backfill oddsDecimal before the agent can settle it).",
    schema: settleTipInputSchema,
    run: runSettleTip,
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
] as const satisfies readonly McpToolDefinition<any>[];
