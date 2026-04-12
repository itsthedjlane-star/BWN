import type { Sport } from "@prisma/client";
import type { ScrapedTip, ScrapedTipster, ScrapeResult, SourceAdapter } from "./types";

// Deterministic set of mock tipsters. Stable across runs so upserts are idempotent.
// Used for local development and when no real sources are enabled.
const TIPSTERS: Array<Omit<ScrapedTipster, "form10"> & { form: string }> = [
  { externalId: "the-value-hunter", name: "The Value Hunter", sport: "FOOTBALL", profileUrl: null, roi: 0.184, strikeRate: 0.31, totalTips: 842, profitPts: 154.9, activeSince: new Date("2021-03-01"), sourceRank: 1, form: "WWLWWLWWLW" },
  { externalId: "maidens-over", name: "Maidens Over", sport: "CRICKET", profileUrl: null, roi: 0.162, strikeRate: 0.44, totalTips: 312, profitPts: 50.6, activeSince: new Date("2022-01-15"), sourceRank: 2, form: "WWWLWLWWWL" },
  { externalId: "racing-ralph", name: "Racing Ralph", sport: "HORSE_RACING", profileUrl: null, roi: 0.154, strikeRate: 0.22, totalTips: 1891, profitPts: 291.2, activeSince: new Date("2019-06-20"), sourceRank: 3, form: "LWWLWLLWWL" },
  { externalId: "accumulator-andy", name: "Accumulator Andy", sport: "FOOTBALL", profileUrl: null, roi: 0.148, strikeRate: 0.19, totalTips: 512, profitPts: 75.8, activeSince: new Date("2020-08-10"), sourceRank: 4, form: "LWLWWLWLWW" },
  { externalId: "ace-smash", name: "Ace Smash", sport: "TENNIS", profileUrl: null, roi: 0.141, strikeRate: 0.52, totalTips: 689, profitPts: 97.1, activeSince: new Date("2021-11-03"), sourceRank: 5, form: "WWLWWWLWWL" },
  { externalId: "bullseye-bob", name: "Bullseye Bob", sport: "DARTS", profileUrl: null, roi: 0.133, strikeRate: 0.41, totalTips: 201, profitPts: 26.7, activeSince: new Date("2023-01-02"), sourceRank: 6, form: "WLWWWLLWWW" },
  { externalId: "fairway-freddie", name: "Fairway Freddie", sport: "GOLF", profileUrl: null, roi: 0.121, strikeRate: 0.12, totalTips: 345, profitPts: 41.7, activeSince: new Date("2020-04-12"), sourceRank: 7, form: "LLWLLWLLWW" },
  { externalId: "paddock-phil", name: "Paddock Phil", sport: "HORSE_RACING", profileUrl: null, roi: 0.118, strikeRate: 0.24, totalTips: 1124, profitPts: 132.6, activeSince: new Date("2020-09-01"), sourceRank: 8, form: "WLLWLWWLWL" },
  { externalId: "prem-pundit", name: "Prem Pundit", sport: "FOOTBALL", profileUrl: null, roi: 0.112, strikeRate: 0.34, totalTips: 976, profitPts: 109.3, activeSince: new Date("2019-02-14"), sourceRank: 9, form: "WWLLWWLWLW" },
  { externalId: "over-under-owen", name: "Over Under Owen", sport: "FOOTBALL", profileUrl: null, roi: 0.107, strikeRate: 0.48, totalTips: 1340, profitPts: 143.4, activeSince: new Date("2018-07-22"), sourceRank: 10, form: "WLWWLWWLWW" },
  { externalId: "grand-slam-greg", name: "Grand Slam Greg", sport: "TENNIS", profileUrl: null, roi: 0.098, strikeRate: 0.57, totalTips: 466, profitPts: 45.7, activeSince: new Date("2022-03-30"), sourceRank: 11, form: "WWWLLWWWLL" },
  { externalId: "la-liga-lad", name: "La Liga Lad", sport: "FOOTBALL", profileUrl: null, roi: 0.092, strikeRate: 0.29, totalTips: 611, profitPts: 56.2, activeSince: new Date("2021-09-18"), sourceRank: 12, form: "LWLWWLWLWW" },
  { externalId: "bundesliga-baron", name: "Bundesliga Baron", sport: "FOOTBALL", profileUrl: null, roi: 0.088, strikeRate: 0.33, totalTips: 418, profitPts: 36.8, activeSince: new Date("2022-06-01"), sourceRank: 13, form: "WLWLWWLLWW" },
  { externalId: "yankee-stakes", name: "Yankee Stakes", sport: "HORSE_RACING", profileUrl: null, roi: 0.079, strikeRate: 0.18, totalTips: 887, profitPts: 70.1, activeSince: new Date("2020-12-05"), sourceRank: 14, form: "LLWLWLLWLW" },
  { externalId: "corner-king", name: "Corner King", sport: "FOOTBALL", profileUrl: null, roi: 0.071, strikeRate: 0.47, totalTips: 298, profitPts: 21.2, activeSince: new Date("2023-02-11"), sourceRank: 15, form: "WWLWWLLWLW" },
  { externalId: "century-break", name: "Century Break", sport: "CRICKET", profileUrl: null, roi: 0.064, strikeRate: 0.38, totalTips: 189, profitPts: 12.1, activeSince: new Date("2022-10-22"), sourceRank: 16, form: "WLWWLLWLLW" },
  { externalId: "180-nigel", name: "180 Nigel", sport: "DARTS", profileUrl: null, roi: 0.058, strikeRate: 0.36, totalTips: 142, profitPts: 8.2, activeSince: new Date("2023-05-08"), sourceRank: 17, form: "LWLWLWWLLW" },
  { externalId: "green-jacket-jim", name: "Green Jacket Jim", sport: "GOLF", profileUrl: null, roi: 0.051, strikeRate: 0.09, totalTips: 212, profitPts: 10.8, activeSince: new Date("2021-04-08"), sourceRank: 18, form: "LLLWLLLWLL" },
  { externalId: "stayers-select", name: "Stayers Select", sport: "HORSE_RACING", profileUrl: null, roi: 0.043, strikeRate: 0.21, totalTips: 734, profitPts: 31.6, activeSince: new Date("2021-01-10"), sourceRank: 19, form: "LWLLWLWLWL" },
  { externalId: "serie-a-sage", name: "Serie A Sage", sport: "FOOTBALL", profileUrl: null, roi: 0.037, strikeRate: 0.31, totalTips: 523, profitPts: 19.4, activeSince: new Date("2022-08-20"), sourceRank: 20, form: "WLLWLWLWLW" },
];

// Deterministic picks per sport — used for today's "fresh" tips.
const PICKS_BY_SPORT: Record<Sport, Array<{ event: string; selection: string; odds: string; decimal: number }>> = {
  FOOTBALL: [
    { event: "Arsenal v Chelsea", selection: "Arsenal to win", odds: "4/5", decimal: 1.8 },
    { event: "Man City v Liverpool", selection: "Over 2.5 goals", odds: "10/11", decimal: 1.91 },
    { event: "Real Madrid v Barcelona", selection: "BTTS", odds: "8/11", decimal: 1.73 },
    { event: "Bayern Munich v Dortmund", selection: "Bayern -1 AH", odds: "5/6", decimal: 1.83 },
    { event: "Inter v Juventus", selection: "Under 2.5 goals", odds: "11/10", decimal: 2.1 },
    { event: "PSG v Marseille", selection: "PSG & BTTS", odds: "7/4", decimal: 2.75 },
  ],
  HORSE_RACING: [
    { event: "Cheltenham 14:50", selection: "Galopin Des Champs WIN", odds: "5/4", decimal: 2.25 },
    { event: "Newmarket 15:10", selection: "City Of Troy E/W", odds: "4/1", decimal: 5.0 },
    { event: "Ascot 15:35", selection: "Auguste Rodin WIN", odds: "7/2", decimal: 4.5 },
    { event: "Kempton 16:00", selection: "Constitution Hill WIN", odds: "6/4", decimal: 2.5 },
  ],
  GREYHOUND_RACING: [
    { event: "Romford 19:12", selection: "Trap 4 WIN", odds: "5/2", decimal: 3.5 },
  ],
  CRICKET: [
    { event: "England v India 2nd Test", selection: "England to win", odds: "6/5", decimal: 2.2 },
    { event: "Australia v South Africa", selection: "Australia top batter Smith", odds: "4/1", decimal: 5.0 },
  ],
  TENNIS: [
    { event: "Alcaraz v Sinner", selection: "Alcaraz in 3 sets", odds: "2/1", decimal: 3.0 },
    { event: "Swiatek v Gauff", selection: "Swiatek -3.5 games", odds: "10/11", decimal: 1.91 },
  ],
  DARTS: [
    { event: "Van Gerwen v Price", selection: "Van Gerwen 4-2", odds: "9/2", decimal: 5.5 },
    { event: "Humphries v Aspinall", selection: "Over 10.5 180s", odds: "4/5", decimal: 1.8 },
  ],
  GOLF: [
    { event: "The Masters", selection: "Scheffler top 5", odds: "2/1", decimal: 3.0 },
    { event: "The Open", selection: "McIlroy to win", odds: "12/1", decimal: 13.0 },
  ],
};

function yyyymmdd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function buildTips(now: Date): ScrapedTip[] {
  const day = yyyymmdd(now);
  const tips: ScrapedTip[] = [];
  for (const tipster of TIPSTERS) {
    const sport = tipster.sport ?? "FOOTBALL";
    const picks = PICKS_BY_SPORT[sport];
    if (!picks || picks.length === 0) continue;
    // Take first two picks for each tipster each day.
    const take = picks.slice(0, 2);
    take.forEach((pick, idx) => {
      tips.push({
        tipsterExternalId: tipster.externalId,
        externalId: `seed-${day}-${tipster.externalId}-${idx}`,
        sport,
        event: pick.event,
        selection: pick.selection,
        oddsAtTip: pick.odds,
        oddsDecimal: pick.decimal,
        eventStartAt: new Date(now.getTime() + (idx + 1) * 3 * 3600 * 1000),
        postedAt: now,
        result: "PENDING",
        profitLoss: null,
        sourceUrl: null,
      });
    });
  }
  return tips;
}

export const seedAdapter: SourceAdapter = {
  source: "SEED",
  displayName: "Seed (mock data)",
  homepage: "https://example.local",
  get enabled() {
    return process.env.NODE_ENV !== "production" || process.env.TIPSTER_SOURCE_SEED === "1";
  },
  async fetch(): Promise<ScrapeResult> {
    const now = new Date();
    const tipsters: ScrapedTipster[] = TIPSTERS.map(({ form, ...rest }) => ({
      ...rest,
      form10: form,
    }));
    return {
      source: "SEED",
      tipsters,
      tips: buildTips(now),
    };
  },
};
