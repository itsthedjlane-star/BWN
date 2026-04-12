import Link from "next/link";
import type { Sport } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { sportEmoji } from "@/lib/utils";
import {
  getLeaderboard,
  formatRoi,
  formatStrikeRate,
  formatProfit,
} from "@/lib/tipster-intelligence";
import { cn } from "@/lib/utils";

const SPORT_FILTERS: Array<{ key: Sport | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "FOOTBALL", label: "\u26BD Football" },
  { key: "HORSE_RACING", label: "\uD83C\uDFC7 Racing" },
  { key: "CRICKET", label: "\uD83C\uDFCF Cricket" },
  { key: "TENNIS", label: "\uD83C\uDFBE Tennis" },
  { key: "DARTS", label: "\uD83C\uDFAF Darts" },
  { key: "GOLF", label: "\u26F3 Golf" },
];

function isSport(value: string | undefined): value is Sport | "ALL" {
  if (!value) return false;
  return SPORT_FILTERS.some((f) => f.key === value);
}

function FormDot({ result }: { result: string }) {
  const base = "inline-block w-2.5 h-2.5 rounded-full";
  if (result === "W") return <span className={cn(base, "bg-green-400")} />;
  if (result === "L") return <span className={cn(base, "bg-red-400")} />;
  return <span className={cn(base, "bg-zinc-600")} />;
}

function RoiIndicator({ roi }: { roi: number | null }) {
  if (roi === null || roi === undefined)
    return <Minus size={14} className="text-zinc-600" />;
  if (roi > 0.05) return <TrendingUp size={14} className="text-green-400" />;
  if (roi < 0) return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-zinc-500" />;
}

export default async function TipstersPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const params = await searchParams;
  const sport = isSport(params.sport) ? params.sport : "ALL";
  const rows = await getLeaderboard({ sport, limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-[#00FF87]" size={24} />
          Tipster Leaderboard
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Verified tipsters from external sources, ranked by ROI.
          {rows.length > 0 && ` ${rows.length} tracked.`}
        </p>
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SPORT_FILTERS.map((filter) => {
          const href = filter.key === "ALL" ? "/tipsters" : `/tipsters?sport=${filter.key}`;
          const active = sport === filter.key;
          return (
            <Link
              key={filter.key}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                active
                  ? "bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">
              No tipsters tracked yet. The daily cron will populate this page.
            </p>
            <p className="text-xs text-zinc-600 mt-2">
              Run <code className="text-zinc-400">GET /api/cron/tipsters</code> with a valid CRON_SECRET to seed data manually.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                    <th className="text-left px-4 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Tipster</th>
                    <th className="text-left px-4 py-3 font-medium">Source</th>
                    <th className="text-left px-4 py-3 font-medium">Sport</th>
                    <th className="text-right px-4 py-3 font-medium">ROI</th>
                    <th className="text-right px-4 py-3 font-medium">Strike</th>
                    <th className="text-right px-4 py-3 font-medium">Profit</th>
                    <th className="text-right px-4 py-3 font-medium">Tips</th>
                    <th className="text-left px-4 py-3 font-medium">Form (L10)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t, idx) => (
                    <tr
                      key={t.id}
                      className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/tipsters/${t.slug}`}
                          className="text-white font-medium hover:text-[#00FF87]"
                        >
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{t.source.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {t.sport ? (
                          <>
                            {sportEmoji(t.sport)} {t.sport.replace(/_/g, " ")}
                          </>
                        ) : (
                          <span className="text-zinc-600">Multi</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <RoiIndicator roi={t.roi} />
                          <span
                            className={cn(
                              "font-bold",
                              t.roi && t.roi > 0
                                ? "text-[#00FF87]"
                                : t.roi && t.roi < 0
                                ? "text-red-400"
                                : "text-zinc-400"
                            )}
                          >
                            {formatRoi(t.roi)}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-300">
                        {formatStrikeRate(t.strikeRate)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-300">
                        {formatProfit(t.profitPts)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500">
                        {t.totalTips.toLocaleString("en-GB")}
                      </td>
                      <td className="px-4 py-3">
                        {t.form10 ? (
                          <div className="flex items-center gap-1">
                            {t.form10.split("").slice(0, 10).map((r, i) => (
                              <FormDot key={i} result={r} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
