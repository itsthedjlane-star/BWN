# BWN — Audit, Plan & Roadmap

_Last reviewed: 2026-04-17_

BWN (Bookies Worst Nightmare) is a private, invite-only community app for
tipsters and bettors. It aggregates live odds, hosts tipster intelligence
and consensus picks, runs a personal bet tracker, and is working toward
affiliate-driven monetisation. This document captures where we are, what
ships next, and how that lines up against a 90-day horizon.

---

## 1. Where we are (audit)

### Stack
Next.js 16.2.3 (App Router) · React 19.2.4 · TypeScript strict · Tailwind
v4 · Prisma 7.7 on Neon Postgres · NextAuth (Discord OAuth) · Vercel
(prod + cron). In-process MCP server at `/api/mcp` for agent tooling.

### Live product surface

| Area | Status |
|---|---|
| Live odds — football (6 leagues), tennis, cricket, darts, golf, horse racing, greyhound racing | **Shipped** ([PR #1](https://github.com/itsthedjlane-star/BWN/pull/1)). All 7 tabs populated in prod via `DEMO_MODE=1` until a paid Odds API plan is in place. |
| Golf outrights market (was broken — used H2H) | **Fixed** ([PR #2](https://github.com/itsthedjlane-star/BWN/pull/2)). |
| "Odds feed paused" empty-state vs. "No odds scheduled" | **Shipped**. Quota-aware banner when the Odds API returns `OUT_OF_USAGE_CREDITS`. |
| Tipster intelligence (leaderboard, consensus picks, daily scrape cron) | **Shipped** (pre-session). Real sources stubbed — SEED adapter only. |
| Tips feed (post / settle / comment / tail) | **Shipped** (pre-session). |
| Personal betting tracker + P&L | **Shipped** (pre-session). |
| MDX strategy guides | **Shipped** (pre-session). |
| Racing pages (horse / greyhound cards) | **Shipped** — mock data in dev, Odds API where available. |
| Admin member approval | **Shipped** (pre-session). |
| Discord notifications for tips | **Shipped** (pre-session). |
| Affiliate CTAs on odds cards + tip cards | **Shipped** ([PR #1](https://github.com/itsthedjlane-star/BWN/pull/1)). Uses `/api/out` → `OutboundClick` row + 302 to affiliate URL or bookmaker homepage. |
| UK responsible-gambling footer + `/responsible-gambling` policy page | **Shipped**. Required for affiliate traffic compliance. |
| `DEMO_MODE=1` fallback across every sport key | **Shipped** ([PR #3](https://github.com/itsthedjlane-star/BWN/pull/3) · [PR #4](https://github.com/itsthedjlane-star/BWN/pull/4)). |

### Data feeds & integrations

| Feed | State |
|---|---|
| The Odds API | Key present in Vercel env; **out of credits** on the free tier (500/mo). `DEMO_MODE=1` masks this with mock data across every sport tab. |
| The Racing API | Not integrated — user chose Odds-API-only for racing. Coverage is thin outside marquee meetings. |
| Discord webhooks | Active for tip-post alerts. |
| Bookmaker affiliate programmes | **Entain Partners applied 2026-04-17**, awaiting approval. Everything else not yet applied. Registry covers 10 UK books; fallbacks to bookmaker homepage until tracking URLs land. |

### Cost posture
BWN is pre-investment and invite-only. Current recurring cost is
essentially Vercel + Neon + domain. No paid API plan yet. ROI on paid
data feeds is low at current scale — the strategic investment is product
polish + monetisation infrastructure that's ready to scale the moment
traffic arrives or funding lands.

### Known debt / friction
- Cron (`/api/cron/odds`, every 5 mins 6am–11pm, up to 20 keys) will burn any Odds API tier below $59/100k. Needs tightening before going live.
- `CATEGORY_FALLBACK_KEYS` for tennis/cricket/golf includes out-of-season tournament keys that noisy-fail. Minor — discovery endpoint usually supersedes them.
- Pre-existing lint warnings in the repo (14 errors, 19 warnings) — all pre-existing, none mine. Separate cleanup task if desired.
- No automated tests. The whole repo is manually verified. A small Vitest harness on `lib/odds.ts`, `lib/bookmakers.ts`, `/api/out` is a reasonable first addition.
- Tipster source adapters (OLBG, Tipstrr, Free Super Tips, KickOff, Rated Tipsters) are all stubs. SEED generates realistic fake tipsters for dev. Without a real source, leaderboards / consensus reflect seed data in prod.

---

## 2. Part D — next four features

These were queued in the original plan (2026-04-16) and remain the most
impactful next slice. Shipping order is optimised for investor-demo value
per day of work: every feature should be visible on a click-through tour
before any one of them is "polished to completion".

### D1 · Odds comparison / best-price finder
**Why first:** Trivially demos value of aggregating multiple books.
Reuses the best-odds logic already in [odds-card.tsx](src/components/odds/odds-card.tsx:24) — minimal new code for maximal visual payoff.

**Scope (≈ 1–2 days):**
- New route `/odds/compare/[eventId]` — side-by-side matrix of every bookmaker × every outcome for one event.
- Arb highlighter: flag rows where `Σ(1/price) < 1`. Visual indicator, no trading.
- Link "Compare" from each `OddsCard` to the detail view.
- Reuse existing `buildOutboundUrl` so every cell is a live affiliate link.

**Stretch (not v1):** historical price-movement sparkline (needs the `OddsSnapshot` table from D2).

### D2 · Price-movement snapshots + odds-drop alerts
**Why next:** Unlocks real differentiation (competitors show current prices; BWN shows movement). Writes every cron run to a small `OddsSnapshot` table, fuels D1 sparklines and alert triggers.

**Scope (≈ 2–3 days):**
- New Prisma model `OddsSnapshot { id, eventId, bookmaker, outcome, price, at }`. Composite index `[eventId, at]`.
- Cron writes snapshots on each run (deduped against the prior snapshot to keep the table lean).
- Per-user `AlertSubscription { userId, kind: TIPSTER_POST | ODDS_DROP | CONSENSUS | RESULT, payload }`.
- Channels: Discord (reuse [agent-notify.ts](src/lib/agent-notify.ts)), Web Push (VAPID, standard-issue). Email later — needs a provider account (Resend / Postmark).
- Settings page gets an "Alerts" tab.

### D3 · Accumulator / bet builder
**Why third:** Pure community-engagement feature. Very demo-friendly ("share your acca"). No extra data feed needed.

**Scope (≈ 2–3 days):**
- Client-side Zustand store. "Add to accumulator" button on every `OddsCard`.
- `/builder` page: list of selections, combined decimal odds (product), stake × odds, potential return.
- Save public accas to a new `Accumulator` model — shareable slug. Community feed at `/builder/trending`.
- Deep-link out: for bookmakers that accept `add-to-betslip` URL params (Sky Bet, Bet365 partial coverage), pre-fill. Otherwise generic affiliate link + copy-to-clipboard selection list.

### D4 · Live scores + in-play odds
**Why last:** Highest polling cost (30 s cadence vs 5 min); probably needs Odds API paid plan before it's practical. Ship last so you've got traffic / data to justify the spend.

**Scope (≈ 3–5 days, plus paid plan):**
- New "Live" tab on `/odds`.
- Poll interval 30 s only for events currently in-play (derive from `commence_time` + best-guess duration per sport).
- Hot cache layer (Upstash Redis or Vercel KV) so we don't hit DB on every poll.
- Scores from `https://api.the-odds-api.com/v4/sports/{key}/scores/` (covers major sports only).
- Client-side `setInterval` against our cached route — no new cron.

---

## 3. Also queued (non-D1-4 work worth putting on the board)

Ordered by leverage, not urgency.

### A. Real tipster source — pick one, ship it properly
Currently every real scraper is a stub; SEED generates fake data. One
real source with a working scraper (e.g. OLBG's public RSS of free tips)
converts the tipster leaderboard from "demo feature" to "actual data
product". Biggest single credibility win for the whole app. ≈ 2–3 days
including ToS compliance (rate-limit, UA, attribution).

### B. Tightened cron + paid Odds API plan (when ready)
Before flipping `DEMO_MODE=0`, drop cron frequency (15 min instead of 5,
only top 8 keys instead of 20) so $59/100k tier has real headroom.
Small code change, significant cost impact. ≈ 0.5 day.

### C. Automated test coverage (thin harness)
Vitest on the pure libs — `odds.ts` (category resolution, status logic,
mock synthesis), `bookmakers.ts` (URL building, fallback),
`tipster-intelligence.ts` (consensus math). No end-to-end, no UI. Buys
confidence when DEMO_MODE flips off and real data flows. ≈ 1 day.

### D. Email as a notification channel
Complements D2. Needs Resend / Postmark account + domain auth. The wiring
is straightforward once the transport is picked. ≈ 1 day.

### E. Invite-code self-serve + affiliate-style invite rewards
Currently admin-only invite creation. Letting existing members invite N
peers (with a per-member cap + expiry) removes the admin bottleneck on
growth. Small Prisma change + one API route + one settings section.
≈ 1 day.

### F. Investor-pitch polish
- Landing page meta-image / OG cards.
- Screenshots kit in the repo for pitch decks.
- One-paragraph "what is BWN" on the public login page.
- Analytics dashboard at `/admin/metrics` — DAU, tip volume, `OutboundClick` totals, top bookmaker by clicks. All queries against existing tables.

≈ 1 day across the set.

---

## 4. 90-day sequencing

Grouped into three 30-day waves. Each wave ends at a naturally-demoable
milestone. Dates assume one working dev on it; scale accordingly.

### Wave 1 (days 1–30) — Product depth & investor-ready demo
Make every tab alive and every promised feature present.
1. **D1** Odds comparison — side-by-side + arb highlighter.
2. **A** One real tipster source — replace SEED in at least one adapter.
3. **D2** Price-movement snapshots table + first channel of alerts (Discord).
4. **F** Investor-pitch polish — OG cards, metrics dashboard, landing-page copy.

**End state:** BWN can be shown cold to an investor or new member and every tab does something interesting. Tipster leaderboard reflects real people. Affiliate infrastructure visible but can be explained as "wired, waiting on traffic".

### Wave 2 (days 31–60) — Community engagement & monetisation
1. **D3** Bet builder / accumulator + community-share feed.
2. **E** Member-generated invite codes.
3. **D2 continued** Web Push alerts + odds-drop alert as the first cross-cutting use-case.
4. **D** Email channel for alerts & digest.

Concurrent throughout: chase Flutter, Bet365, 888 affiliate approvals. Paste tracking URLs into Vercel env as each lands.

**End state:** BWN has viral mechanics (shareable accas, member invites, alerts that bring users back). Affiliate revenue starts being non-zero.

### Wave 3 (days 61–90) — Scale & live product
1. **B** Tighten cron + upgrade Odds API plan. Flip `DEMO_MODE=0` tab-by-tab.
2. **D4** Live scores + in-play odds.
3. **C** Test harness around the pure libs.
4. **Decision gate:** look at `OutboundClick` + alert open-rate data. If affiliate revenue > API cost, keep pushing. If not, consider scaling the product sideways (different sport depth, editorial / Discord programming) before adding more features.

**End state:** live, real-data BWN with in-play coverage. Enough operating data to decide whether to raise, scale ops, or pivot feature focus.

---

## 5. Success metrics

Worth instrumenting before Wave 1 lands, so the Wave 3 decision gate has history.

| Metric | Surface | Target by day 90 |
|---|---|---|
| Weekly active users | `User.joinedAt` + session count | 150+ |
| Tips posted / week | `Tip.createdAt` | 50+ |
| `OutboundClick` / week | new model | 200+ |
| Click → affiliate conversion | cross-ref against operator reports | > 0.5% (tight but realistic) |
| Alerts opened / delivered | add `AlertDelivery` model in D2 | > 30% |
| DEMO_MODE off for ≥ 5/7 tabs | `ODDS_API_KEY` quota headroom | Yes |

---

## 6. Out-of-scope (for now)

- Full bookmaker API integrations (Betfair Exchange only one practical; too narrow to justify v1).
- A mobile app. PWA via Next.js is enough until traffic justifies native.
- Multi-sport expansion beyond the current seven. Add NFL, NBA, rugby, MMA only after the existing seven have a complete feature set across every tab.
- Chat / forum features. Discord already serves this need — BWN should stay a data + tips product, not a communications product.

---

## 7. Operating notes

- `DEMO_MODE=1` currently set in Vercel production. Flip off once paid API tier + real user policy is decided.
- `/api/cron/odds` uses `CRON_SECRET` bearer. Don't remove the auth check.
- Setting env vars via CLI: use `printf '<value>' | vercel env add`, never `echo` — echo's trailing newline ends up in the stored value.
- Neon + Prisma adapter-pg: schema changes need `npx prisma db push` (migrations dir not set up — opportunity for Wave 3).
- Repo main branch is protected; merges go via PR. Solo workflow so self-merge is fine.

---

_Plan owners: **Harry** (product + ops) · **Claude Code** (implementation / review). Revisions tracked via repo commit history on this file._
