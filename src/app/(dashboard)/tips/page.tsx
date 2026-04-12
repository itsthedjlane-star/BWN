"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { TipCard } from "@/components/tips/tip-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SPORT_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "FOOTBALL", label: "\u26BD Football" },
  { key: "HORSE_RACING", label: "\uD83C\uDFC7 Racing" },
  { key: "TENNIS", label: "\uD83C\uDFBE Tennis" },
  { key: "CRICKET", label: "\uD83C\uDFCF Cricket" },
  { key: "DARTS", label: "\uD83C\uDFAF Darts" },
  { key: "GOLF", label: "\u26F3 Golf" },
];

const RESULT_FILTERS = ["ALL", "PENDING", "WON", "LOST"];

export default function TipsPage() {
  const { data: session } = useSession();
  const [sportFilter, setSportFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const buildParams = useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams();
      if (sportFilter !== "ALL") params.set("sport", sportFilter);
      if (resultFilter !== "ALL") params.set("result", resultFilter);
      if (cursor) params.set("cursor", cursor);
      return params;
    },
    [sportFilter, resultFilter]
  );

  const fetchTips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tips?${buildParams()}`);
      if (res.ok) {
        const data = await res.json();
        setTips(data.items ?? []);
        setNextCursor(data.nextCursor ?? null);
      }
    } catch (err) {
      console.error("Failed to fetch tips:", err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/tips?${buildParams(nextCursor)}`);
      if (res.ok) {
        const data = await res.json();
        setTips((prev) => [...prev, ...(data.items ?? [])]);
        setNextCursor(data.nextCursor ?? null);
      }
    } catch (err) {
      console.error("Failed to load more tips:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [buildParams, nextCursor, loadingMore]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const wonCount = tips.filter((t) => t.result === "WON").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="text-[#00FF87]" size={24} />
            Tips Feed
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {tips.length} tips posted {wonCount > 0 && `\u00B7 ${wonCount} winners`}
          </p>
        </div>
        {session?.user?.role === "ADMIN" && (
          <Link href="/tips/new">
            <Button size="sm">
              <Plus size={14} className="mr-1.5" />
              Post Tip
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SPORT_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSportFilter(filter.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                sportFilter === filter.key
                  ? "bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {RESULT_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setResultFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                resultFilter === filter
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-900 text-zinc-500 hover:text-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-zinc-500" size={24} />
          </div>
        ) : tips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-zinc-500">No tips yet. Be the first to post one!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {tips.map((tip) => (
              <TipCard key={tip.id} tip={tip} onUpdate={fetchTips} />
            ))}
            {nextCursor && (
              <div className="flex justify-center pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                      Loading
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
