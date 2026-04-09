"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const SPORTS = [
  { value: "FOOTBALL", label: "⚽ Football" },
  { value: "HORSE_RACING", label: "🏇 Horse Racing" },
  { value: "GREYHOUND_RACING", label: "🐕 Greyhound Racing" },
  { value: "CRICKET", label: "🏏 Cricket" },
  { value: "TENNIS", label: "🎾 Tennis" },
  { value: "DARTS", label: "🎯 Darts" },
  { value: "GOLF", label: "⛳ Golf" },
];

export default function NewTipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sport: "FOOTBALL",
    event: "",
    pick: "",
    reasoning: "",
    odds: "",
    confidence: 3,
    stake: 1,
    source: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/tips");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tips">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Post a Tip</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Sport</label>
                <Select
                  value={form.sport}
                  onChange={(e) => setForm({ ...form, sport: e.target.value })}
                >
                  {SPORTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Odds</label>
                <Input
                  value={form.odds}
                  onChange={(e) => setForm({ ...form, odds: e.target.value })}
                  placeholder="e.g. 5/2 or 3.50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Event</label>
              <Input
                value={form.event}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
                placeholder="e.g. Arsenal vs Man City - Premier League"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">The Pick</label>
              <Input
                value={form.pick}
                onChange={(e) => setForm({ ...form, pick: e.target.value })}
                placeholder="e.g. Arsenal to win & BTTS"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">The Logic</label>
              <Textarea
                value={form.reasoning}
                onChange={(e) => setForm({ ...form, reasoning: e.target.value })}
                placeholder="Why this bet? What's the edge? What data supports it?"
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Confidence (1-5)
                </label>
                <Select
                  value={form.confidence.toString()}
                  onChange={(e) => setForm({ ...form, confidence: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{"★".repeat(n)}{"☆".repeat(5 - n)}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Stake (units)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={form.stake}
                  onChange={(e) => setForm({ ...form, stake: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Source</label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="Own analysis"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Send size={14} className="mr-1.5" />
              {loading ? "Posting..." : "Post Tip"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
