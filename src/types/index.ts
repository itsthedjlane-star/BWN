// These mirror the Prisma enums — defined here so types work before `prisma generate`
export type Sport =
  | "FOOTBALL"
  | "HORSE_RACING"
  | "GREYHOUND_RACING"
  | "CRICKET"
  | "TENNIS"
  | "DARTS"
  | "GOLF";

export type BetResult = "PENDING" | "WON" | "LOST" | "VOID";

export type Role = "ADMIN" | "MEMBER";

export type OddsFormat = "fractional" | "decimal";

export interface OddsData {
  id: string;
  sport: Sport;
  event: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmakers: BookmakerOdds[];
}

export interface BookmakerOdds {
  key: string;
  title: string;
  markets: Market[];
}

export interface Market {
  key: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number; // decimal odds
}

export interface RaceCard {
  id: string;
  meeting: string;
  time: string;
  raceName: string;
  distance: string;
  going: string;
  runners: Runner[];
}

export interface Runner {
  number: number;
  name: string;
  jockey: string;
  trainer: string;
  form: string;
  odds: string;
  weight?: string;
}

export interface MatchFixture {
  id: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoff: string;
  venue?: string;
  status: "upcoming" | "live" | "finished";
  score?: { home: number; away: number };
  stats?: Record<string, string | number>;
}

export interface UserStats {
  totalBets: number;
  totalStaked: number;
  totalReturn: number;
  pnl: number;
  roi: number;
  winRate: number;
  currentStreak: { type: "W" | "L"; count: number };
  bySport: Record<string, { bets: number; pnl: number; roi: number }>;
}
