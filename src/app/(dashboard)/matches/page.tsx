"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OddsData } from "@/types";

const SPORT_TABS = [
  { key: "soccer_epl", label: "Premier League", emoji: "\u26BD" },
  { key: "soccer_uefa_champs_league", label: "Champions League", emoji: "\u26BD" },
  { key: "soccer_spain_la_liga", label: "La Liga", emoji: "\u26BD" },
  { key: "soccer_germany_bundesliga", label: "Bundesliga", emoji: "\u26BD" },
  { key: "tennis_atp_french_open", label: "Tennis", emoji: "\uD83C\uDFBE" },
  { key: "cricket_icc_world_cup", label: "Cricket", emoji: "\uD83C\uDFCF" },
  { key: "darts_pdc", label: "Darts", emoji: "\uD83C\uDFAF" },
  { key: "golf_pga_championship", label: "Golf", emoji: "\u26F3" },
];

export default function MatchesPage() {
  const [activeSport, setActiveSport] = useState("soccer_epl");
  const [events, setEvents] = useState<OddsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/odds?sport=${activeSport}`)
      .then((res) => res.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [activeSport]);

  const activeTab = SPORT_TABS.find((t) => t.key === activeSport);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-[#00FF87]" size={24} />
          Match Centre
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Upcoming fixtures & events from live data
        </p>
      </div>

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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-zinc-500" size={24} />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">
              No upcoming events for {activeTab?.label ?? "this sport"}.
            </p>
            <p className="text-xs text-zinc-600 mt-2">
              Check back closer to match day.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const bestOdds = event.bookmakers[0]?.markets[0]?.outcomes;
            return (
              <Card
                key={event.id}
                className="hover:border-zinc-700 transition-colors"
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>{activeTab?.label ?? "Match"}</Badge>
                      </div>
                      <p className="text-white font-semibold text-lg">
                        {event.homeTeam} vs {event.awayTeam}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(event.commenceTime).toLocaleDateString(
                            "en-GB",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            }
                          )}{" "}
                          &mdash;{" "}
                          {new Date(event.commenceTime).toLocaleTimeString(
                            "en-GB",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                    </div>
                    {/* Quick odds preview */}
                    {bestOdds && (
                      <div className="flex gap-2 ml-4">
                        {bestOdds.map((outcome) => (
                          <div
                            key={outcome.name}
                            className="text-center px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 min-w-[60px]"
                          >
                            <p className="text-[10px] text-zinc-500 truncate">
                              {outcome.name === event.homeTeam
                                ? "H"
                                : outcome.name === event.awayTeam
                                  ? "A"
                                  : "D"}
                            </p>
                            <p className="text-sm font-bold text-[#00FF87]">
                              {outcome.price.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
