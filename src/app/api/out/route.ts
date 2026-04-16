import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAffiliateUrl, isKnownBookmaker } from "@/lib/bookmakers";

/**
 * Click-tracking redirector for affiliate "Bet now" links.
 *
 *   GET /api/out?bk=bet365&ctx=odds|tip|tracker&ref=<event-or-tip-id>
 *
 * Logs an OutboundClick row, then 302s to the resolved affiliate URL
 * (or the bookmaker homepage if no affiliate template is configured).
 *
 * We intentionally never 4xx on bad input — a broken redirect is worse
 * than a slightly wasted DB row. Unknown bookmakers 302 to "/" so the
 * user lands back on the site rather than at a dead link.
 */
export async function GET(req: NextRequest) {
  const bk = req.nextUrl.searchParams.get("bk") ?? "";
  const ctxParam = req.nextUrl.searchParams.get("ctx") ?? "odds";
  const ref = req.nextUrl.searchParams.get("ref") ?? undefined;

  const context =
    ctxParam === "odds" || ctxParam === "tip" || ctxParam === "tracker"
      ? ctxParam
      : "odds";

  if (!isKnownBookmaker(bk)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Best-effort logging — never block the redirect on a DB blip.
  try {
    const session = await getServerSession(authOptions);
    await prisma.outboundClick.create({
      data: {
        userId: session?.user?.id ?? null,
        bookmaker: bk.toLowerCase(),
        context,
        ref: ref ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to log outbound click:", err);
  }

  const destination = buildAffiliateUrl(bk, { eventId: ref });
  return NextResponse.redirect(destination, 302);
}
