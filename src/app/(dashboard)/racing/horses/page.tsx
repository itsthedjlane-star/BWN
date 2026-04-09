"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_MEETINGS = [
  {
    id: "1",
    course: "Cheltenham",
    going: "Soft",
    races: [
      {
        time: "13:30",
        name: "Novices' Hurdle",
        distance: "2m 4f",
        going: "Soft",
        prize: "\u00A312,000",
        class: "Class 3",
        runners: [
          { number: 1, name: "Thunder Road", jockey: "B. Powell", trainer: "N. Henderson", form: "1-2-1-3", odds: "5/2", weight: "11-7", age: 6, silks: "bg-blue-500" },
          { number: 2, name: "Desert Crown", jockey: "H. Cobden", trainer: "P. Nicholls", form: "2-1-1-P", odds: "3/1", weight: "11-4", age: 7, silks: "bg-green-500" },
          { number: 3, name: "King's Gambit", jockey: "R. Johnson", trainer: "O. Murphy", form: "3-4-2-1", odds: "7/2", weight: "11-0", age: 5, silks: "bg-red-500" },
          { number: 4, name: "Noble Spirit", jockey: "S. Bowen", trainer: "D. Skelton", form: "F-1-3-2", odds: "8/1", weight: "10-12", age: 6, silks: "bg-yellow-500" },
          { number: 5, name: "Blazing Trail", jockey: "J. Moore", trainer: "G. Elliott", form: "1-1-4-5", odds: "10/1", weight: "10-10", age: 8, silks: "bg-purple-500" },
          { number: 6, name: "Silver Arrow", jockey: "T. O'Brien", trainer: "J. O'Neill", form: "2-3-1-4", odds: "12/1", weight: "10-7", age: 5, silks: "bg-zinc-400" },
        ],
      },
      {
        time: "14:10",
        name: "Handicap Chase",
        distance: "3m 1f",
        going: "Soft",
        prize: "\u00A325,000",
        class: "Class 2",
        runners: [
          { number: 1, name: "Iron Duke", jockey: "B. Powell", trainer: "N. Henderson", form: "2-1-3-1", odds: "3/1", weight: "11-10", age: 8, silks: "bg-blue-500" },
          { number: 2, name: "Storm Chaser", jockey: "H. Cobden", trainer: "P. Nicholls", form: "1-P-2-1", odds: "4/1", weight: "11-5", age: 7, silks: "bg-green-500" },
          { number: 3, name: "Celtic Warrior", jockey: "R. Johnson", trainer: "O. Murphy", form: "4-3-1-2", odds: "5/1", weight: "11-0", age: 9, silks: "bg-red-500" },
          { number: 4, name: "Midnight Runner", jockey: "A. Coleman", trainer: "K. Bailey", form: "1-1-2-3", odds: "6/1", weight: "10-12", age: 7, silks: "bg-orange-500" },
          { number: 5, name: "Frontier Gold", jockey: "L. Edwards", trainer: "R. Hobson", form: "3-2-1-P", odds: "14/1", weight: "10-5", age: 10, silks: "bg-amber-500" },
        ],
      },
      {
        time: "14:50",
        name: "Champion Bumper",
        distance: "2m",
        going: "Soft",
        prize: "\u00A318,000",
        class: "Class 1",
        runners: [
          { number: 1, name: "Future Star", jockey: "P. Townend", trainer: "W. Mullins", form: "1-1", odds: "6/4", weight: "11-0", age: 4, silks: "bg-blue-500" },
          { number: 2, name: "Dream Catcher", jockey: "R. Blackmore", trainer: "H. de Bromhead", form: "1-2", odds: "5/2", weight: "11-0", age: 5, silks: "bg-green-500" },
          { number: 3, name: "Northern Light", jockey: "D. Mullins", trainer: "G. Elliott", form: "2-1", odds: "7/1", weight: "11-0", age: 4, silks: "bg-red-500" },
        ],
      },
    ],
  },
  {
    id: "2",
    course: "Kempton",
    going: "Good to Soft",
    races: [
      {
        time: "12:45",
        name: "Maiden Hurdle",
        distance: "2m",
        going: "Good to Soft",
        prize: "\u00A38,000",
        class: "Class 4",
        runners: [
          { number: 1, name: "First Light", jockey: "T. Scudamore", trainer: "D. Pipe", form: "2-3", odds: "2/1", weight: "11-4", age: 5, silks: "bg-blue-500" },
          { number: 2, name: "Dawn Patrol", jockey: "N. de Boinville", trainer: "N. Henderson", form: "3-2", odds: "5/2", weight: "11-4", age: 5, silks: "bg-green-500" },
          { number: 3, name: "Morning Star", jockey: "H. Cobden", trainer: "P. Nicholls", form: "4", odds: "7/1", weight: "11-4", age: 4, silks: "bg-red-500" },
          { number: 4, name: "Whisper Valley", jockey: "J. Burke", trainer: "A. King", form: "F-3", odds: "10/1", weight: "11-4", age: 6, silks: "bg-yellow-500" },
        ],
      },
      {
        time: "13:20",
        name: "Novice Chase",
        distance: "2m 4f",
        going: "Good to Soft",
        prize: "\u00A315,000",
        class: "Class 3",
        runners: [
          { number: 1, name: "Bold Venture", jockey: "B. Powell", trainer: "N. Henderson", form: "1-1-2", odds: "5/4", weight: "11-7", age: 7, silks: "bg-blue-500" },
          { number: 2, name: "Rock Steady", jockey: "H. Cobden", trainer: "P. Nicholls", form: "2-1-3", odds: "3/1", weight: "11-4", age: 6, silks: "bg-green-500" },
          { number: 3, name: "Lucky Charm", jockey: "S. Bowen", trainer: "D. Skelton", form: "3-4-1", odds: "8/1", weight: "11-0", age: 8, silks: "bg-red-500" },
        ],
      },
    ],
  },
  {
    id: "3",
    course: "Aintree",
    going: "Good",
    races: [
      {
        time: "14:00",
        name: "Handicap Hurdle",
        distance: "2m 4f",
        going: "Good",
        prize: "\u00A320,000",
        class: "Class 2",
        runners: [
          { number: 1, name: "Hurricane Force", jockey: "R. Johnson", trainer: "O. Murphy", form: "1-2-1-1", odds: "9/4", weight: "11-12", age: 6, silks: "bg-blue-500" },
          { number: 2, name: "Tidal Wave", jockey: "B. Powell", trainer: "N. Henderson", form: "2-1-3-2", odds: "3/1", weight: "11-7", age: 7, silks: "bg-green-500" },
          { number: 3, name: "Thunder Bolt", jockey: "H. Cobden", trainer: "P. Nicholls", form: "3-1-2-4", odds: "5/1", weight: "11-2", age: 5, silks: "bg-red-500" },
          { number: 4, name: "Rain Dancer", jockey: "A. Coleman", trainer: "K. Bailey", form: "1-4-2-1", odds: "7/1", weight: "10-13", age: 8, silks: "bg-yellow-500" },
        ],
      },
    ],
  },
];

export default function HorseRacingPage() {
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const meetings = selectedMeeting
    ? MOCK_MEETINGS.filter((m) => m.id === selectedMeeting)
    : MOCK_MEETINGS;

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
        {MOCK_MEETINGS.map((meeting) => (
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

      {meetings.map((meeting) => (
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
                    <span>{race.going}</span>
                    {"prize" in race && (
                      <>
                        <span>&middot;</span>
                        <span className="text-[#00FF87]">
                          {(race as any).prize}
                        </span>
                      </>
                    )}
                    {"class" in race && (
                      <>
                        <span>&middot;</span>
                        <span>{(race as any).class}</span>
                      </>
                    )}
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
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
