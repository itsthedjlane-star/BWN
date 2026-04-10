"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HorseMeeting } from "@/lib/racing";

export default function HorseRacingPage() {
  const [meetings, setMeetings] = useState<HorseMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/racing?discipline=horses")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setMeetings(data);
      })
      .catch((err) => console.error("Failed to load racing meetings:", err))
      .finally(() => setLoading(false));
  }, []);

  const visibleMeetings = selectedMeeting
    ? meetings.filter((m) => m.id === selectedMeeting)
    : meetings;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            \uD83C\uDFC7 Horse Racing
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Today&apos;s race cards &mdash; UK &amp; Irish meetings
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/racing/horses">
            <Button size="sm" className="bg-[#00FF87] text-black">
              Horses
            </Button>
          </Link>
          <Link href="/racing/greyhounds">
            <Button variant="outline" size="sm">
              Greyhounds
            </Button>
          </Link>
        </div>
      </div>

      {/* Meeting filter */}
      {meetings.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedMeeting(null)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              !selectedMeeting
                ? "bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
            )}
          >
            All Meetings
          </button>
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              onClick={() => setSelectedMeeting(meeting.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                selectedMeeting === meeting.id
                  ? "bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
              )}
            >
              {meeting.course}
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
                <h2 className="text-lg font-bold text-white">{meeting.course}</h2>
                <Badge>{meeting.going}</Badge>
              </div>
              <span className="text-xs text-zinc-500">
                {meeting.races.length} races
              </span>
            </div>

            {meeting.races.map((race, idx) => {
              const eventLabel = `${meeting.course} ${race.time} ${race.name}`;
              const tipHref = `/tips/new?sport=HORSE_RACING&event=${encodeURIComponent(eventLabel)}`;
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
                        <span>{race.going}</span>
                        <span>&middot;</span>
                        <span className="text-[#00FF87]">{race.prize}</span>
                        <span>&middot;</span>
                        <span>{race.class}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-zinc-500 border-b border-zinc-800">
                            <th className="text-left py-2 pr-2">#</th>
                            <th className="text-left py-2">Runner</th>
                            <th className="text-left py-2">Jockey</th>
                            <th className="text-left py-2 hidden md:table-cell">
                              Trainer
                            </th>
                            <th className="text-left py-2 hidden lg:table-cell">
                              Weight
                            </th>
                            <th className="text-left py-2">Form</th>
                            <th className="text-right py-2">Odds</th>
                          </tr>
                        </thead>
                        <tbody>
                          {race.runners.map((runner) => (
                            <tr
                              key={runner.number}
                              className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                            >
                              <td className="py-2.5 pr-2">
                                <div
                                  className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold text-white ${runner.silks}`}
                                >
                                  {runner.number}
                                </div>
                              </td>
                              <td className="py-2.5">
                                <span className="text-white font-medium">
                                  {runner.name}
                                </span>
                                <span className="text-[10px] text-zinc-500 ml-1">
                                  ({runner.age})
                                </span>
                              </td>
                              <td className="py-2.5 text-zinc-400">
                                {runner.jockey}
                              </td>
                              <td className="py-2.5 text-zinc-400 hidden md:table-cell">
                                {runner.trainer}
                              </td>
                              <td className="py-2.5 text-zinc-400 hidden lg:table-cell font-mono text-xs">
                                {runner.weight}
                              </td>
                              <td className="py-2.5 font-mono text-zinc-300">
                                {runner.form}
                              </td>
                              <td className="py-2.5 text-right">
                                <span className="text-[#00FF87] font-bold">
                                  {runner.odds}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
