import type { OddsData, Sport } from "@/types";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const API_KEY = process.env.ODDS_API_KEY;

// Legacy single-key mappings kept for backward compatibility with callers
// that still pass raw sport keys (cron, agent tools). Prefer
// resolveCategoryToSportKeys / fetchOddsForCategory in new code.
export const SPORT_KEYS: Record<string, string> = {
  FOOTBALL: "soccer_epl",
  TENNIS: "tennis_atp_french_open",
  CRICKET: "cricket_icc_world_cup",
  DARTS: "darts_pdc",
  GOLF: "golf_pga_championship",
};

export const FOOTBALL_LEAGUES: Record<string, string> = {
  "Premier League": "soccer_epl",
  "Champions League": "soccer_uefa_champs_league",
  "La Liga": "soccer_spain_la_liga",
  "Serie A": "soccer_italy_serie_a",
  Bundesliga: "soccer_germany_bundesliga",
  "Ligue 1": "soccer_france_ligue_one",
};

export type OddsCategory =
  | "football"
  | "tennis"
  | "cricket"
  | "darts"
  | "golf"
  | "horse_racing"
  | "greyhound_racing";

export const ODDS_CATEGORIES: OddsCategory[] = [
  "football",
  "tennis",
  "cricket",
  "darts",
  "golf",
  "horse_racing",
  "greyhound_racing",
];

type OddsMarket = "h2h" | "outrights";

// Some Odds API groups only publish outright (tournament-winner) markets —
// calling them with markets=h2h returns INVALID_MARKET_COMBO and zero
// events. Golf is the obvious one on our list; the rest genuinely have
// H2H match-ups when in season.
const CATEGORY_MARKET: Record<OddsCategory, OddsMarket> = {
  football: "h2h",
  tennis: "h2h",
  cricket: "h2h",
  darts: "h2h",
  golf: "outrights",
  horse_racing: "h2h",
  greyhound_racing: "h2h",
};

export type OddsFetchStatus = "ok" | "quota_exceeded" | "error";

export interface OddsFetchResult {
  status: OddsFetchStatus;
  events: OddsData[];
}

/** Thrown by fetchOdds when the Odds API reports OUT_OF_USAGE_CREDITS. */
export class OddsQuotaError extends Error {
  constructor() {
    super("Odds API usage quota exceeded");
    this.name = "OddsQuotaError";
  }
}

// The Odds API groups its sports by these human strings. When Odds API
// renames a group we only update here.
const CATEGORY_TO_GROUP: Record<OddsCategory, string> = {
  football: "Soccer",
  tennis: "Tennis",
  cricket: "Cricket",
  darts: "Darts",
  golf: "Golf",
  horse_racing: "Horse Racing",
  greyhound_racing: "Greyhound Racing",
};

// Fallback keys used when the /sports discovery endpoint is unreachable
// (e.g. no API key in dev). Return every key we know about for the category
// so football gets all six leagues instead of just EPL.
const CATEGORY_FALLBACK_KEYS: Record<OddsCategory, string[]> = {
  football: Object.values(FOOTBALL_LEAGUES),
  tennis: ["tennis_atp_french_open", "tennis_wta_french_open"],
  cricket: ["cricket_icc_world_cup", "cricket_test_match", "cricket_the_hundred"],
  darts: ["darts_pdc"],
  golf: ["golf_pga_championship", "golf_masters_tournament", "golf_the_open_championship"],
  horse_racing: [],
  greyhound_racing: [],
};

interface SportInfo {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export async function fetchActiveSports(): Promise<SportInfo[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(
      `${ODDS_API_BASE}/sports/?apiKey=${API_KEY}&all=false`,
      { next: { revalidate: 3600 } } // 1 hour cache
    );
    if (!res.ok) {
      console.error(`Sports list API error: ${res.status}`);
      return [];
    }
    return (await res.json()) as SportInfo[];
  } catch (err) {
    console.error("Failed to fetch sports list:", err);
    return [];
  }
}

/**
 * Returns every active sport key whose `group` matches the requested
 * category. Falls back to the static list in `CATEGORY_FALLBACK_KEYS` if
 * discovery returns nothing — those keys may be inactive and will just
 * return zero events, which the UI handles.
 */
export async function resolveCategoryToSportKeys(
  category: OddsCategory
): Promise<string[]> {
  const group = CATEGORY_TO_GROUP[category];
  const sports = await fetchActiveSports();
  const active = sports.filter((s) => s.group === group && s.active);
  if (active.length > 0) return active.map((s) => s.key);
  return CATEGORY_FALLBACK_KEYS[category];
}

/** Backward-compat helper — returns the first resolved key or fallback. */
export async function resolveCategoryToSportKey(
  category: OddsCategory
): Promise<string> {
  const keys = await resolveCategoryToSportKeys(category);
  return keys[0] ?? CATEGORY_FALLBACK_KEYS[category][0] ?? "soccer_epl";
}

/**
 * Fetches odds for every active sport key in the category in parallel,
 * flattens, and sorts by kick-off. Individual fetch failures are swallowed
 * so one bad key doesn't break the whole tab — unless every single fetch
 * failed with a quota error, in which case we surface that status so the
 * UI can distinguish "plan paused" from "nothing scheduled".
 */
export async function fetchOddsForCategory(
  category: OddsCategory
): Promise<OddsFetchResult> {
  const keys = await resolveCategoryToSportKeys(category);
  if (keys.length === 0) return { status: "ok", events: [] };
  const market = CATEGORY_MARKET[category];
  const settled = await Promise.allSettled(keys.map((k) => fetchOdds(k, market)));
  const events: OddsData[] = [];
  let anyQuota = false;
  let anyError = false;
  for (const r of settled) {
    if (r.status === "fulfilled") {
      events.push(...r.value);
    } else if (r.reason instanceof OddsQuotaError) {
      anyQuota = true;
    } else {
      anyError = true;
    }
  }
  events.sort((a, b) => a.commenceTime.localeCompare(b.commenceTime));
  // Status precedence: if we got any events, we're OK — show them even if
  // some sibling keys hit quota. Only escalate to quota/error when the
  // whole fanout produced nothing, so the empty-state UI tells the user
  // why it's empty.
  const status: OddsFetchStatus =
    events.length > 0 ? "ok" : anyQuota ? "quota_exceeded" : anyError ? "error" : "ok";
  return { status, events };
}

interface OddsAPIResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  // Null on outright markets — outright events have a pool of runners/
  // players rather than a home/away pair.
  home_team: string | null;
  away_team: string | null;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: { name: string; price: number }[];
    }[];
  }[];
}

export async function fetchOdds(
  sportKey: string,
  market: OddsMarket = "h2h"
): Promise<OddsData[]> {
  if (!API_KEY) {
    console.warn("ODDS_API_KEY not set, using mock data");
    return getMockOdds(sportKey);
  }

  const res = await fetch(
    `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=uk&markets=${market}&oddsFormat=decimal`,
    { next: { revalidate: 300 } } // 5 min cache
  );

  if (!res.ok) {
    // The Odds API returns a JSON body with error_code; try to read it so
    // we can distinguish quota vs. other errors.
    let errorCode: string | undefined;
    try {
      const body = (await res.json()) as { error_code?: string };
      errorCode = body?.error_code;
    } catch {
      // body wasn't JSON — fall through
    }
    console.error(`Odds API ${sportKey} error: ${res.status} ${errorCode ?? ""}`);
    if (errorCode === "OUT_OF_USAGE_CREDITS") throw new OddsQuotaError();
    // Treat "benign" shape errors as empty rather than failures — a
    // sport key that's out of season or the wrong market for this sport
    // just means "no events here", not "something broke".
    if (
      errorCode === "INVALID_MARKET_COMBO" ||
      errorCode === "UNKNOWN_SPORT" ||
      errorCode === "INVALID_SPORT"
    ) {
      return [];
    }
    throw new Error(`Odds API error: ${res.status}`);
  }

  const data: OddsAPIResponse[] = await res.json();

  return data.map((event) => ({
    id: event.id,
    sport: sportKeyToSport(event.sport_key),
    event:
      event.home_team && event.away_team
        ? `${event.home_team} vs ${event.away_team}`
        : event.sport_title || sportKey,
    homeTeam: event.home_team ?? "",
    awayTeam: event.away_team ?? "",
    commenceTime: event.commence_time,
    bookmakers: event.bookmakers.map((bm) => ({
      key: bm.key,
      title: bm.title,
      markets: bm.markets.map((m) => ({
        key: m.key,
        outcomes: m.outcomes,
      })),
    })),
  }));
}

function sportKeyToSport(key: string): Sport {
  if (key.startsWith("soccer")) return "FOOTBALL";
  if (key.startsWith("tennis")) return "TENNIS";
  if (key.startsWith("cricket")) return "CRICKET";
  if (key.startsWith("darts")) return "DARTS";
  if (key.startsWith("golf")) return "GOLF";
  if (key.startsWith("horseracing") || key.startsWith("horse_racing")) return "HORSE_RACING";
  if (key.startsWith("greyhounds") || key.startsWith("greyhound")) return "GREYHOUND_RACING";
  return "FOOTBALL";
}

// Odds format conversion
export function decimalToFractional(decimal: number): string {
  if (decimal <= 1) return "1/1";
  const numerator = decimal - 1;
  // Common fractions lookup
  const fractions: Record<string, string> = {
    "0.5": "1/2",
    "0.33": "1/3",
    "0.25": "1/4",
    "0.2": "1/5",
    "1": "1/1",
    "1.5": "3/2",
    "2": "2/1",
    "2.5": "5/2",
    "3": "3/1",
    "4": "4/1",
    "5": "5/1",
    "6": "6/1",
    "7": "7/1",
    "8": "8/1",
    "9": "9/1",
    "10": "10/1",
    "12": "12/1",
    "14": "14/1",
    "16": "16/1",
    "20": "20/1",
    "25": "25/1",
    "33": "33/1",
    "50": "50/1",
  };

  const key = numerator.toFixed(2).replace(/\.?0+$/, "");
  if (fractions[key]) return fractions[key];

  // Approximate
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const num = Math.round(numerator * 100);
  const den = 100;
  const g = gcd(num, den);
  return `${num / g}/${den / g}`;
}

export function fractionalToDecimal(fractional: string): number {
  const [num, den] = fractional.split("/").map(Number);
  return num / den + 1;
}

// Mock data for development without API key
function getMockOdds(sportKey: string): OddsData[] {
  const mockEvents: Record<string, OddsData[]> = {
    soccer_epl: [
      {
        id: "mock-1",
        sport: "FOOTBALL",
        event: "Arsenal vs Manchester City",
        homeTeam: "Arsenal",
        awayTeam: "Manchester City",
        commenceTime: new Date(Date.now() + 86400000).toISOString(),
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Arsenal", price: 2.5 },
                  { name: "Manchester City", price: 2.8 },
                  { name: "Draw", price: 3.4 },
                ],
              },
            ],
          },
          {
            key: "williamhill",
            title: "William Hill",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Arsenal", price: 2.45 },
                  { name: "Manchester City", price: 2.9 },
                  { name: "Draw", price: 3.3 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "mock-2",
        sport: "FOOTBALL",
        event: "Liverpool vs Chelsea",
        homeTeam: "Liverpool",
        awayTeam: "Chelsea",
        commenceTime: new Date(Date.now() + 172800000).toISOString(),
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Liverpool", price: 1.75 },
                  { name: "Chelsea", price: 4.5 },
                  { name: "Draw", price: 3.8 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "mock-3",
        sport: "FOOTBALL",
        event: "Tottenham vs Aston Villa",
        homeTeam: "Tottenham",
        awayTeam: "Aston Villa",
        commenceTime: new Date(Date.now() + 259200000).toISOString(),
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Tottenham", price: 2.1 },
                  { name: "Aston Villa", price: 3.4 },
                  { name: "Draw", price: 3.5 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "mock-4",
        sport: "FOOTBALL",
        event: "Newcastle vs Brighton",
        homeTeam: "Newcastle",
        awayTeam: "Brighton",
        commenceTime: new Date(Date.now() + 345600000).toISOString(),
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Newcastle", price: 1.9 },
                  { name: "Brighton", price: 4.0 },
                  { name: "Draw", price: 3.6 },
                ],
              },
            ],
          },
        ],
      },
    ],
    tennis_atp_french_open: [
      {
        id: "mock-t1",
        sport: "TENNIS",
        event: "Sinner vs Alcaraz",
        homeTeam: "Jannik Sinner",
        awayTeam: "Carlos Alcaraz",
        commenceTime: new Date(Date.now() + 86400000).toISOString(),
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Jannik Sinner", price: 1.85 },
                  { name: "Carlos Alcaraz", price: 1.95 },
                ],
              },
            ],
          },
        ],
      },
    ],
    cricket_icc_world_cup: [
      {
        id: "mock-c1",
        sport: "CRICKET",
        event: "England vs India",
        homeTeam: "England",
        awayTeam: "India",
        commenceTime: new Date(Date.now() + 86400000).toISOString(),
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "England", price: 2.2 },
                  { name: "India", price: 1.7 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  return mockEvents[sportKey] ?? [];
}
