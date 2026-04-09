"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Percent, Flame, DollarSign } from "lucide-react";
import { UserStats } from "@/types";

interface StatsCardsProps {
  stats: UserStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total P&L",
      value: `${stats.pnl >= 0 ? "+" : ""}${stats.pnl.toFixed(2)}u`,
      icon: stats.pnl >= 0 ? TrendingUp : TrendingDown,
      color: stats.pnl >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "ROI",
      value: `${stats.roi.toFixed(1)}%`,
      icon: Percent,
      color: stats.roi >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Win Rate",
      value: `${stats.winRate.toFixed(0)}%`,
      icon: Target,
      color: "text-[#00FF87]",
    },
    {
      label: "Total Bets",
      value: stats.totalBets.toString(),
      icon: DollarSign,
      color: "text-zinc-300",
    },
    {
      label: "Streak",
      value: `${stats.currentStreak.count}${stats.currentStreak.type}`,
      icon: Flame,
      color: stats.currentStreak.type === "W" ? "text-green-400" : "text-red-400",
    },
    {
      label: "Total Staked",
      value: `${stats.totalStaked.toFixed(1)}u`,
      icon: DollarSign,
      color: "text-zinc-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={14} className="text-zinc-500" />
              <span className="text-xs text-zinc-500">{card.label}</span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
