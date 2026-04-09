import type { OddsData, Sport } from "@/types";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const API_KEY = process.env.ODDS_API_KEY;

// Sport key mappings for The Odds API
export const SPORT_KEYS: Record<string, string> = {
  FOOTBALL: "soccer_epl",
  TENNIS: "tennis_atp_french_open", // changes per tournament
  CRICKET: "cricket_icc_world_cup",
  DARTS: "darts_pdc",
  GOLF: "golf_pga_championship",
};

export const FOOTBALL_LEAGUES: Record<string, string> = {
  "Premier League": "soccer_epl",
  "Champions League": "soccer_uefa_champs_league",
  "La Liga": "soccer_spain_la_liga",
  "Serie A": "soccer_italy_serie_a",
  "Bundesliga": "soccer_germany_bundesliga",
  "Ligue 1": "soccer_france_ligue_one",
};

interface OddsAPIResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: { name: string; price: number }[];
    }[];
  }[];
}

export async function fetchOdds(sportKey: string): Promise<OddsData[]> {
  if (!API_KEY) {
    console.warn("ODDS_API_KEY not set, using mock data");
    return getMockOdds(sportKey);
  }

  try {
    const res = await fetch(
      `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`,
      { next: { revalidate: 300 } } // 5 min cache
    );

    if (!res.ok) {
      console.error(`Odds API error: ${res.status}`);
      return getMockOdds(sportKey);
    }

    const data: OddsAPIResponse[] = await res.json();

    return data.map((event) => ({
      id: event.id,
      sport: sportKeyToSport(event.sport_key),
      event: `${event.home_team} vs ${event.away_team}`,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
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
  } catch (error) {
    console.error("Failed to fetch odds:", error);
    return getMockOdds(sportKey);
  }
}

function sportKeyToSport(key: string): Sport {
  if (key.startsWith("soccer")) return "FOOTBALL";
  if (key.startsWith("tennis")) return "TENNIS";
  if (key.startsWith("cricket")) return "CRICKET";
  if (key.startsWith("darts")) return "DARTS";
  if (key.startsWith("golf")) return "GOLF";
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

  return mockEvents[sportKey] ?? mockEvents["soccer_epl"]!;
}
