import type { Tip, BetResult, Sport, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePnL, fractionalToDecimal } from "@/lib/utils";

/** A tip with just the author fields we need for the digest. */
type TipWithAuthor = Tip & {
  author: Pick<User, "id" | "name" | "image">;
};

export interface DigestTipSummary {
  id: string;
  sport: Sport;
  event: string;
  pick: string;
  odds: string;
  oddsDecimal: number | null;
  stake: number;
  result: BetResult;
  pnl: number | null;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface DigestSportGroup {
  sport: Sport;
  tipCount: number;
  settledCount: number;
  wonCount: number;
  lostCount: number;
  voidCount: number;
  pendingCount: number;
  totalStaked: number;
  totalStakedForRoi: number; // excludes VOIDs
  netPnl: number;
  roi: number | null; // null when undefined (no WON/LOST in group)
  winRate: number | null; // null when undefined (no WON/LOST in group)
}

export interface DigestPayload {
  window: {
    from: string; // ISO
    to: string; // ISO
  };
  totals: {
    tipCount: number;
    settledCount: number;
    wonCount: number;
    lostCount: number;
    voidCount: number;
    pendingCount: number;
    totalStaked: number;
    totalStakedForRoi: number;
    netPnl: number;
    roi: number | null;
    winRate: number | null;
  };
  bySport: DigestSportGroup[];
  topWinners: DigestTipSummary[]; // up to 3, sorted by pnl desc
  worstLoss: DigestTipSummary | null;
  standout: DigestTipSummary | null; // single highest pnl (same as topWinners[0] if any)
  pendingInWindow: number;
  quietDay: boolean; // true when no settled tips in window
}

/**
 * Parses either a stored oddsDecimal or falls back to fractionalToDecimal
 * on the display odds string. Returns null if neither is usable.
 * Matches the pnl-calculator skill: if neither is usable, do not compute.
 */
function resolveDecimalOdds(tip: Tip): number | null {
  if (tip.oddsDecimal != null && tip.oddsDecimal > 1) return tip.oddsDecimal;
  try {
    const d = fractionalToDecimal(tip.odds);
    return Number.isFinite(d) && d > 1 ? d : null;
  } catch {
    return null;
  }
}

function summariseTip(tip: TipWithAuthor): DigestTipSummary {
  return {
    id: tip.id,
    sport: tip.sport,
    event: tip.event,
    pick: tip.pick,
    odds: tip.odds,
    oddsDecimal: tip.oddsDecimal,
    stake: tip.stake,
    result: tip.result,
    pnl: tip.pnl,
    author: {
      id: tip.author.id,
      name: tip.author.name,
      image: tip.author.image,
    },
  };
}

function emptySportGroup(sport: Sport): DigestSportGroup {
  return {
    sport,
    tipCount: 0,
    settledCount: 0,
    wonCount: 0,
    lostCount: 0,
    voidCount: 0,
    pendingCount: 0,
    totalStaked: 0,
    totalStakedForRoi: 0,
    netPnl: 0,
    roi: null,
    winRate: null,
  };
}

function finaliseGroup(group: DigestSportGroup): DigestSportGroup {
  const wl = group.wonCount + group.lostCount;
  return {
    ...group,
    roi:
      group.totalStakedForRoi > 0
        ? group.netPnl / group.totalStakedForRoi
        : null,
    winRate: wl > 0 ? group.wonCount / wl : null,
  };
}

/**
 * Computes the digest payload for a time window.
 *
 * The window is half-open: [from, to). Pass ISO strings or Date objects.
 * Tips are included in the window based on their settlement time if
 * settled, otherwise their creation time. We use createdAt here because
 * Tip rows do not currently store a settledAt column; once they do, this
 * should be changed to settledAt to avoid excluding late settlements.
 */
export async function buildDigest(
  from: Date,
  to: Date
): Promise<DigestPayload> {
  if (!(from instanceof Date) || !(to instanceof Date) || isNaN(+from) || isNaN(+to)) {
    throw new Error("buildDigest: from and to must be valid Date objects");
  }
  if (from >= to) {
    throw new Error("buildDigest: from must be before to");
  }

  const tips = (await prisma.tip.findMany({
    where: {
      createdAt: {
        gte: from,
        lt: to,
      },
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  })) as TipWithAuthor[];

  // Backfill pnl if missing: if the tip is settled but pnl is null (e.g.
  // legacy rows), recompute on the fly from oddsDecimal+stake so the
  // digest numbers match the canonical formula.
  const enriched = tips.map((tip) => {
    if (tip.result !== "PENDING" && tip.pnl == null) {
      const decimal = resolveDecimalOdds(tip);
      if (decimal != null) {
        const pnl = calculatePnL(decimal, tip.stake, tip.result);
        if (pnl != null) {
          return { ...tip, pnl };
        }
      }
    }
    return tip;
  });

  // Aggregate by sport, and totals across all sports.
  const groups = new Map<Sport, DigestSportGroup>();
  const totals: DigestSportGroup = emptySportGroup("FOOTBALL"); // sport here is ignored; we just reuse the shape

  for (const tip of enriched) {
    let group = groups.get(tip.sport);
    if (!group) {
      group = emptySportGroup(tip.sport);
      groups.set(tip.sport, group);
    }

    group.tipCount++;
    totals.tipCount++;
    group.totalStaked += tip.stake;
    totals.totalStaked += tip.stake;

    switch (tip.result) {
      case "WON":
        group.wonCount++;
        group.settledCount++;
        group.totalStakedForRoi += tip.stake;
        group.netPnl += tip.pnl ?? 0;
        totals.wonCount++;
        totals.settledCount++;
        totals.totalStakedForRoi += tip.stake;
        totals.netPnl += tip.pnl ?? 0;
        break;
      case "LOST":
        group.lostCount++;
        group.settledCount++;
        group.totalStakedForRoi += tip.stake;
        group.netPnl += tip.pnl ?? 0;
        totals.lostCount++;
        totals.settledCount++;
        totals.totalStakedForRoi += tip.stake;
        totals.netPnl += tip.pnl ?? 0;
        break;
      case "VOID":
        group.voidCount++;
        group.settledCount++;
        totals.voidCount++;
        totals.settledCount++;
        break;
      case "PENDING":
        group.pendingCount++;
        totals.pendingCount++;
        break;
    }
  }

  // Winners: settled WON tips ranked by pnl desc, ties broken by higher
  // oddsDecimal (because a bigger price win is more impressive).
  const wonTips = enriched.filter((t) => t.result === "WON" && t.pnl != null);
  wonTips.sort((a, b) => {
    const pnlDelta = (b.pnl ?? 0) - (a.pnl ?? 0);
    if (pnlDelta !== 0) return pnlDelta;
    return (b.oddsDecimal ?? 0) - (a.oddsDecimal ?? 0);
  });
  const topWinners = wonTips.slice(0, 3).map(summariseTip);
  const standout = topWinners[0] ?? null;

  // Worst loss: biggest negative pnl among LOST tips.
  const lostTips = enriched.filter((t) => t.result === "LOST" && t.pnl != null);
  lostTips.sort((a, b) => (a.pnl ?? 0) - (b.pnl ?? 0));
  const worstLoss = lostTips.length ? summariseTip(lostTips[0]) : null;

  const bySport: DigestSportGroup[] = Array.from(groups.values())
    .map(finaliseGroup)
    .sort((a, b) => b.netPnl - a.netPnl);

  const finalisedTotals = finaliseGroup(totals);

  return {
    window: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    totals: {
      tipCount: finalisedTotals.tipCount,
      settledCount: finalisedTotals.settledCount,
      wonCount: finalisedTotals.wonCount,
      lostCount: finalisedTotals.lostCount,
      voidCount: finalisedTotals.voidCount,
      pendingCount: finalisedTotals.pendingCount,
      totalStaked: finalisedTotals.totalStaked,
      totalStakedForRoi: finalisedTotals.totalStakedForRoi,
      netPnl: finalisedTotals.netPnl,
      roi: finalisedTotals.roi,
      winRate: finalisedTotals.winRate,
    },
    bySport,
    topWinners,
    worstLoss,
    standout,
    pendingInWindow: finalisedTotals.pendingCount,
    quietDay: finalisedTotals.settledCount === 0,
  };
}
