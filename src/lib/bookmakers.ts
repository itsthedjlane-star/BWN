/**
 * Bookmaker registry — maps the `key` values The Odds API returns to
 * homepage URLs and optional affiliate templates. Affiliate templates are
 * read from env vars at runtime (never hard-coded in the repo) so each
 * deployment uses its own tracking IDs.
 *
 * Template placeholders:
 *   {event}     — the Odds API event ID (if we have one)
 *   {market}    — the market key (e.g. "h2h")
 *   {selection} — the outcome name
 *
 * Any placeholder not provided is stripped. If no template is configured
 * for a bookmaker, buildAffiliateUrl falls back to the homeUrl.
 */

export interface BookmakerInfo {
  key: string;
  title: string;
  homeUrl: string;
  envVar: string; // e.g. BOOKMAKER_AFFILIATE_BET365
}

export const BOOKMAKERS: Record<string, BookmakerInfo> = {
  bet365: {
    key: "bet365",
    title: "Bet365",
    homeUrl: "https://www.bet365.com",
    envVar: "BOOKMAKER_AFFILIATE_BET365",
  },
  williamhill: {
    key: "williamhill",
    title: "William Hill",
    homeUrl: "https://sports.williamhill.com",
    envVar: "BOOKMAKER_AFFILIATE_WILLIAMHILL",
  },
  skybet: {
    key: "skybet",
    title: "Sky Bet",
    homeUrl: "https://www.skybet.com",
    envVar: "BOOKMAKER_AFFILIATE_SKYBET",
  },
  paddypower: {
    key: "paddypower",
    title: "Paddy Power",
    homeUrl: "https://www.paddypower.com",
    envVar: "BOOKMAKER_AFFILIATE_PADDYPOWER",
  },
  betfair: {
    key: "betfair",
    title: "Betfair",
    homeUrl: "https://www.betfair.com",
    envVar: "BOOKMAKER_AFFILIATE_BETFAIR",
  },
  ladbrokes: {
    key: "ladbrokes",
    title: "Ladbrokes",
    homeUrl: "https://sports.ladbrokes.com",
    envVar: "BOOKMAKER_AFFILIATE_LADBROKES",
  },
  coral: {
    key: "coral",
    title: "Coral",
    homeUrl: "https://sports.coral.co.uk",
    envVar: "BOOKMAKER_AFFILIATE_CORAL",
  },
  betway: {
    key: "betway",
    title: "Betway",
    homeUrl: "https://betway.com",
    envVar: "BOOKMAKER_AFFILIATE_BETWAY",
  },
  unibet: {
    key: "unibet",
    title: "Unibet",
    homeUrl: "https://www.unibet.co.uk",
    envVar: "BOOKMAKER_AFFILIATE_UNIBET",
  },
  "888sport": {
    key: "888sport",
    title: "888sport",
    homeUrl: "https://www.888sport.com",
    envVar: "BOOKMAKER_AFFILIATE_888SPORT",
  },
};

export interface AffiliateContext {
  eventId?: string;
  marketKey?: string;
  selection?: string;
}

/**
 * Resolve a bookmaker key to a URL — affiliate template if configured,
 * otherwise the homepage. Never throws; always returns a usable URL.
 */
export function buildAffiliateUrl(
  bookmakerKey: string,
  ctx: AffiliateContext = {}
): string {
  const bm = BOOKMAKERS[bookmakerKey.toLowerCase()];
  if (!bm) return "#";

  const template = process.env[bm.envVar];
  if (!template) return bm.homeUrl;

  return template
    .replace(/\{event\}/g, encodeURIComponent(ctx.eventId ?? ""))
    .replace(/\{market\}/g, encodeURIComponent(ctx.marketKey ?? ""))
    .replace(/\{selection\}/g, encodeURIComponent(ctx.selection ?? ""));
}

/** Does this bookmaker key have an entry in our registry? */
export function isKnownBookmaker(key: string): boolean {
  return key.toLowerCase() in BOOKMAKERS;
}

/** Build an internal /api/out URL that logs the click then 302s to the bookmaker. */
export function buildOutboundUrl(
  bookmakerKey: string,
  context: "odds" | "tip" | "tracker",
  ref?: string
): string {
  const params = new URLSearchParams({
    bk: bookmakerKey,
    ctx: context,
  });
  if (ref) params.set("ref", ref);
  return `/api/out?${params.toString()}`;
}
