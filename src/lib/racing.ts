export type RacingDiscipline = "horses" | "greyhounds";

export interface HorseRunner {
  number: number;
  name: string;
  jockey: string;
  trainer: string;
  form: string;
  odds: string;
  weight: string;
  age: number;
  silks: string;
}

export interface HorseRace {
  time: string;
  name: string;
  distance: string;
  going: string;
  prize: string;
  class: string;
  runners: HorseRunner[];
}

export interface HorseMeeting {
  id: string;
  course: string;
  going: string;
  races: HorseRace[];
}

export interface GreyhoundRunner {
  trap: number;
  name: string;
  form: string;
  odds: string;
  trainer: string;
}

export interface GreyhoundRace {
  time: string;
  name: string;
  distance: string;
  prize: string;
  runners: GreyhoundRunner[];
}

export interface GreyhoundMeeting {
  id: string;
  track: string;
  races: GreyhoundRace[];
}

export type RacingMeeting = HorseMeeting | GreyhoundMeeting;

import { fetchOddsForCategory, decimalToFractional } from "./odds";
import type { OddsData } from "@/types";

const ODDS_API_KEY = process.env.ODDS_API_KEY;

// Map The Odds API events → our meeting/race shapes. Coverage varies by
// day — The Odds API tends to have marquee UK/IE meetings (Cheltenham,
// Aintree, Ascot) and outrights rather than every daily card. The UI
// handles empty meetings with a polite message.
function oddsEventsToHorseMeetings(events: OddsData[]): HorseMeeting[] {
  const byVenue = new Map<string, OddsData[]>();
  for (const ev of events) {
    // sport_title often looks like "Horse Racing - Cheltenham"; fall back
    // to homeTeam which Odds API sometimes uses as the venue/race name.
    const venue = extractVenue(ev);
    const list = byVenue.get(venue) ?? [];
    list.push(ev);
    byVenue.set(venue, list);
  }
  const meetings: HorseMeeting[] = [];
  let id = 1;
  for (const [course, evs] of byVenue) {
    meetings.push({
      id: String(id++),
      course,
      going: "—",
      races: evs.map((ev) => ({
        time: new Date(ev.commenceTime).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        name: ev.event,
        distance: "—",
        going: "—",
        prize: "—",
        class: "—",
        runners: bestOddsRunners(ev).map((r, i) => ({
          number: i + 1,
          name: r.name,
          jockey: "—",
          trainer: "—",
          form: "—",
          odds: decimalToFractional(r.price),
          weight: "—",
          age: 0,
          silks: silkColor(i),
        })),
      })),
    });
  }
  return meetings;
}

function oddsEventsToGreyhoundMeetings(events: OddsData[]): GreyhoundMeeting[] {
  const byVenue = new Map<string, OddsData[]>();
  for (const ev of events) {
    const venue = extractVenue(ev);
    const list = byVenue.get(venue) ?? [];
    list.push(ev);
    byVenue.set(venue, list);
  }
  const meetings: GreyhoundMeeting[] = [];
  let id = 1;
  for (const [track, evs] of byVenue) {
    meetings.push({
      id: String(id++),
      track,
      races: evs.map((ev) => ({
        time: new Date(ev.commenceTime).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        name: ev.event,
        distance: "—",
        prize: "—",
        runners: bestOddsRunners(ev)
          .slice(0, 6)
          .map((r, i) => ({
            trap: i + 1,
            name: r.name,
            form: "—",
            odds: decimalToFractional(r.price),
            trainer: "—",
          })),
      })),
    });
  }
  return meetings;
}

function extractVenue(ev: OddsData): string {
  // Odds API sometimes encodes venue in home_team; other times in event
  // title. Fall back to a generic bucket so nothing silently merges.
  if (ev.homeTeam && ev.homeTeam !== ev.awayTeam) return ev.homeTeam;
  const parts = ev.event.split(" - ");
  return parts[0] ?? "Racing";
}

function bestOddsRunners(ev: OddsData): { name: string; price: number }[] {
  const best = new Map<string, number>();
  for (const bm of ev.bookmakers) {
    for (const outcome of bm.markets[0]?.outcomes ?? []) {
      const existing = best.get(outcome.name);
      if (existing === undefined || outcome.price > existing) {
        best.set(outcome.name, outcome.price);
      }
    }
  }
  return [...best.entries()]
    .map(([name, price]) => ({ name, price }))
    .sort((a, b) => a.price - b.price);
}

function silkColor(i: number): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-zinc-400",
    "bg-pink-500",
  ];
  return colors[i % colors.length];
}

export async function fetchRacingMeetings(
  discipline: RacingDiscipline
): Promise<RacingMeeting[]> {
  // No API key → dev mock so the page is never empty while working offline.
  if (!ODDS_API_KEY) {
    return discipline === "horses" ? MOCK_HORSE_MEETINGS : MOCK_GREYHOUND_MEETINGS;
  }

  try {
    const { events } = await fetchOddsForCategory(
      discipline === "horses" ? "horse_racing" : "greyhound_racing"
    );
    if (events.length === 0) return [];
    return discipline === "horses"
      ? oddsEventsToHorseMeetings(events)
      : oddsEventsToGreyhoundMeetings(events);
  } catch (err) {
    console.error("Racing API error:", err);
    return [];
  }
}

const MOCK_HORSE_MEETINGS: HorseMeeting[] = [
  {
    id: "1",
    course: "Cheltenham",
    going: "Soft",
    races: [
      {
        time: "13:30",
        name: "Novices' Hurdle",
        distance: "2m 4f",
        going: "Soft",
        prize: "\u00A312,000",
        class: "Class 3",
        runners: [
          { number: 1, name: "Thunder Road", jockey: "B. Powell", trainer: "N. Henderson", form: "1-2-1-3", odds: "5/2", weight: "11-7", age: 6, silks: "bg-blue-500" },
          { number: 2, name: "Desert Crown", jockey: "H. Cobden", trainer: "P. Nicholls", form: "2-1-1-P", odds: "3/1", weight: "11-4", age: 7, silks: "bg-green-500" },
          { number: 3, name: "King's Gambit", jockey: "R. Johnson", trainer: "O. Murphy", form: "3-4-2-1", odds: "7/2", weight: "11-0", age: 5, silks: "bg-red-500" },
          { number: 4, name: "Noble Spirit", jockey: "S. Bowen", trainer: "D. Skelton", form: "F-1-3-2", odds: "8/1", weight: "10-12", age: 6, silks: "bg-yellow-500" },
          { number: 5, name: "Blazing Trail", jockey: "J. Moore", trainer: "G. Elliott", form: "1-1-4-5", odds: "10/1", weight: "10-10", age: 8, silks: "bg-purple-500" },
          { number: 6, name: "Silver Arrow", jockey: "T. O'Brien", trainer: "J. O'Neill", form: "2-3-1-4", odds: "12/1", weight: "10-7", age: 5, silks: "bg-zinc-400" },
        ],
      },
      {
        time: "14:10",
        name: "Handicap Chase",
        distance: "3m 1f",
        going: "Soft",
        prize: "\u00A325,000",
        class: "Class 2",
        runners: [
          { number: 1, name: "Iron Duke", jockey: "B. Powell", trainer: "N. Henderson", form: "2-1-3-1", odds: "3/1", weight: "11-10", age: 8, silks: "bg-blue-500" },
          { number: 2, name: "Storm Chaser", jockey: "H. Cobden", trainer: "P. Nicholls", form: "1-P-2-1", odds: "4/1", weight: "11-5", age: 7, silks: "bg-green-500" },
          { number: 3, name: "Celtic Warrior", jockey: "R. Johnson", trainer: "O. Murphy", form: "4-3-1-2", odds: "5/1", weight: "11-0", age: 9, silks: "bg-red-500" },
          { number: 4, name: "Midnight Runner", jockey: "A. Coleman", trainer: "K. Bailey", form: "1-1-2-3", odds: "6/1", weight: "10-12", age: 7, silks: "bg-orange-500" },
          { number: 5, name: "Frontier Gold", jockey: "L. Edwards", trainer: "R. Hobson", form: "3-2-1-P", odds: "14/1", weight: "10-5", age: 10, silks: "bg-amber-500" },
        ],
      },
      {
        time: "14:50",
        name: "Champion Bumper",
        distance: "2m",
        going: "Soft",
        prize: "\u00A318,000",
        class: "Class 1",
        runners: [
          { number: 1, name: "Future Star", jockey: "P. Townend", trainer: "W. Mullins", form: "1-1", odds: "6/4", weight: "11-0", age: 4, silks: "bg-blue-500" },
          { number: 2, name: "Dream Catcher", jockey: "R. Blackmore", trainer: "H. de Bromhead", form: "1-2", odds: "5/2", weight: "11-0", age: 5, silks: "bg-green-500" },
          { number: 3, name: "Northern Light", jockey: "D. Mullins", trainer: "G. Elliott", form: "2-1", odds: "7/1", weight: "11-0", age: 4, silks: "bg-red-500" },
        ],
      },
    ],
  },
  {
    id: "2",
    course: "Kempton",
    going: "Good to Soft",
    races: [
      {
        time: "12:45",
        name: "Maiden Hurdle",
        distance: "2m",
        going: "Good to Soft",
        prize: "\u00A38,000",
        class: "Class 4",
        runners: [
          { number: 1, name: "First Light", jockey: "T. Scudamore", trainer: "D. Pipe", form: "2-3", odds: "2/1", weight: "11-4", age: 5, silks: "bg-blue-500" },
          { number: 2, name: "Dawn Patrol", jockey: "N. de Boinville", trainer: "N. Henderson", form: "3-2", odds: "5/2", weight: "11-4", age: 5, silks: "bg-green-500" },
          { number: 3, name: "Morning Star", jockey: "H. Cobden", trainer: "P. Nicholls", form: "4", odds: "7/1", weight: "11-4", age: 4, silks: "bg-red-500" },
          { number: 4, name: "Whisper Valley", jockey: "J. Burke", trainer: "A. King", form: "F-3", odds: "10/1", weight: "11-4", age: 6, silks: "bg-yellow-500" },
        ],
      },
      {
        time: "13:20",
        name: "Novice Chase",
        distance: "2m 4f",
        going: "Good to Soft",
        prize: "\u00A315,000",
        class: "Class 3",
        runners: [
          { number: 1, name: "Bold Venture", jockey: "B. Powell", trainer: "N. Henderson", form: "1-1-2", odds: "5/4", weight: "11-7", age: 7, silks: "bg-blue-500" },
          { number: 2, name: "Rock Steady", jockey: "H. Cobden", trainer: "P. Nicholls", form: "2-1-3", odds: "3/1", weight: "11-4", age: 6, silks: "bg-green-500" },
          { number: 3, name: "Lucky Charm", jockey: "S. Bowen", trainer: "D. Skelton", form: "3-4-1", odds: "8/1", weight: "11-0", age: 8, silks: "bg-red-500" },
        ],
      },
    ],
  },
  {
    id: "3",
    course: "Aintree",
    going: "Good",
    races: [
      {
        time: "14:00",
        name: "Handicap Hurdle",
        distance: "2m 4f",
        going: "Good",
        prize: "\u00A320,000",
        class: "Class 2",
        runners: [
          { number: 1, name: "Hurricane Force", jockey: "R. Johnson", trainer: "O. Murphy", form: "1-2-1-1", odds: "9/4", weight: "11-12", age: 6, silks: "bg-blue-500" },
          { number: 2, name: "Tidal Wave", jockey: "B. Powell", trainer: "N. Henderson", form: "2-1-3-2", odds: "3/1", weight: "11-7", age: 7, silks: "bg-green-500" },
          { number: 3, name: "Thunder Bolt", jockey: "H. Cobden", trainer: "P. Nicholls", form: "3-1-2-4", odds: "5/1", weight: "11-2", age: 5, silks: "bg-red-500" },
          { number: 4, name: "Rain Dancer", jockey: "A. Coleman", trainer: "K. Bailey", form: "1-4-2-1", odds: "7/1", weight: "10-13", age: 8, silks: "bg-yellow-500" },
        ],
      },
    ],
  },
];

const MOCK_GREYHOUND_MEETINGS: GreyhoundMeeting[] = [
  {
    id: "1",
    track: "Romford",
    races: [
      {
        time: "19:12",
        name: "A3 Grade",
        distance: "400m",
        prize: "\u00A3600",
        runners: [
          { trap: 1, name: "Ballymac Flash", form: "1-2-1-3-2", odds: "2/1", trainer: "M. Wallis" },
          { trap: 2, name: "Droopys Jet", form: "3-1-2-1-4", odds: "3/1", trainer: "K. Hutton" },
          { trap: 3, name: "Priceless Gem", form: "2-4-1-1-3", odds: "7/2", trainer: "P. Janssens" },
          { trap: 4, name: "Salacres Brewer", form: "5-3-3-2-6", odds: "8/1", trainer: "H. Collins" },
          { trap: 5, name: "Kilara Willow", form: "1-1-2-3-1", odds: "5/2", trainer: "M. Wallis" },
          { trap: 6, name: "Romeo Taylor", form: "4-6-4-5-3", odds: "12/1", trainer: "D. Childs" },
        ],
      },
      {
        time: "19:28",
        name: "A5 Grade",
        distance: "400m",
        prize: "\u00A3450",
        runners: [
          { trap: 1, name: "Swift Banker", form: "2-1-3-2-1", odds: "3/1", trainer: "K. Hutton" },
          { trap: 2, name: "Toolbox Annie", form: "1-3-2-4-2", odds: "4/1", trainer: "P. Janssens" },
          { trap: 3, name: "Bright Horizon", form: "4-2-1-1-3", odds: "5/2", trainer: "M. Wallis" },
          { trap: 4, name: "Distant Echo", form: "3-5-4-3-2", odds: "6/1", trainer: "H. Collins" },
          { trap: 5, name: "Pennys Shadow", form: "1-2-2-1-4", odds: "9/4", trainer: "K. Hutton" },
          { trap: 6, name: "Bogger Bunny", form: "5-4-6-5-5", odds: "16/1", trainer: "D. Childs" },
        ],
      },
      {
        time: "19:45",
        name: "A2 Grade",
        distance: "575m",
        prize: "\u00A3800",
        runners: [
          { trap: 1, name: "Kildare Star", form: "1-1-2-1-3", odds: "7/4", trainer: "M. Wallis" },
          { trap: 2, name: "Clares Rocket", form: "2-3-1-2-1", odds: "3/1", trainer: "P. Janssens" },
          { trap: 3, name: "Swift Sally", form: "3-1-4-3-2", odds: "5/1", trainer: "K. Hutton" },
          { trap: 4, name: "Dark Missile", form: "1-4-2-1-5", odds: "4/1", trainer: "H. Collins" },
          { trap: 5, name: "Spring Meadow", form: "2-2-3-4-1", odds: "6/1", trainer: "D. Childs" },
          { trap: 6, name: "Tornado Bob", form: "4-3-5-2-4", odds: "10/1", trainer: "M. Wallis" },
        ],
      },
    ],
  },
  {
    id: "2",
    track: "Shelbourne Park",
    races: [
      {
        time: "20:00",
        name: "A1 Grade",
        distance: "550y",
        prize: "\u20AC1,000",
        runners: [
          { trap: 1, name: "Ballymac Leon", form: "1-1-1-2", odds: "6/4", trainer: "L. Dowling" },
          { trap: 2, name: "Newinn Hazel", form: "2-1-3-1", odds: "3/1", trainer: "G. Holland" },
          { trap: 3, name: "Crickleowl Ace", form: "3-2-1-4", odds: "4/1", trainer: "P. Buckley" },
          { trap: 4, name: "Rising Hawk", form: "1-3-2-2", odds: "5/1", trainer: "G. Holland" },
          { trap: 5, name: "Coolavanny Pip", form: "4-1-2-1", odds: "7/1", trainer: "L. Dowling" },
          { trap: 6, name: "Skywalker Duke", form: "2-4-3-5", odds: "10/1", trainer: "P. Buckley" },
        ],
      },
    ],
  },
];
