import { NextRequest, NextResponse } from "next/server";
import { verifyAgentRequest } from "@/lib/agent-auth";
import { settleTipForAgent } from "@/lib/agent-settle";

/**
 * POST /api/agent/tips/[id]/settle
 *
 * Agent-authed settlement endpoint. Takes `{ result }` in the body;
 * the server computes PnL from the tip's stake and oddsDecimal to
 * keep the formula in one place (src/lib/utils.ts:calculatePnL) and
 * avoid drift between the Next app and the agent skill.
 *
 * The agent should treat:
 *   - 200 → settlement applied, `cascadedBets` tails updated
 *   - 409 → tip was already settled (by a human or a prior run);
 *           response body includes the existing state; treat as
 *           success for retry/dedupe purposes
 *   - 404 → tip vanished between list_tips and settle_tip; skip
 *   - 422 → tip's `odds` string isn't strict-parseable; skip and
 *           surface in the run summary so a human can backfill
 *
 * Auth: Bearer ${BWN_AGENT_TOKEN}.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = verifyAgentRequest(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Request body must be an object with 'result'." } },
      { status: 400 }
    );
  }

  const { result } = body as { result?: unknown };
  if (typeof result !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "invalid_result",
          message: "'result' must be one of 'WON' | 'LOST' | 'VOID'.",
        },
      },
      { status: 400 }
    );
  }

  const outcome = await settleTipForAgent(id, result);

  switch (outcome.status) {
    case "ok":
      return NextResponse.json({
        ok: true,
        tip: outcome.tip,
        cascadedBets: outcome.cascadedBets,
      });

    case "already_settled":
      // 409 with the existing state — the agent treats this as
      // success. We return the same shape as the happy path so the
      // agent only needs one branch.
      return NextResponse.json(
        {
          ok: true,
          alreadySettled: true,
          tip: outcome.tip,
        },
        { status: 409 }
      );

    case "not_found":
      return NextResponse.json(
        { error: { code: "tip_not_found", message: `No tip with id ${id}.` } },
        { status: 404 }
      );

    case "invalid_result":
      return NextResponse.json(
        {
          error: {
            code: "invalid_result",
            message: "'result' must be one of 'WON' | 'LOST' | 'VOID'.",
          },
        },
        { status: 400 }
      );

    case "pending_not_allowed":
      return NextResponse.json(
        {
          error: {
            code: "pending_not_allowed",
            message: "The agent cannot settle a tip back to PENDING.",
          },
        },
        { status: 400 }
      );

    case "odds_not_parseable":
      return NextResponse.json(
        {
          error: {
            code: "odds_not_parseable",
            message: `Tip odds "${outcome.odds}" are not a well-formed fraction (a/b) and oddsDecimal is null. A human needs to backfill oddsDecimal before this tip can be settled by the agent.`,
          },
        },
        { status: 422 }
      );

    default: {
      // Exhaustiveness check: if a new status is added to
      // AgentSettleResult, TypeScript will flag this line.
      const _exhaustive: never = outcome;
      void _exhaustive;
      return NextResponse.json(
        { error: { code: "unknown_outcome", message: "Unhandled settlement outcome." } },
        { status: 500 }
      );
    }
  }
}
