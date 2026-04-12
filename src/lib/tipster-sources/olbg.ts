import type { ScrapeResult, SourceAdapter } from "./types";

// ToS warning: olbg.com prohibits automated data collection in its terms.
// Do NOT enable this adapter without reviewing current ToS and obtaining
// permission where required. See README.md in this directory.
export const olbgAdapter: SourceAdapter = {
  source: "OLBG",
  displayName: "OLBG",
  homepage: "https://www.olbg.com",
  get enabled() {
    return process.env.TIPSTER_SOURCE_OLBG === "1";
  },
  async fetch(): Promise<ScrapeResult> {
    // TODO: implement scraping of olbg.com/best-tipsters once ToS is cleared.
    // Target: top football + racing tipster leaderboard, plus each tipster's
    // current pending tips. Use a 1-req/sec limiter and descriptive UA.
    return { source: "OLBG", tipsters: [], tips: [] };
  },
};
