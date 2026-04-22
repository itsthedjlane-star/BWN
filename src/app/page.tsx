import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, Info } from "lucide-react";
import { ApplyForm } from "@/components/landing/apply-form";

export const metadata: Metadata = {
  title: "BWN — private betting community",
  description:
    "BWN is an invite-only community for UK bettors. We don't take bets or hold funds — we share strategy, compare odds across bookmakers, and track our own picks. 18+ only.",
};

const FEATURES = [
  {
    title: "Cross-bookmaker odds",
    body: "Live price compare across the major UK bookmakers with arbitrage flags and price-movement sparklines.",
  },
  {
    title: "Member tip log",
    body: "A shared tip log with per-member P&L, confidence scoring, and tail-and-track — not influencer hype.",
  },
  {
    title: "Tipster intelligence",
    body: "Aggregated tipster stats from public sources so you can see who's actually above the line over a real sample.",
  },
  {
    title: "Strategy library",
    body: "Plainly-written strategy docs (bankroll, each-way, lay-the-draw, value) — the stuff you wish you'd read before your first £10.",
  },
  {
    title: "Daily digest",
    body: "Yesterday's settled tips, today's pending, week P&L — posted to the group channel every morning.",
  },
  {
    title: "Bring your own tracker",
    body: "Log bets from anywhere and see your ROI by sport, confidence, and stake sizing. Your data stays yours.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-900/80">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="" className="w-8 h-8" />
            <span className="font-bold tracking-widest text-sm text-[#00FF87]">
              BWN
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#apply" className="text-zinc-400 hover:text-white">
              Apply
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
            >
              Sign in <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 mb-6">
            <Lock size={12} /> Invite-only · UK · 18+
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Bookies Worst Nightmare.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-zinc-300 leading-relaxed">
            A private community for UK bettors who take it seriously. We compare
            odds, run the numbers, and keep each other honest with a shared tip
            log and a no-hype tone.
          </p>
          <p className="mt-4 text-sm text-zinc-500 leading-relaxed">
            BWN is not a bookmaker. We don&apos;t take bets or hold funds —
            every bet you place goes through your own licensed operator. We
            share information and tools, and some outbound links to those
            operators are affiliate links that may earn us a commission.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#apply"
              className="inline-flex items-center gap-2 rounded-md bg-[#00FF87] px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-[#00E67A]"
            >
              Apply for an invite <ArrowRight size={14} />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-500"
            >
              I have a code — sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16 border-t border-zinc-900/80">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          What&apos;s inside
        </h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
          The community is small on purpose. These are the tools we share with
          each other.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5"
            >
              <h3 className="text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16 border-t border-zinc-900/80">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Honest about what this is
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              We&apos;re a community and a set of tools. We&apos;re not a
              tipster shop, we don&apos;t guarantee returns, and we don&apos;t
              care if you never place another bet. If you&apos;re chasing
              losses, this isn&apos;t the right room — there&apos;s a free,
              confidential line at{" "}
              <a
                href="https://www.begambleaware.org"
                className="text-[#00FF87] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                BeGambleAware.org
              </a>{" "}
              that actually helps.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              <li className="flex items-start gap-3">
                <Info size={16} className="mt-0.5 shrink-0 text-[#00FF87]" />
                <span>
                  We don&apos;t take bets, hold funds, or act as a bookmaker.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Info size={16} className="mt-0.5 shrink-0 text-[#00FF87]" />
                <span>
                  Invite-only, 18+, and you confirm it on the way in.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Info size={16} className="mt-0.5 shrink-0 text-[#00FF87]" />
                <span>
                  Some outbound links are affiliate links. They never influence
                  which bookmakers we compare or how we rank them.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Info size={16} className="mt-0.5 shrink-0 text-[#00FF87]" />
                <span>
                  Your bet log is your data. Ask for a copy or a deletion at
                  any time — see our{" "}
                  <Link href="/privacy" className="text-[#00FF87] hover:underline">
                    Privacy Notice
                  </Link>
                  .
                </span>
              </li>
            </ul>
          </div>

          <div id="apply" className="lg:pl-8">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">
              <h2 className="text-xl font-bold text-white">
                Apply for an invite
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                A human reads every application. We come back by email — tell
                us briefly what you&apos;re looking for.
              </p>
              <div className="mt-6">
                <ApplyForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900/80 mt-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-3 text-xs text-zinc-500">
          <p>
            <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold mr-2">
              18+
            </span>
            Gamble responsibly. When the fun stops, stop.
          </p>
          <p>
            Free, confidential help:{" "}
            <a
              href="https://www.begambleaware.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white underline"
            >
              BeGambleAware.org
            </a>
            {" · "}
            <a
              href="https://www.gamstop.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white underline"
            >
              GamStop
            </a>
            {" · "}
            <Link
              href="/responsible-gambling"
              className="text-zinc-400 hover:text-white underline"
            >
              Our policy
            </Link>
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-600 pt-2">
            <Link href="/privacy" className="hover:text-zinc-400">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-400">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-zinc-400">
              Cookies
            </Link>
            <Link href="/accessibility" className="hover:text-zinc-400">
              Accessibility
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
