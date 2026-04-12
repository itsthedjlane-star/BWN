import type { ScrapeResult, SourceAdapter } from "./types";

// ToS warning: ratedtipsters.com is an independent review site. Review ToS
// before enabling. Leaderboard changes slowly — a monthly fetch is plenty.
export const ratedTipstersAdapter: SourceAdapter = {
  source: "RATED_TIPSTERS",
  displayName: "Rated Tipsters",
  homepage: "https://ratedtipsters.com",
  get enabled() {
    return process.env.TIPSTER_SOURCE_RATED_TIPSTERS === "1";
  },
  async fetch(): Promise<ScrapeResult> {
    // TODO: implement. Target the approved-tipster leaderboard for
    // credibility rankings. This adapter should produce Tipster rows with
    // no TipsterTips — it's a ranking source only.
    return { source: "RATED_TIPSTERS", tipsters: [], tips: [] };
  },
};
