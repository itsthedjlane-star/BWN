import type { ScrapeResult, SourceAdapter } from "./types";

// ToS warning: tipstrr.com is a commercial tipster platform. Review their
// current ToS before enabling. Prefer their public free-tip email digest
// over HTML scraping if it's available.
export const tipstrrAdapter: SourceAdapter = {
  source: "TIPSTRR",
  displayName: "Tipstrr",
  homepage: "https://tipstrr.com",
  get enabled() {
    return process.env.TIPSTER_SOURCE_TIPSTRR === "1";
  },
  async fetch(): Promise<ScrapeResult> {
    // TODO: implement. Prefer their public free tip feed / email digest
    // over HTML scraping. Filter to tipsters with 12+ month verified track
    // records and free tip access.
    return { source: "TIPSTRR", tipsters: [], tips: [] };
  },
};
