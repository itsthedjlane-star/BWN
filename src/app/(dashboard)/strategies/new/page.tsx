"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewStrategyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    sport: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push("/strategies");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/strategies">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">New Strategy Guide</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Value Betting: Finding Edges"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Sport (optional)</label>
              <Select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
                <option value="">General (all sports)</option>
                <option value="FOOTBALL">Football</option>
                <option value="HORSE_RACING">Horse Racing</option>
                <option value="GREYHOUND_RACING">Greyhound Racing</option>
                <option value="CRICKET">Cricket</option>
                <option value="TENNIS">Tennis</option>
                <option value="DARTS">Darts</option>
                <option value="GOLF">Golf</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Content (MDX supported)</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your strategy guide here. Markdown formatting is supported..."
                className="min-h-[300px] font-mono text-sm"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <Save size={14} className="mr-1.5" />
              {loading ? "Publishing..." : "Publish Strategy"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
