"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OddsData, OddsFormat } from "@/types";
import { sportEmoji, decimalToFractional } from "@/lib/utils";

function formatOdds(price: number, format: OddsFormat): string {
  if (format === "decimal") return price.toFixed(2);
  return decimalToFractional(price);
}

interface OddsCardProps {
  event: OddsData;
  oddsFormat: OddsFormat;
}

export function OddsCard({ event, oddsFormat }: OddsCardProps) {
  const bestBookmaker = event.bookmakers[0];
  const market = bestBookmaker?.markets[0];

  if (!market) return null;

  // Find best odds for each outcome across all bookmakers
  const bestOdds: Record<string, { price: number; bookmaker: string }> = {};
  for (const bm of event.bookmakers) {
    for (const outcome of bm.markets[0]?.outcomes ?? []) {
      if (
        !bestOdds[outcome.name] ||
        outcome.price > bestOdds[outcome.name].price
      ) {
        bestOdds[outcome.name] = { price: outcome.price, bookmaker: bm.title };
      }
    }
  }

  return (
    <Card className="hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {sportEmoji(event.sport)} {event.event}
          </CardTitle>
          <Badge>
            {new Date(event.commenceTime).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </Badge>
        </div>
        <p className="text-xs text-zinc-500">
          {new Date(event.commenceTime).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          kick-off
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Best odds across all bookmakers */}
          <div className="grid grid-cols-3 gap-2">
            {market.outcomes.map((outcome) => {
              const best = bestOdds[outcome.name];
              const isBest =
                best &&
                event.bookmakers.length > 1 &&
                best.price > outcome.price;
              return (
                <button
                  key={outcome.name}
                  className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-[#00FF87]/30 hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <span className="text-xs text-zinc-400 mb-1 truncate w-full text-center">
                    {outcome.name}
                  </span>
                  <span className="text-lg font-bold text-[#00FF87]">
                    {formatOdds(
                      best ? best.price : outcome.price,
                      oddsFormat
                    )}
                  </span>
                  {isBest && (
                    <span className="text-[9px] text-zinc-500 mt-0.5">
                      {best.bookmaker}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bookmaker comparison */}
          {event.bookmakers.length > 1 && (
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">
                {event.bookmakers.length} bookmakers compared
              </p>
              <div className="space-y-1">
                {event.bookmakers.slice(0, 4).map((bm) => (
                  <div
                    key={bm.key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-zinc-400">{bm.title}</span>
                    <div className="flex gap-3">
                      {bm.markets[0]?.outcomes.map((o) => (
                        <span
                          key={o.name}
                          className={`font-mono ${
                            bestOdds[o.name]?.price === o.price &&
                            event.bookmakers.length > 1
                              ? "text-[#00FF87] font-bold"
                              : "text-zinc-300"
                          }`}
                        >
                          {formatOdds(o.price, oddsFormat)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
