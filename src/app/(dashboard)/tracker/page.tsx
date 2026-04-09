"use client";

import { useState, useEffect, useCallback } from "react";
import { StatsCards } from "@/components/tracker/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  BarChart3,
  Plus,
  TrendingUp,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { UserStats } from "@/types";
import { cn, sportEmoji } from "@/lib/utils";

const SPORTS = [
  { value: "FOOTBALL", label: "\u26BD Football" },
  { value: "HORSE_RACING", label: "\uD83C\uDFC7 Horse Racing" },
  { value: "GREYHOUND_RACING", label: "\uD83D\uDC15 Greyhound Racing" },
  { value: "CRICKET", label: "\uD83C\uDFCF Cricket" },
  { value: "TENNIS", label: "\uD83C\uDFBE Tennis" },
  { value: "DARTS", label: "\uD83C\uDFAF Darts" },
  { value: "GOLF", label: "\u26F3 Golf" },
];

const EMPTY_STATS: UserStats = {
  totalBets: 0,
  totalStaked: 0,
  totalReturn: 0,
  pnl: 0,
  roi: 0,
  winRate: 0,
  currentStreak: { type: "W", count: 0 },
  bySport: {},
};

export default function TrackerPage() {
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogBet, setShowLogBet] = useState(false);
  const [logForm, setLogForm] = useState({
    sport: "FOOTBALL",
    event: "",
    pick: "",
    odds: "",
    stake: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, betsRes] = await Promise.all([
        fetch("/api/bets/stats"),
        fetch("/api/bets"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (betsRes.ok) setBets(await betsRes.json());
    } catch (err) {
      console.error("Failed to fetch tracker data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogBet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logForm),
      });
      if (res.ok) {
        setShowLogBet(false);
        setLogForm({ sport: "FOOTBALL", event: "", pick: "", odds: "", stake: 1 });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to log bet:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const settleBet = async (betId: string, result: "WON" | "LOST" | "VOID") => {
    setSettlingId(betId);
    try {
      const res = await fetch(`/api/bets/${betId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Failed to settle bet:", err);
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-[#00FF87]" size={24} />
            Bet Tracker
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Your personal betting P&L</p>
        </div>
        <Button size="sm" onClick={() => setShowLogBet(!showLogBet)}>
          {showLogBet ? (
            <>
              <X size={14} className="mr-1.5" />
              Cancel
            </>
          ) : (
            <>
              <Plus size={14} className="mr-1.5" />
              Log Bet
            </>
          )}
        </Button>
      </div>

      {/* Log Bet Form */}
      {showLogBet && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log a Bet</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogBet} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Sport
                  </label>
                  <Select
                    value={logForm.sport}
                    onChange={(e) =>
                      setLogForm({ ...logForm, sport: e.target.value })
                    }
                  >
                    {SPORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Odds
                  </label>
                  <Input
                    value={logForm.odds}
                    onChange={(e) =>
                      setLogForm({ ...logForm, odds: e.target.value })
                    }
                    placeholder="e.g. 5/2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Event
                </label>
                <Input
                  value={logForm.event}
                  onChange={(e) =>
                    setLogForm({ ...logForm, event: e.target.value })
                  }
                  placeholder="e.g. Arsenal vs Man City"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Pick
                  </label>
                  <Input
                    value={logForm.pick}
                    onChange={(e) =>
                      setLogForm({ ...logForm, pick: e.target.value })
                    }
                    placeholder="e.g. Arsenal to win"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Stake (units)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={logForm.stake}
                    onChange={(e) =>
                      setLogForm({
                        ...logForm,
                        stake: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Logging..." : "Log Bet"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-zinc-500" size={24} />
        </div>
      ) : (
        <>
          <StatsCards stats={stats} />

          {/* Sport Breakdown */}
          {Object.keys(stats.bySport).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#00FF87]" />
                  Performance by Sport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.bySport).map(([sport, data]) => (
                    <div
                      key={sport}
                      className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span>{sportEmoji(sport)}</span>
                        <span className="text-sm text-white">
                          {sport.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-zinc-500">
                          ({data.bets} bets)
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            data.pnl >= 0 ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {data.pnl >= 0 ? "+" : ""}
                          {data.pnl.toFixed(1)}u
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            data.roi >= 0 ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {data.roi.toFixed(1)}% ROI
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Bets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Bets</CardTitle>
            </CardHeader>
            <CardContent>
              {bets.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No bets logged yet. Log your first bet above!
                </p>
              ) : (
                <div className="space-y-2">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">
                            {sportEmoji(bet.sport)}
                          </span>
                          <span className="text-sm text-white font-medium truncate">
                            {bet.pick}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate">
                          {bet.event}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-sm text-[#00FF87] font-mono">
                          {bet.odds}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {bet.stake}u
                        </span>
                        {bet.result === "PENDING" ? (
                          <div className="flex items-center gap-1">
                            <Badge>PENDING</Badge>
                            <button
                              onClick={() => settleBet(bet.id, "WON")}
                              disabled={settlingId === bet.id}
                              className="p-1 hover:bg-green-500/20 rounded transition-colors"
                              title="Mark as Won"
                            >
                              <CheckCircle
                                size={14}
                                className="text-green-400"
                              />
                            </button>
                            <button
                              onClick={() => settleBet(bet.id, "LOST")}
                              disabled={settlingId === bet.id}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              title="Mark as Lost"
                            >
                              <XCircle size={14} className="text-red-400" />
                            </button>
                            <button
                              onClick={() => settleBet(bet.id, "VOID")}
                              disabled={settlingId === bet.id}
                              className="p-1 hover:bg-yellow-500/20 rounded transition-colors"
                              title="Mark as Void"
                            >
                              <MinusCircle
                                size={14}
                                className="text-yellow-400"
                              />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Badge
                              variant={
                                bet.result === "WON"
                                  ? "success"
                                  : bet.result === "LOST"
                                    ? "danger"
                                    : "warning"
                              }
                            >
                              {bet.result}
                            </Badge>
                            {bet.pnl !== null && (
                              <span
                                className={cn(
                                  "text-sm font-bold w-16 text-right",
                                  bet.pnl >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                )}
                              >
                                {bet.pnl >= 0 ? "+" : ""}
                                {bet.pnl.toFixed(1)}u
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
