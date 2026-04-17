"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OddsData, OddsFormat } from "@/types";
import { sportEmoji, decimalToFractional } from "@/lib/utils";
import { BOOKMAKERS, buildOutboundUrl, isKnownBookmaker } from "@/lib/bookmakers";
import { ExternalLink, BarChart3 } from "lucide-react";
import Link from "next/link";

function formatOdds(price: number, format: OddsFormat): string {
  if (format === "decimal") return price.toFixed(2);
  return decimalToFractional(price);
}

interface OddsCardProps {
  event: OddsData;
  oddsFormat: OddsFormat;
  /**
   * Category slug from the /odds page (e.g. "football"). Needed so the
   * Compare link can fetch the same category feed and find this event
   * again — The Odds API has no by-id endpoint.
   */
  category?: string;
}

export function OddsCard({ event, oddsFormat, category }: OddsCardProps) {
  const bestBookmaker = event.bookmakers[0];
  const market = bestBookmaker?.markets[0];

  if (!market) return null;

  // Find best odds for each outcome across all bookmakers
  const bestOdds: Record<string, { price: number; bookmaker: string; bookmakerKey: string }> = {};
  for (const bm of event.bookmakers) {
    for (const outcome of bm.markets[0]?.outcomes ?? []) {
      if (
        !bestOdds[outcome.name] ||
        outcome.price > bestOdds[outcome.name].price
      ) {
        bestOdds[outcome.name] = {
          price: outcome.price,
          bookmaker: bm.title,
          bookmakerKey: bm.key,
        };
      }
    }
  }

  // Primary CTA: the bookmaker offering the overall best price on any outcome.
  const primaryCta = Object.values(bestOdds)
    .filter((b) => isKnownBookmaker(b.bookmakerKey))
    .sort((a, b) => b.price - a.price)[0];

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

          {/* Bet now CTA row */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            {primaryCta && (
              <a
                href={buildOutboundUrl(primaryCta.bookmakerKey, "odds", event.id)}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#00FF87] text-black text-sm font-semibold hover:bg-[#00FF87]/90 transition-colors"
              >
                Bet with {primaryCta.bookmaker}
                <ExternalLink size={14} />
              </a>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {event.bookmakers
                .filter((bm) => isKnownBookmaker(bm.key))
                .filter((bm) => bm.key !== primaryCta?.bookmakerKey)
                .slice(0, 5)
                .map((bm) => (
                  <a
                    key={bm.key}
                    href={buildOutboundUrl(bm.key, "odds", event.id)}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-zinc-300 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 hover:text-white transition-colors"
                  >
                    {BOOKMAKERS[bm.key.toLowerCase()]?.title ?? bm.title}
                    <ExternalLink size={10} />
                  </a>
                ))}
              {event.bookmakers.length > 1 && (
                <Link
                  href={`/odds/compare/${event.id}${category ? `?sport=${category}` : ""}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-700 hover:text-white hover:border-zinc-600 transition-colors ml-auto"
                >
                  <BarChart3 size={10} />
                  Compare
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
