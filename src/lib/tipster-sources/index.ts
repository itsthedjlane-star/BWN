import type { TipsterSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { seedAdapter } from "./seed";
import { olbgAdapter } from "./olbg";
import { tipstrrAdapter } from "./tipstrr";
import { freeSuperTipsAdapter } from "./free-super-tips";
import { kickoffAdapter } from "./kickoff";
import { ratedTipstersAdapter } from "./rated-tipsters";
import type { ScrapeResult, SourceAdapter } from "./types";

export const adapters: SourceAdapter[] = [
  seedAdapter,
  olbgAdapter,
  tipstrrAdapter,
  freeSuperTipsAdapter,
  kickoffAdapter,
  ratedTipstersAdapter,
];

export function slugify(source: TipsterSource, externalId: string): string {
  return `${source.toLowerCase()}-${externalId}`
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface IngestSummary {
  source: TipsterSource;
  enabled: boolean;
  tipstersUpserted: number;
  tipsUpserted: number;
  error?: string;
}

async function ingestResult(result: ScrapeResult): Promise<Omit<IngestSummary, "enabled">> {
  const tipsterIdByExternal = new Map<string, string>();

  for (const scraped of result.tipsters) {
    const slug = slugify(result.source, scraped.externalId);
    const row = await prisma.tipster.upsert({
      where: {
        source_externalId: {
          source: result.source,
          externalId: scraped.externalId,
        },
      },
      create: {
        source: result.source,
        externalId: scraped.externalId,
        slug,
        name: scraped.name,
        sport: scraped.sport ?? undefined,
        profileUrl: scraped.profileUrl,
        roi: scraped.roi,
        strikeRate: scraped.strikeRate,
        totalTips: scraped.totalTips,
        profitPts: scraped.profitPts,
        activeSince: scraped.activeSince,
        form10: scraped.form10,
        sourceRank: scraped.sourceRank,
      },
      update: {
        name: scraped.name,
        sport: scraped.sport ?? undefined,
        profileUrl: scraped.profileUrl,
        roi: scraped.roi,
        strikeRate: scraped.strikeRate,
        totalTips: scraped.totalTips,
        profitPts: scraped.profitPts,
        activeSince: scraped.activeSince,
        form10: scraped.form10,
        sourceRank: scraped.sourceRank,
        lastSeenAt: new Date(),
      },
    });
    tipsterIdByExternal.set(scraped.externalId, row.id);
  }

  let tipsUpserted = 0;
  for (const tip of result.tips) {
    const tipsterId = tipsterIdByExternal.get(tip.tipsterExternalId);
    if (!tipsterId) continue; // tip without a known tipster — skip
    if (!tip.externalId) {
      // Tips without stable IDs can't be deduplicated safely — just insert.
      await prisma.tipsterTip.create({
        data: {
          tipsterId,
          sport: tip.sport,
          event: tip.event,
          selection: tip.selection,
          oddsAtTip: tip.oddsAtTip,
          oddsDecimal: tip.oddsDecimal,
          eventStartAt: tip.eventStartAt,
          postedAt: tip.postedAt,
          result: tip.result,
          profitLoss: tip.profitLoss,
          sourceUrl: tip.sourceUrl,
        },
      });
      tipsUpserted++;
      continue;
    }
    await prisma.tipsterTip.upsert({
      where: {
        tipsterId_externalId: { tipsterId, externalId: tip.externalId },
      },
      create: {
        tipsterId,
        externalId: tip.externalId,
        sport: tip.sport,
        event: tip.event,
        selection: tip.selection,
        oddsAtTip: tip.oddsAtTip,
        oddsDecimal: tip.oddsDecimal,
        eventStartAt: tip.eventStartAt,
        postedAt: tip.postedAt,
        result: tip.result,
        profitLoss: tip.profitLoss,
        sourceUrl: tip.sourceUrl,
      },
      update: {
        oddsAtTip: tip.oddsAtTip,
        oddsDecimal: tip.oddsDecimal,
        eventStartAt: tip.eventStartAt,
        result: tip.result,
        profitLoss: tip.profitLoss,
      },
    });
    tipsUpserted++;
  }

  return {
    source: result.source,
    tipstersUpserted: result.tipsters.length,
    tipsUpserted,
  };
}

export async function runTipsterScrapes(
  only?: TipsterSource[]
): Promise<IngestSummary[]> {
  const targets = only
    ? adapters.filter((a) => only.includes(a.source))
    : adapters;

  const summaries: IngestSummary[] = [];
  for (const adapter of targets) {
    if (!adapter.enabled) {
      summaries.push({
        source: adapter.source,
        enabled: false,
        tipstersUpserted: 0,
        tipsUpserted: 0,
      });
      continue;
    }
    try {
      const result = await adapter.fetch();
      const ingest = await ingestResult(result);
      summaries.push({ ...ingest, enabled: true });
    } catch (err) {
      summaries.push({
        source: adapter.source,
        enabled: true,
        tipstersUpserted: 0,
        tipsUpserted: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return summaries;
}
