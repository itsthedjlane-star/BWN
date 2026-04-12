import type { Sport, Tipster, TipsterTip } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LeaderboardRow = Tipster & {
  _count: { tips: number };
};

export interface LeaderboardOptions {
  sport?: Sport | "ALL";
  limit?: number;
}

export async function getLeaderboard(
  opts: LeaderboardOptions = {}
): Promise<LeaderboardRow[]> {
  const limit = opts.limit ?? 50;
  const rows = await prisma.tipster.findMany({
    where: opts.sport && opts.sport !== "ALL" ? { sport: opts.sport } : undefined,
    include: { _count: { select: { tips: true } } },
    orderBy: [
      { roi: { sort: "desc", nulls: "last" } },
      { profitPts: { sort: "desc", nulls: "last" } },
    ],
    take: limit,
  });
  return rows;
}

export async function getTipsterBySlug(slug: string): Promise<Tipster | null> {
  return prisma.tipster.findUnique({ where: { slug } });
}

export async function getTipsterTips(
  tipsterId: string,
  limit = 20
): Promise<TipsterTip[]> {
  return prisma.tipsterTip.findMany({
    where: { tipsterId },
    orderBy: { postedAt: "desc" },
    take: limit,
  });
}

export interface ConsensusPick {
  event: string;
  sport: Sport;
  selection: string;
  tipsterCount: number;
  avgRoi: number | null;
  minOdds: number | null;
  maxOdds: number | null;
  tipIds: string[];
}

/**
 * Finds events where multiple tipsters are backing the same selection.
 * Grouped by (sport, event, selection) for pending tips within the last 48h.
 * Returns groups of 2 or more tipsters.
 */
export async function getConsensusPicks(
  minTipsters = 2
): Promise<ConsensusPick[]> {
  const since = new Date(Date.now() - 48 * 3600 * 1000);
  const tips = await prisma.tipsterTip.findMany({
    where: { result: "PENDING", postedAt: { gte: since } },
    include: { tipster: { select: { id: true, roi: true } } },
  });

  const groups = new Map<string, TipsterTip[]>();
  for (const tip of tips) {
    const key = `${tip.sport}|${tip.event.toLowerCase().trim()}|${tip.selection.toLowerCase().trim()}`;
    const list = groups.get(key) ?? [];
    list.push(tip);
    groups.set(key, list);
  }

  const consensus: ConsensusPick[] = [];
  for (const list of groups.values()) {
    const uniqueTipsters = new Set(list.map((t) => t.tipsterId));
    if (uniqueTipsters.size < minTipsters) continue;

    const rois: number[] = [];
    const oddsList: number[] = [];
    for (const tip of list) {
      const tipsterRoi = (tip as TipsterTip & { tipster: { roi: number | null } }).tipster.roi;
      if (typeof tipsterRoi === "number") rois.push(tipsterRoi);
      if (typeof tip.oddsDecimal === "number") oddsList.push(tip.oddsDecimal);
    }

    consensus.push({
      event: list[0].event,
      sport: list[0].sport,
      selection: list[0].selection,
      tipsterCount: uniqueTipsters.size,
      avgRoi: rois.length ? rois.reduce((a, b) => a + b, 0) / rois.length : null,
      minOdds: oddsList.length ? Math.min(...oddsList) : null,
      maxOdds: oddsList.length ? Math.max(...oddsList) : null,
      tipIds: list.map((t) => t.id),
    });
  }

  consensus.sort((a, b) => {
    if (b.tipsterCount !== a.tipsterCount) return b.tipsterCount - a.tipsterCount;
    return (b.avgRoi ?? 0) - (a.avgRoi ?? 0);
  });
  return consensus;
}

export function formatRoi(roi: number | null): string {
  if (roi === null || roi === undefined) return "—";
  const pct = roi * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function formatStrikeRate(rate: number | null): string {
  if (rate === null || rate === undefined) return "—";
  return `${(rate * 100).toFixed(0)}%`;
}

export function formatProfit(pts: number | null): string {
  if (pts === null || pts === undefined) return "—";
  const sign = pts > 0 ? "+" : "";
  return `${sign}${pts.toFixed(1)}u`;
}
