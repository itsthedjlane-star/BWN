import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Verifies that an incoming request on /api/agent/* carries a valid
 * agent bearer token. This is the ONLY auth mechanism for the agent
 * API — NextAuth sessions are irrelevant here because agents run
 * server-to-server with no browser context.
 *
 * The token is stored in the BWN_AGENT_TOKEN env var and must match
 * exactly. Every agent write is attributed server-side to a synthetic
 * "BWN Agents" user, not to any human, so no per-user identity is
 * carried in the token.
 *
 * Usage:
 *
 *   export async function POST(req: NextRequest) {
 *     const unauthorized = verifyAgentRequest(req);
 *     if (unauthorized) return unauthorized;
 *     ...
 *   }
 *
 * Returns `null` if the request is authorized, otherwise a 401
 * NextResponse ready to return from the handler.
 */
export function verifyAgentRequest(req: NextRequest): NextResponse | null {
  const expected = process.env.BWN_AGENT_TOKEN;

  // Never allow agent writes if the token is not configured — fail closed.
  if (!expected) {
    return NextResponse.json(
      {
        error: {
          code: "agent_token_not_configured",
          message:
            "BWN_AGENT_TOKEN is not set on the server; agent endpoints are disabled.",
        },
      },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json(
      {
        error: {
          code: "unauthorized",
          message: "Missing or invalid agent bearer token.",
        },
      },
      { status: 401 }
    );
  }

  return null;
}
