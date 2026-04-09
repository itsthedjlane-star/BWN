import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export function calculatePnL(
  odds: number,
  stake: number,
  result: "WON" | "LOST" | "VOID" | "PENDING"
): number | null {
  if (result === "PENDING") return null;
  if (result === "VOID") return 0;
  if (result === "WON") return (odds - 1) * stake;
  return -stake;
}

export function sportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    FOOTBALL: "\u26BD",
    HORSE_RACING: "\uD83C\uDFC7",
    GREYHOUND_RACING: "\uD83D\uDC15",
    CRICKET: "\uD83C\uDFCF",
    TENNIS: "\uD83C\uDFBE",
    DARTS: "\uD83C\uDFAF",
    GOLF: "\u26F3",
  };
  return emojis[sport] ?? "\uD83C\uDFC6";
}

export function resultBadgeColor(result: string): string {
  switch (result) {
    case "WON":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "LOST":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "VOID":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
}

export function confidenceStars(rating: number): string {
  return "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
}

export function formatSport(sport: string): string {
  return sport.replace(/_/g, " ");
}

// Odds format conversion (duplicated from odds.ts for client-side use)
export function decimalToFractional(decimal: number): string {
  if (decimal <= 1) return "1/1";
  const numerator = decimal - 1;
  const fractions: Record<string, string> = {
    "0.5": "1/2", "0.33": "1/3", "0.25": "1/4", "0.2": "1/5",
    "1": "1/1", "1.5": "3/2", "2": "2/1", "2.5": "5/2", "3": "3/1",
    "4": "4/1", "5": "5/1", "6": "6/1", "7": "7/1", "8": "8/1",
    "9": "9/1", "10": "10/1", "12": "12/1", "14": "14/1", "16": "16/1",
    "20": "20/1", "25": "25/1", "33": "33/1", "50": "50/1",
  };
  const key = numerator.toFixed(2).replace(/\.?0+$/, "");
  if (fractions[key]) return fractions[key];
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const num = Math.round(numerator * 100);
  const den = 100;
  const g = gcd(num, den);
  return `${num / g}/${den / g}`;
}

export function fractionalToDecimal(fractional: string): number {
  const [num, den] = fractional.split("/").map(Number);
  if (!num || !den) return 2.0;
  return num / den + 1;
}
