"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { cn, sportEmoji } from "@/lib/utils";
import { OddsData, OddsFormat } from "@/types";
import { OddsCompareTable } from "@/components/odds/compare-table";
import { OddsToggle } from "@/components/odds/odds-toggle";

type Status = "loading" | "ok" | "not_found" | "paused" | "error";

export default function OddsComparePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const search = useSearchParams();
  const category = search.get("sport") ?? "football";

  const [event, setEvent] = useState<OddsData | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [format, setFormat] = useState<OddsFormat>("fractional");

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/odds?category=${encodeURIComponent(category)}`
      );
      const data = await res.json();
      const events: OddsData[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.events)
          ? data.events
          : [];
      const found = events.find((e) => e.id === eventId);
      if (found) {
        setEvent(found);
        setStatus("ok");
      } else if (data?.status === "quota_exceeded") {
        setStatus("paused");
      } else {
        setStatus("not_found");
      }
    } catch (err) {
      console.error("Failed to load compare view:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, category]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/odds"
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to odds
        </Link>
        <div className="flex items-center gap-3">
          <OddsToggle format={format} onChange={setFormat} />
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={status === "loading"}
          >
            <RefreshCw
              size={14}
              className={cn("mr-1.5", status === "loading" && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">
                {event
                  ? `${sportEmoji(event.sport)} ${event.event}`
                  : "Compare prices"}
              </CardTitle>
              {event && (
                <p className="text-xs text-zinc-500 mt-1">
                  {new Date(event.commenceTime).toLocaleString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
            {event && (
              <Badge>{event.bookmakers.length} bookmakers</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex justify-center py-8 text-zinc-500">
              <Loader2 className="animate-spin" size={20} />
            </div>
          )}
          {status === "ok" && event && (
            <OddsCompareTable event={event} oddsFormat={format} />
          )}
          {status === "not_found" && (
            <div className="py-8 text-center text-sm text-zinc-500 space-y-1">
              <p>That event couldn&apos;t be found.</p>
              <p className="text-xs text-zinc-600">
                It may have started or been removed from the feed.
              </p>
            </div>
          )}
          {status === "paused" && (
            <div className="py-8 text-center text-sm text-amber-400 space-y-1">
              <p>Odds feed paused.</p>
              <p className="text-xs text-zinc-500">
                The live-odds provider&apos;s usage quota has been reached.
              </p>
            </div>
          )}
          {status === "error" && (
            <div className="py-8 text-center text-sm text-red-400 space-y-1">
              <p>Couldn&apos;t load the comparison.</p>
              <p className="text-xs text-zinc-500">Try again in a moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
