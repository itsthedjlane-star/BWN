/**
 * Shared settlement logic for the Tip Settler agent.
 *
 * This is deliberately a separate module from the existing
 * src/app/api/tips/[id]/settle/route.ts admin handler. The two have
 * overlapping responsibilities but different invariants:
 *
 *   - The admin handler assumes an authenticated human is clicking a
 *     button in the UI, and accepts the silent `fractionalToDecimal`
 *     fallback of 2.0 because a human would notice wrong PnL and fix
 *     it.
 *
 *   - The agent handler runs unattended on a schedule, so a silent
 *     fallback on a malformed `odds` string would quietly produce
 *     wrong PnL for every tip whose oddsDecimal was never backfilled.
 *     Instead we parse strictly and return an "odds_not_parseable"
 *     error; the agent is instructed to SKIP those tips and surface
 *     them in its run summary so a human can fix the underlying data.
 *
 * The function is idempotent: if the tip is already settled, it
 * returns the existing state with status "already_settled" so the
 * route can map to 409. The agent treats 409 as success.
 */

import { prisma } from "@/lib/prisma";
import { calculatePnL } from "@/lib/utils";
import type { BetResult, Tip } from "@prisma/client";

export type AgentSettleResult =
  | { status: "ok"; tip: SettledTipSummary; cascadedBets: number }
  | { status: "already_settled"; tip: SettledTipSummary }
  | { status: "not_found" }
  | { status: "invalid_result" }
  | { status: "odds_not_parseable"; odds: string }
  | { status: "pending_not_allowed" };

export interface SettledTipSummary {
  id: string;
  result: BetResult;
  pnl: number | null;
  oddsDecimal: number;
  stake: number;
}

const ALLOWED_RESULTS: ReadonlySet<string> = new Set(["WON", "LOST", "VOID"]);

/**
 * Strict fractional-odds parser. Returns null on anything that isn't
 * a well-formed fraction with positive numerator and positive
 * denominator. Unlike the legacy `fractionalToDecimal` helper, there
 * is NO silent 2.0 fallback — callers must handle the null.
 */
export function parseFractionalOddsStrict(odds: string): number | null {
  if (typeof odds !== "string") return null;
  const trimmed = odds.trim();
  if (!trimmed) return null;

  // Accept "a/b" only. Things like "evens", "2.5", "EVS" are rejected
  // — the agent should skip them rather than guess.
  const match = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(trimmed);
  if (!match) return null;

  const num = Number(match[1]);
  const den = Number(match[2]);
  if (!Number.isFinite(num) || !Number.isFinite(den)) return null;
  if (num <= 0 || den <= 0) return null;

  return num / den + 1;
}

/**
 * Resolve a tip's decimal odds, preferring the stored `oddsDecimal`
 * column and falling back to strict parsing of the `odds` string.
 * Returns null only when both are unavailable or malformed.
 */
export function resolveDecimalOddsStrict(tip: Pick<Tip, "oddsDecimal" | "odds">): number | null {
  if (typeof tip.oddsDecimal === "number" && Number.isFinite(tip.oddsDecimal) && tip.oddsDecimal > 0) {
    return tip.oddsDecimal;
  }
  return parseFractionalOddsStrict(tip.odds);
}

export async function settleTipForAgent(
  id: string,
  result: string
): Promise<AgentSettleResult> {
  if (!ALLOWED_RESULTS.has(result)) {
    // The agent must never send PENDING — that would be a regression.
    if (result === "PENDING") return { status: "pending_not_allowed" };
    return { status: "invalid_result" };
  }

  const existing = await prisma.tip.findUnique({ where: { id } });
  if (!existing) return { status: "not_found" };

  // Idempotency: if the tip is already settled (by a human or a
  // previous agent run), return the existing state so the caller can
  // 409 and the agent can treat it as success.
  if (existing.result !== "PENDING") {
    return {
      status: "already_settled",
      tip: {
        id: existing.id,
        result: existing.result,
        pnl: existing.pnl,
        oddsDecimal: existing.oddsDecimal ?? 0,
        stake: existing.stake,
      },
    };
  }

  const oddsDecimal = resolveDecimalOddsStrict(existing);
  if (oddsDecimal === null) {
    return { status: "odds_not_parseable", odds: existing.odds };
  }

  const pnl = calculatePnL(oddsDecimal, existing.stake, result as BetResult);

  // Cascade into linked Bet rows in a single transaction so the tip
  // and its tails can never disagree on result.
  const cascadedBets = await prisma.$transaction(async (tx) => {
    await tx.tip.update({
      where: { id },
      data: { result: result as BetResult, pnl, oddsDecimal },
    });

    const linkedBets = await tx.bet.findMany({ where: { tipId: id } });
    for (const bet of linkedBets) {
      const betOdds =
        bet.oddsDecimal && bet.oddsDecimal > 0
          ? bet.oddsDecimal
          : parseFractionalOddsStrict(bet.odds);
      // If the bet's odds are unparseable, fall back to the tip's
      // oddsDecimal — the user tailed this tip, so the tip's odds are
      // the best available approximation. Log server-side so it can
      // be audited.
      const resolvedBetOdds = betOdds ?? oddsDecimal;
      if (betOdds === null) {
        console.warn(
          `[agent-settle] bet ${bet.id} had unparseable odds "${bet.odds}"; using tip oddsDecimal ${oddsDecimal}`
        );
      }
      const betPnl = calculatePnL(resolvedBetOdds, bet.stake, result as BetResult);
      await tx.bet.update({
        where: { id: bet.id },
        data: {
          result: result as BetResult,
          pnl: betPnl,
          oddsDecimal: resolvedBetOdds,
        },
      });
    }
    return linkedBets.length;
  });

  return {
    status: "ok",
    tip: {
      id: existing.id,
      result: result as BetResult,
      pnl,
      oddsDecimal,
      stake: existing.stake,
    },
    cascadedBets,
  };
}
