"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ErrorState = { message: string } | null;

export function ApplyForm() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [source, setSource] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<ErrorState>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!ageConfirmed) {
      setError({ message: "You must confirm you are 18 or over." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/invite-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          reason: reason.trim(),
          source: source.trim() || null,
          ageConfirmed: true,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError({ message: data?.error ?? "Couldn't send your application." });
      }
    } catch {
      setError({ message: "Network error — try again in a moment." });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-[#00FF87]/30 bg-[#00FF87]/5 p-4 text-sm">
        <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#00FF87]" />
        <div>
          <p className="font-semibold text-white">Application received.</p>
          <p className="mt-1 text-zinc-300 leading-relaxed">
            We&apos;ll reply to <strong>{email}</strong> when we&apos;ve looked
            at it. No account is created until we send you an invite code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Email
        </label>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Why do you want in?
        </label>
        <textarea
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Two lines are fine. Who are you, what do you bet on, what would you want from the group?"
          rows={4}
          maxLength={1000}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-[#00FF87] focus:outline-none focus:ring-1 focus:ring-[#00FF87]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          How did you hear about us? <span className="text-zinc-600">(optional)</span>
        </label>
        <Input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Reddit, a friend, a blog..."
          maxLength={120}
        />
      </div>
      <label className="flex items-start gap-3 text-sm text-zinc-300 cursor-pointer select-none">
        <input
          type="checkbox"
          required
          checked={ageConfirmed}
          onChange={(e) => setAgeConfirmed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#00FF87] focus:ring-[#00FF87] focus:ring-offset-0 cursor-pointer"
        />
        <span>
          I&apos;m <strong className="text-white">18 or over</strong> and have
          read the{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-[#00FF87] hover:underline"
          >
            Privacy Notice
          </Link>
          .
        </span>
      </label>
      {error && <p className="text-sm text-red-400">{error.message}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={loading || !ageConfirmed}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin mr-1.5" /> Sending…
          </>
        ) : (
          "Send application"
        )}
      </Button>
      <p className="text-xs text-zinc-500">
        By applying you accept our{" "}
        <Link
          href="/terms"
          target="_blank"
          className="text-zinc-400 hover:underline"
        >
          Terms
        </Link>
        . We&apos;ll only use your email to reply to this application.
      </p>
    </form>
  );
}
