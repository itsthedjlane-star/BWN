import type { ScrapeResult, SourceAdapter } from "./types";

// ToS warning: kickoff.co.uk hosts community tipsters with live bet tracking.
// Review ToS before enabling. The live-bets page updates frequently — cache
// aggressively and never poll more than once per hour.
export const kickoffAdapter: SourceAdapter = {
  source: "KICKOFF",
  displayName: "KickOff",
  homepage: "https://kickoff.co.uk",
  get enabled() {
    return process.env.TIPSTER_SOURCE_KICKOFF === "1";
  },
  async fetch(): Promise<ScrapeResult> {
    // TODO: implement scraping of kickoff.co.uk/tipsters/live-bets once ToS
    // is cleared. Target the top 10 tipsters by all-time profit + their
    // current open picks.
    return { source: "KICKOFF", tipsters: [], tips: [] };
  },
};
