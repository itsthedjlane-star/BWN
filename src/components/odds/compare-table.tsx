"use client";

import { useEffect, useState } from "react";
import { OddsData, OddsFormat } from "@/types";
import { decimalToFractional } from "@/lib/utils";
import { BOOKMAKERS, buildOutboundUrl, isKnownBookmaker } from "@/lib/bookmakers";
import { ExternalLink, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

interface CompareTableProps {
  event: OddsData;
  oddsFormat: OddsFormat;
}

// { [bookmaker]: { [outcome]: [{ price, at }, ...] } }
type HistorySeries = Record<string, Record<string, { price: number; at: string }[]>>;

function formatOdds(price: number, format: OddsFormat): string {
  if (format === "decimal") return price.toFixed(2);
  return decimalToFractional(price);
}

export function OddsCompareTable({ event, oddsFormat }: CompareTableProps) {
  const [history, setHistory] = useState<HistorySeries>({});

  // Lazy-load the 24h price history. Sparklines render only when we
  // have enough data points — empty response is fine, nothing shows.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/odds/${encodeURIComponent(event.id)}/history?hours=24`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.series) setHistory(data.series as HistorySeries);
      })
      .catch(() => {
        /* no history → no sparklines, fine */
      });
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  const firstMarket = event.bookmakers[0]?.markets[0];
  if (!firstMarket) {
    return (
      <p className="text-sm text-zinc-500">
        No market data available for this event.
      </p>
    );
  }

  // Order of outcomes follows the first bookmaker's list — this keeps the
  // columns stable and visually consistent with the summary card.
  const outcomeNames = firstMarket.outcomes.map((o) => o.name);

  // Per-outcome best price + which bookmaker is offering it. Used to
  // highlight the winning cell in each column and to build the affiliate
  // deep-link on that cell.
  const bestByOutcome: Record<string, { price: number; bookmakerKey: string }> = {};
  for (const bm of event.bookmakers) {
    const market = bm.markets[0];
    if (!market) continue;
    for (const outcome of market.outcomes) {
      const existing = bestByOutcome[outcome.name];
      if (!existing || outcome.price > existing.price) {
        bestByOutcome[outcome.name] = { price: outcome.price, bookmakerKey: bm.key };
      }
    }
  }

  // Arbitrage check — sum of inverse best prices across every outcome.
  // < 1 means a guaranteed-return bet is theoretically available by
  // splitting stake across the winning book per outcome. Only meaningful
  // for markets where every outcome is offered by at least one book.
  const bestPrices = outcomeNames.map((name) => bestByOutcome[name]?.price);
  const allPresent = bestPrices.every((p) => typeof p === "number" && p > 0);
  const margin = allPresent
    ? bestPrices.reduce((acc, p) => acc + 1 / (p as number), 0)
    : null;
  const isArb = margin !== null && margin < 1;
  const bookPercent = margin !== null ? margin * 100 : null;

  return (
    <div className="space-y-4">
      {/* Arbitrage / overround banner */}
      {margin !== null && (
        <div
          className={cn(
            "rounded-lg border p-3 flex items-start gap-3",
            isArb
              ? "border-[#00FF87]/40 bg-[#00FF87]/5 text-[#00FF87]"
              : "border-zinc-800 bg-zinc-900 text-zinc-400"
          )}
        >
          <TrendingUp size={18} className="shrink-0 mt-0.5" />
          <div className="text-xs">
            {isArb ? (
              <>
                <span className="font-semibold">Arbitrage available.</span>{" "}
                Combined book {bookPercent!.toFixed(2)}% — backing the best
                price on every outcome returns more than stake.
              </>
            ) : (
              <>
                Combined book {bookPercent!.toFixed(2)}% — standard operator
                margin. No arb.
              </>
            )}
          </div>
        </div>
      )}

      {/* Price matrix */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="text-left font-medium pb-2 pr-4">Bookmaker</th>
              {outcomeNames.map((name) => (
                <th
                  key={name}
                  className="text-center font-medium pb-2 px-2 whitespace-nowrap"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {event.bookmakers.map((bm) => {
              const market = bm.markets[0];
              const priceByOutcome: Record<string, number> = {};
              for (const o of market?.outcomes ?? []) {
                priceByOutcome[o.name] = o.price;
              }
              const known = isKnownBookmaker(bm.key);
              const title = BOOKMAKERS[bm.key.toLowerCase()]?.title ?? bm.title;
              return (
                <tr key={bm.key} className="border-t border-zinc-800">
                  <td className="py-3 pr-4 text-zinc-300 font-medium whitespace-nowrap">
                    {title}
                  </td>
                  {outcomeNames.map((name) => {
                    const price = priceByOutcome[name];
                    const isBest =
                      price !== undefined &&
                      bestByOutcome[name]?.bookmakerKey === bm.key &&
                      event.bookmakers.length > 1;
                    if (price === undefined) {
                      return (
                        <td
                          key={name}
                          className="text-center py-3 px-2 text-zinc-600"
                        >
                          —
                        </td>
                      );
                    }
                    const historyValues =
                      history[bm.key.toLowerCase()]?.[name]?.map((p) => p.price) ?? [];
                    const cell = (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 font-mono",
                          isBest
                            ? "text-[#00FF87] font-bold"
                            : "text-zinc-300"
                        )}
                      >
                        {formatOdds(price, oddsFormat)}
                        {historyValues.length >= 2 && (
                          <Sparkline values={historyValues} />
                        )}
                        {known && <ExternalLink size={10} className="opacity-60" />}
                      </span>
                    );
                    return (
                      <td key={name} className="text-center py-3 px-2">
                        {known ? (
                          <a
                            href={buildOutboundUrl(bm.key, "odds", event.id)}
                            target="_blank"
                            rel="noopener noreferrer nofollow sponsored"
                            className={cn(
                              "inline-block px-2 py-1 rounded hover:bg-zinc-800 transition-colors",
                              isBest &&
                                "ring-1 ring-[#00FF87]/30 bg-[#00FF87]/5 hover:bg-[#00FF87]/10"
                            )}
                            aria-label={`Bet on ${name} with ${title} at ${formatOdds(price, oddsFormat)}`}
                          >
                            {cell}
                          </a>
                        ) : (
                          <span className="inline-block px-2 py-1">{cell}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
