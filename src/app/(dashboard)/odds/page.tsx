"use client";

import { useState, useEffect } from "react";
import { OddsCard } from "@/components/odds/odds-card";
import { OddsToggle } from "@/components/odds/odds-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OddsData, OddsFormat } from "@/types";
import { cn } from "@/lib/utils";

const SPORT_TABS = [
  { key: "football", label: "Football", emoji: "⚽" },
  { key: "horse_racing", label: "Horse Racing", emoji: "🐎" },
  { key: "greyhound_racing", label: "Greyhounds", emoji: "🐕" },
  { key: "tennis", label: "Tennis", emoji: "🎾" },
  { key: "cricket", label: "Cricket", emoji: "🏏" },
  { key: "darts", label: "Darts", emoji: "🎯" },
  { key: "golf", label: "Golf", emoji: "⛳" },
];

type FetchStatus = "ok" | "quota_exceeded" | "error";

export default function OddsPage() {
  const [odds, setOdds] = useState<OddsData[]>([]);
  const [status, setStatus] = useState<FetchStatus>("ok");
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<OddsFormat>("fractional");
  const [activeSport, setActiveSport] = useState("football");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOdds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/odds?category=${activeSport}`);
      const data = await res.json();
      // New shape: { status, events }. Old bare-array responses still
      // accepted as a safety net during rollout.
      if (Array.isArray(data)) {
        setOdds(data);
        setStatus("ok");
      } else {
        setOdds(Array.isArray(data.events) ? data.events : []);
        setStatus((data.status as FetchStatus) ?? "ok");
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch odds:", err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOdds();
  }, [activeSport]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gauge className="text-[#00FF87]" size={24} />
            Live Odds
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString("en-GB")}`
              : "Loading odds..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OddsToggle format={format} onChange={setFormat} />
          <Button variant="outline" size="sm" onClick={fetchOdds} disabled={loading}>
            <RefreshCw size={14} className={cn("mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Sport Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SPORT_TABS.map((sport) => (
          <button
            key={sport.key}
            onClick={() => setActiveSport(sport.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeSport === sport.key
                ? "bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700"
            )}
          >
            <span>{sport.emoji}</span>
            {sport.label}
          </button>
        ))}
      </div>

      {/* Odds Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 pb-6">
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2 mb-6" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-16 bg-zinc-800 rounded-lg" />
                  <div className="h-16 bg-zinc-800 rounded-lg" />
                  <div className="h-16 bg-zinc-800 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : odds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {status === "quota_exceeded" ? (
              <>
                <AlertTriangle className="mx-auto text-amber-400 mb-3" size={24} />
                <p className="text-amber-400">Odds feed paused.</p>
                <p className="text-xs text-zinc-500 mt-2">
                  The live-odds provider&apos;s usage quota has been reached for this billing period.
                </p>
              </>
            ) : status === "error" ? (
              <>
                <AlertTriangle className="mx-auto text-red-400 mb-3" size={24} />
                <p className="text-red-400">Couldn&apos;t load odds.</p>
                <p className="text-xs text-zinc-500 mt-2">Try again in a moment.</p>
              </>
            ) : (
              <>
                <p className="text-zinc-500">No odds available for this sport right now.</p>
                <p className="text-xs text-zinc-600 mt-2">Check back closer to match day.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {odds.map((event) => (
            <OddsCard
              key={event.id}
              event={event}
              oddsFormat={format}
              category={activeSport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
