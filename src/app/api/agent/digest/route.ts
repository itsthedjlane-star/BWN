import { NextRequest, NextResponse } from "next/server";
import { verifyAgentRequest } from "@/lib/agent-auth";
import { buildDigest } from "@/lib/agent-digest";

/**
 * POST /api/agent/digest
 *
 * Agent-only endpoint that returns an aggregated digest payload for a
 * time window. Used by the Daily Digest agent to fetch the numbers it
 * then formats into a Discord post.
 *
 * Request body:
 *   {
 *     "from": "2026-04-09T00:00:00.000Z", // inclusive, ISO 8601
 *     "to":   "2026-04-10T00:00:00.000Z"  // exclusive, ISO 8601
 *   }
 *
 * Auth: `Authorization: Bearer ${BWN_AGENT_TOKEN}` — verified via
 * verifyAgentRequest. This endpoint is NOT available to human sessions.
 *
 * Response: DigestPayload (see src/lib/agent-digest.ts).
 */
export async function POST(req: NextRequest) {
  const unauthorized = verifyAgentRequest(req);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "invalid_json",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_body",
          message: "Request body must be an object with 'from' and 'to'.",
        },
      },
      { status: 400 }
    );
  }

  const { from: fromRaw, to: toRaw } = body as {
    from?: unknown;
    to?: unknown;
  };

  if (typeof fromRaw !== "string" || typeof toRaw !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "invalid_window",
          message: "'from' and 'to' must be ISO 8601 date strings.",
        },
      },
      { status: 400 }
    );
  }

  const from = new Date(fromRaw);
  const to = new Date(toRaw);

  if (isNaN(+from) || isNaN(+to)) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_window",
          message: "'from' and 'to' must parse as valid dates.",
        },
      },
      { status: 400 }
    );
  }

  if (from >= to) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_window",
          message: "'from' must be strictly before 'to'.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const payload = await buildDigest(from, to);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[agent/digest] buildDigest failed:", err);
    return NextResponse.json(
      {
        error: {
          code: "digest_failed",
          message:
            err instanceof Error ? err.message : "Unknown error building digest.",
        },
      },
      { status: 500 }
    );
  }
}
