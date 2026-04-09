"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Plus, BookOpen, Loader2 } from "lucide-react";
import { sportEmoji, formatDate } from "@/lib/utils";

interface Strategy {
  id: string;
  title: string;
  slug: string;
  sport: string | null;
  contentMdx: string;
  author: { name: string | null };
  createdAt: string;
}

export default function StrategiesPage() {
  const { data: session } = useSession();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/strategies")
      .then((res) => res.json())
      .then((data) => {
        setStrategies(Array.isArray(data) ? data : []);
      })
      .catch(() => setStrategies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="text-[#00FF87]" size={24} />
            Strategy Hub
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Betting knowledge base & guides
          </p>
        </div>
        {session?.user?.role === "ADMIN" && (
          <Link href="/strategies/new">
            <Button size="sm">
              <Plus size={14} className="mr-1.5" />
              New Strategy
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-zinc-500" size={24} />
        </div>
      ) : strategies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">No strategies yet.</p>
            {session?.user?.role === "ADMIN" && (
              <Link href="/strategies/new">
                <Button size="sm" className="mt-4">
                  Write the first one
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strategy) => (
            <Link key={strategy.id} href={`/strategies/${strategy.slug}`}>
              <Card className="h-full hover:border-[#00FF87]/30 transition-all cursor-pointer group">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-[#00FF87]" />
                      {strategy.sport ? (
                        <Badge>
                          {sportEmoji(strategy.sport)}{" "}
                          {strategy.sport.replace(/_/g, " ")}
                        </Badge>
                      ) : (
                        <Badge variant="info">General</Badge>
                      )}
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-2 group-hover:text-[#00FF87] transition-colors">
                    {strategy.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
                    {strategy.contentMdx.slice(0, 200).replace(/[#*_`]/g, "")}
                    ...
                  </p>
                  <p className="text-xs text-zinc-600 mt-3">
                    By {strategy.author.name ?? "Unknown"} &middot;{" "}
                    {formatDate(strategy.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
