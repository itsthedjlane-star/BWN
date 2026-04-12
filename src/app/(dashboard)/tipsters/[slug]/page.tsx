import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Trophy,
  Target,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { sportEmoji, formatDate, timeAgo } from "@/lib/utils";
import {
  getTipsterBySlug,
  getTipsterTips,
  formatRoi,
  formatStrikeRate,
  formatProfit,
} from "@/lib/tipster-intelligence";

export default async function TipsterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tipster = await getTipsterBySlug(slug);
  if (!tipster) notFound();

  const tips = await getTipsterTips(tipster.id, 30);
  const wonCount = tips.filter((t) => t.result === "WON").length;
  const lostCount = tips.filter((t) => t.result === "LOST").length;
  const pendingCount = tips.filter((t) => t.result === "PENDING").length;

  return (
    <div className="space-y-6">
      <Link
        href="/tipsters"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to leaderboard
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="text-[#00FF87]" size={22} />
                {tipster.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="info">{tipster.source.replace(/_/g, " ")}</Badge>
                {tipster.sport && (
                  <Badge>
                    {sportEmoji(tipster.sport)} {tipster.sport.replace(/_/g, " ")}
                  </Badge>
                )}
                {tipster.sourceRank !== null && tipster.sourceRank !== undefined && (
                  <Badge variant="default">Source rank #{tipster.sourceRank}</Badge>
                )}
              </div>
              {tipster.activeSince && (
                <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                  <Calendar size={12} />
                  Active since {formatDate(tipster.activeSince)}
                </p>
              )}
            </div>
            {tipster.profileUrl && (
              <a
                href={tipster.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#00FF87] hover:underline"
              >
                View source profile
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-800">
            <Stat label="ROI" value={formatRoi(tipster.roi)} accent={tipster.roi !== null && tipster.roi > 0} />
            <Stat label="Strike rate" value={formatStrikeRate(tipster.strikeRate)} />
            <Stat label="Profit" value={formatProfit(tipster.profitPts)} accent={tipster.profitPts !== null && tipster.profitPts > 0} />
            <Stat label="Total tips" value={tipster.totalTips.toLocaleString("en-GB")} />
          </div>
        </CardContent>
      </Card>

      {/* Recent tips */}
      <div>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target size={14} className="text-[#00FF87]" />
          Recent tips
          <span className="text-zinc-600 font-normal normal-case text-xs ml-1">
            {wonCount}W · {lostCount}L · {pendingCount} pending
          </span>
        </h2>

        {tips.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-zinc-500 text-sm">
                No tips recorded yet for this tipster.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tips.map((tip) => {
              const resultVariant =
                tip.result === "WON"
                  ? "success"
                  : tip.result === "LOST"
                  ? "danger"
                  : tip.result === "VOID"
                  ? "warning"
                  : "default";
              return (
                <Card key={tip.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                          <span>
                            {sportEmoji(tip.sport)} {tip.sport.replace(/_/g, " ")}
                          </span>
                          <span>·</span>
                          <span>{timeAgo(tip.postedAt)}</span>
                        </div>
                        <p className="text-sm text-white truncate">{tip.event}</p>
                        <p className="text-sm text-[#00FF87] font-medium mt-0.5">
                          {tip.selection}{" "}
                          <span className="text-zinc-500 font-normal">
                            @ {tip.oddsAtTip}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant={resultVariant}>{tip.result}</Badge>
                        {tip.profitLoss !== null && tip.profitLoss !== undefined && (
                          <span
                            className={`text-xs font-bold ${tip.profitLoss >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            {tip.profitLoss >= 0 ? "+" : ""}
                            {tip.profitLoss.toFixed(1)}u
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p
        className={`text-lg font-bold mt-0.5 ${accent ? "text-[#00FF87]" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
