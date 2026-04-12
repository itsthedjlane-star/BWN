# Tipster Sources

Pluggable adapters that pull tipster profiles and tips from external sites.

## Enabling a source

Every adapter except `seed` is **disabled by default** and must be enabled
explicitly via environment variable:

```
TIPSTER_SOURCE_OLBG=1
TIPSTER_SOURCE_TIPSTRR=1
TIPSTER_SOURCE_FREE_SUPER_TIPS=1
TIPSTER_SOURCE_KICKOFF=1
TIPSTER_SOURCE_RATED_TIPSTERS=1
```

The `seed` adapter is enabled when `NODE_ENV !== "production"` or when
`TIPSTER_SOURCE_SEED=1` is set. It generates realistic fake tipsters so
the leaderboard works without any network calls.

## ToS warning

The five real sources (OLBG, Tipstrr, Free Super Tips, KickOff, Rated
Tipsters) are all commercial properties with terms of service. Automated
data extraction is either prohibited or restricted on most of them. Before
enabling any real adapter you MUST:

1. Read the site's current Terms of Service.
2. Confirm the scraping pattern you use respects robots.txt.
3. Rate-limit your requests (no more than 1/sec, ideally much less).
4. Send a descriptive User-Agent with a contact email.
5. Cache aggressively — there is no reason to re-fetch more than once
   per day for profile/leaderboard data.

If a site offers a public feed, RSS, or email digest, prefer that over
HTML scraping.

## Adding a new adapter

1. Create `src/lib/tipster-sources/<name>.ts` exporting a `SourceAdapter`.
2. Register it in `index.ts`.
3. Add the source to the `TipsterSource` enum in `prisma/schema.prisma`.
