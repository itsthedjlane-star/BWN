"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const TRAP_COLORS: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-blue-500",
  3: "bg-white text-black",
  4: "bg-black border border-zinc-600",
  5: "bg-orange-500",
  6: "bg-black border border-yellow-400",
};

const MOCK_MEETINGS = [
  {
    id: "1",
    track: "Romford",
    races: [
      {
        time: "19:12",
        name: "A3 Grade",
        distance: "400m",
        prize: "\u00A3600",
        runners: [
          { trap: 1, name: "Ballymac Flash", form: "1-2-1-3-2", odds: "2/1", trainer: "M. Wallis" },
          { trap: 2, name: "Droopys Jet", form: "3-1-2-1-4", odds: "3/1", trainer: "K. Hutton" },
          { trap: 3, name: "Priceless Gem", form: "2-4-1-1-3", odds: "7/2", trainer: "P. Janssens" },
          { trap: 4, name: "Salacres Brewer", form: "5-3-3-2-6", odds: "8/1", trainer: "H. Collins" },
          { trap: 5, name: "Kilara Willow", form: "1-1-2-3-1", odds: "5/2", trainer: "M. Wallis" },
          { trap: 6, name: "Romeo Taylor", form: "4-6-4-5-3", odds: "12/1", trainer: "D. Childs" },
        ],
      },
      {
        time: "19:28",
        name: "A5 Grade",
        distance: "400m",
        prize: "\u00A3450",
        runners: [
          { trap: 1, name: "Swift Banker", form: "2-1-3-2-1", odds: "3/1", trainer: "K. Hutton" },
          { trap: 2, name: "Toolbox Annie", form: "1-3-2-4-2", odds: "4/1", trainer: "P. Janssens" },
          { trap: 3, name: "Bright Horizon", form: "4-2-1-1-3", odds: "5/2", trainer: "M. Wallis" },
          { trap: 4, name: "Distant Echo", form: "3-5-4-3-2", odds: "6/1", trainer: "H. Collins" },
          { trap: 5, name: "Pennys Shadow", form: "1-2-2-1-4", odds: "9/4", trainer: "K. Hutton" },
          { trap: 6, name: "Bogger Bunny", form: "5-4-6-5-5", odds: "16/1", trainer: "D. Childs" },
        ],
      },
      {
        time: "19:45",
        name: "A2 Grade",
        distance: "575m",
        prize: "\u00A3800",
        runners: [
          { trap: 1, name: "Kildare Star", form: "1-1-2-1-3", odds: "7/4", trainer: "M. Wallis" },
          { trap: 2, name: "Clares Rocket", form: "2-3-1-2-1", odds: "3/1", trainer: "P. Janssens" },
          { trap: 3, name: "Swift Sally", form: "3-1-4-3-2", odds: "5/1", trainer: "K. Hutton" },
          { trap: 4, name: "Dark Missile", form: "1-4-2-1-5", odds: "4/1", trainer: "H. Collins" },
          { trap: 5, name: "Spring Meadow", form: "2-2-3-4-1", odds: "6/1", trainer: "D. Childs" },
          { trap: 6, name: "Tornado Bob", form: "4-3-5-2-4", odds: "10/1", trainer: "M. Wallis" },
        ],
      },
    ],
  },
  {
    id: "2",
    track: "Shelbourne Park",
    races: [
      {
        time: "20:00",
        name: "A1 Grade",
        distance: "550y",
        prize: "\u20AC1,000",
        runners: [
          { trap: 1, name: "Ballymac Leon", form: "1-1-1-2", odds: "6/4", trainer: "L. Dowling" },
          { trap: 2, name: "Newinn Hazel", form: "2-1-3-1", odds: "3/1", trainer: "G. Holland" },
          { trap: 3, name: "Crickleowl Ace", form: "3-2-1-4", odds: "4/1", trainer: "P. Buckley" },
          { trap: 4, name: "Rising Hawk", form: "1-3-2-2", odds: "5/1", trainer: "G. Holland" },
          { trap: 5, name: "Coolavanny Pip", form: "4-1-2-1", odds: "7/1", trainer: "L. Dowling" },
          { trap: 6, name: "Skywalker Duke", form: "2-4-3-5", odds: "10/1", trainer: "P. Buckley" },
        ],
      },
    ],
  },
];

export default function GreyhoundRacingPage() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const meetings = selectedTrack
    ? MOCK_MEETINGS.filter((m) => m.id === selectedTrack)
    : MOCK_MEETINGS;

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
        {MOCK_MEETINGS.map((meeting) => (
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

      {meetings.map((meeting) => (
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

          {meeting.races.map((race, idx) => (
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
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
