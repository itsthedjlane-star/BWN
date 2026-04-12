import type { ScrapeResult, SourceAdapter } from "./types";

// ToS warning: freesupertips.com hosts free football tips. Review robots.txt
// and ToS before enabling. Content is published daily — one fetch per day
// is sufficient.
export const freeSuperTipsAdapter: SourceAdapter = {
  source: "FREE_SUPER_TIPS",
  displayName: "Free Super Tips",
  homepage: "https://www.freesupertips.com",
  get enabled() {
    return process.env.TIPSTER_SOURCE_FREE_SUPER_TIPS === "1";
  },
  async fetch(): Promise<ScrapeResult> {
    // TODO: implement. Target daily PL/CL/La Liga/Serie A/Bundesliga/Ligue 1
    // tip pages. No individual tipster profiles on this site — use a single
    // synthetic tipster id of "free-super-tips" for all picks.
    return { source: "FREE_SUPER_TIPS", tipsters: [], tips: [] };
  },
};
