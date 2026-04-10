"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GreyhoundMeeting } from "@/lib/racing";

const TRAP_COLORS: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-blue-500",
  3: "bg-white text-black",
  4: "bg-black border border-zinc-600",
  5: "bg-orange-500",
  6: "bg-black border border-yellow-400",
};

export default function GreyhoundRacingPage() {
  const [meetings, setMeetings] = useState<GreyhoundMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/racing?discipline=greyhounds")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setMeetings(data);
      })
      .catch((err) => console.error("Failed to load racing meetings:", err))
      .finally(() => setLoading(false));
  }, []);

  const visibleMeetings = selectedTrack
    ? meetings.filter((m) => m.id === selectedTrack)
    : meetings;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            \uD83D\uDC15 Greyhound Racing
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Today&apos;s UK &amp; Irish greyhound meetings
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/racing/horses">
            <Button variant="outline" size="sm">
              Horses
            </Button>
          </Link>
          <Link href="/racing/greyhounds">
            <Button size="sm" className="bg-[#00FF87] text-black">
              Greyhounds
            </Button>
          </Link>
        </div>
      </div>

      {/* Track filter */}
      {meetings.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedTrack(null)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              !selectedTrack
                ? "bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
            )}
          >
            All Tracks
          </button>
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              onClick={() => setSelectedTrack(meeting.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                selectedTrack === meeting.id
                  ? "bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
              )}
            >
              {meeting.track}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-zinc-500" size={24} />
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">No meetings today.</p>
          </CardContent>
        </Card>
      ) : (
        visibleMeetings.map((meeting) => (
          <div key={meeting.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#00FF87]" />
                <h2 className="text-lg font-bold text-white">{meeting.track}</h2>
              </div>
              <span className="text-xs text-zinc-500">
                {meeting.races.length} races
              </span>
            </div>

            {meeting.races.map((race, idx) => {
              const eventLabel = `${meeting.track} ${race.time} ${race.name}`;
              const tipHref = `/tips/new?sport=GREYHOUND_RACING&event=${encodeURIComponent(eventLabel)}`;
              return (
                <Card key={idx}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="info">{race.time}</Badge>
                        <CardTitle className="text-base">{race.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{race.distance}</span>
                        <span>&middot;</span>
                        <span className="text-[#00FF87]">{race.prize}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {race.runners.map((runner) => (
                        <div
                          key={runner.trap}
                          className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors rounded px-2 -mx-2"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold ${TRAP_COLORS[runner.trap] ?? "bg-zinc-700"} ${runner.trap !== 3 ? "text-white" : ""}`}
                            >
                              {runner.trap}
                            </div>
                            <div>
                              <span className="text-white font-medium text-sm">
                                {runner.name}
                              </span>
                              <span className="text-[10px] text-zinc-500 ml-2">
                                {runner.trainer}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-xs text-zinc-400">
                              {runner.form}
                            </span>
                            <span className="text-[#00FF87] font-bold text-sm min-w-[40px] text-right">
                              {runner.odds}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-3">
                      <Link href={tipHref}>
                        <Button size="sm" variant="outline">
                          <Plus size={12} className="mr-1" />
                          Post tip on this race
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
