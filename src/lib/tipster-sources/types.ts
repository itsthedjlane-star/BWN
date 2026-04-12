import type { BetResult, Sport, TipsterSource } from "@prisma/client";

export interface ScrapedTipster {
  externalId: string;
  name: string;
  sport: Sport | null;
  profileUrl: string | null;
  roi: number | null;
  strikeRate: number | null;
  totalTips: number;
  profitPts: number | null;
  activeSince: Date | null;
  form10: string | null;
  sourceRank: number | null;
}

export interface ScrapedTip {
  tipsterExternalId: string;
  externalId: string | null;
  sport: Sport;
  event: string;
  selection: string;
  oddsAtTip: string;
  oddsDecimal: number | null;
  eventStartAt: Date | null;
  postedAt: Date;
  result: BetResult;
  profitLoss: number | null;
  sourceUrl: string | null;
}

export interface ScrapeResult {
  source: TipsterSource;
  tipsters: ScrapedTipster[];
  tips: ScrapedTip[];
}

export interface SourceAdapter {
  source: TipsterSource;
  displayName: string;
  homepage: string;
  enabled: boolean;
  fetch(): Promise<ScrapeResult>;
}
