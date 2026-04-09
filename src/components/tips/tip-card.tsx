"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Users,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { sportEmoji, timeAgo, confidenceStars } from "@/lib/utils";

interface TipComment {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; image?: string | null };
}

interface TipCardProps {
  tip: {
    id: string;
    sport: string;
    event: string;
    pick: string;
    reasoning: string;
    odds: string;
    confidence: number;
    stake: number;
    source?: string | null;
    result: string;
    pnl?: number | null;
    createdAt: string;
    author: { name: string | null; image?: string | null };
    _count?: { comments: number; tails: number };
  };
  onUpdate?: () => void;
}

export function TipCard({ tip, onUpdate }: TipCardProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<TipComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tailing, setTailing] = useState(false);

  const resultVariant =
    tip.result === "WON"
      ? "success"
      : tip.result === "LOST"
        ? "danger"
        : tip.result === "VOID"
          ? "warning"
          : "default";

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/tips/${tip.id}/comments`);
        if (res.ok) setComments(await res.json());
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tips/${tip.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [
          ...prev,
          {
            ...comment,
            author: {
              name: session?.user?.name ?? "You",
              image: session?.user?.image,
            },
          },
        ]);
        setNewComment("");
        onUpdate?.();
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTail = async () => {
    setTailing(true);
    try {
      const res = await fetch(`/api/tips/${tip.id}/tail`, { method: "POST" });
      if (res.ok) onUpdate?.();
    } catch (err) {
      console.error("Failed to tail:", err);
    } finally {
      setTailing(false);
    }
  };

  return (
    <Card className="hover:border-zinc-700 transition-all">
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {tip.author.image ? (
              <img
                src={tip.author.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                {tip.author.name?.[0] ?? "?"}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">
                {tip.author.name}
              </p>
              <p className="text-xs text-zinc-500">{timeAgo(tip.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>
              {sportEmoji(tip.sport)} {tip.sport.replace(/_/g, " ")}
            </Badge>
            <Badge variant={resultVariant}>{tip.result}</Badge>
          </div>
        </div>

        {/* Pick */}
        <div className="mb-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <p className="text-xs text-zinc-500 mb-1">THE PICK</p>
          <p className="text-white font-semibold">{tip.pick}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
            <span>
              @{" "}
              <span className="text-[#00FF87] font-bold">{tip.odds}</span>
            </span>
            <span>{tip.stake}u stake</span>
            <span className="text-yellow-400">
              {confidenceStars(tip.confidence)}
            </span>
          </div>
        </div>

        {/* Reasoning */}
        <div className="mb-3">
          <p className="text-xs text-zinc-500 mb-1">THE LOGIC</p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {tip.reasoning}
          </p>
        </div>

        {/* Source */}
        {tip.source && (
          <p className="text-xs text-zinc-500 mb-3">
            Source: <span className="text-zinc-400">{tip.source}</span>
          </p>
        )}

        {/* P&L */}
        {tip.pnl !== null && tip.pnl !== undefined && (
          <div
            className={`text-sm font-bold mb-3 ${tip.pnl >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            P&L: {tip.pnl >= 0 ? "+" : ""}
            {tip.pnl.toFixed(2)}u
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 gap-1.5"
            onClick={toggleComments}
          >
            <MessageCircle size={14} />
            <span>{tip._count?.comments ?? 0}</span>
            {showComments ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 gap-1.5"
            onClick={handleTail}
            disabled={tailing}
          >
            {tailing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Users size={14} />
            )}
            <span>{tip._count?.tails ?? 0} tailed</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-zinc-500" size={16} />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-2">
                No comments yet. Be the first.
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                      {comment.author.name?.[0] ?? "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">
                          {comment.author.name}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            {session?.user && (
              <form onSubmit={postComment} className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="h-8 text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !newComment.trim()}
                  className="h-8 px-3"
                >
                  {submitting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
