import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";

/**
 * Keyed agent authentication.
 *
 * Tokens issued by `scripts/mint-agent-key.ts` have the shape
 * `<kid>.<secret>` — the kid is the `AgentKey.id` (cuid) and the secret
 * is 32 random bytes base64url-encoded. We store only
 * `sha256(secret)` in the DB so a leaked DB read cannot replay tokens.
 *
 * Every write surface under /api/agent/* and /api/mcp now requires a
 * specific scope (e.g. "tips:settle"). Each key is minted with an
 * explicit scope set so a compromised key has a bounded blast radius.
 *
 * Legacy fallback: if the token does NOT contain a dot, it is compared
 * against `process.env.BWN_AGENT_TOKEN` with a constant-time compare.
 * Legacy tokens are granted all scopes so existing agents keep working
 * during rollout, but a server-side warning is logged on every hit so
 * we can see who still needs to migrate.
 */

export const AGENT_SCOPES = [
  "digest:read",
  "tips:read",
  "tips:settle",
  "notify:send",
  "mcp:all",
] as const;

export type AgentScope = (typeof AGENT_SCOPES)[number];

export type AgentIdentity =
  | { type: "keyed"; keyId: string; name: string; scopes: AgentScope[] }
  | { type: "legacy"; keyId: null };

function sha256Base64Url(input: string): string {
  return createHash("sha256").update(input).digest("base64url");
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function unauthorizedResponse(): NextResponse {
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

function forbiddenResponse(scope: AgentScope): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "forbidden",
        message: `Agent key lacks required scope: ${scope}`,
      },
    },
    { status: 403 }
  );
}

function notConfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "agent_token_not_configured",
        message:
          "Agent endpoints are disabled: no AgentKey rows exist and BWN_AGENT_TOKEN is not set.",
      },
    },
    { status: 503 }
  );
}

export async function authenticateAgent(
  req: NextRequest
): Promise<
  | { ok: true; identity: AgentIdentity }
  | { ok: false; response: NextResponse }
> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, response: unauthorizedResponse() };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return { ok: false, response: unauthorizedResponse() };

  const dotIndex = token.indexOf(".");
  if (dotIndex > 0 && dotIndex < token.length - 1) {
    return authenticateKeyed(token.slice(0, dotIndex), token.slice(dotIndex + 1));
  }

  return authenticateLegacy(token);
}

async function authenticateKeyed(
  kid: string,
  secret: string
): Promise<
  | { ok: true; identity: AgentIdentity }
  | { ok: false; response: NextResponse }
> {
  let key;
  try {
    key = await prisma.agentKey.findUnique({ where: { id: kid } });
  } catch (err) {
    // DB unreachable, table missing, etc. — surface as 503 rather than
    // a generic 500 so callers know to retry, and log so ops sees it.
    console.error("[agent-auth] AgentKey lookup failed:", err);
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: {
            code: "agent_auth_unavailable",
            message:
              "Agent key store is temporarily unavailable. Retry or use a legacy token.",
          },
        },
        { status: 503 }
      ),
    };
  }
  if (!key || key.revokedAt) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const providedHash = sha256Base64Url(secret);
  if (!constantTimeEqual(providedHash, key.hashedSecret)) {
    return { ok: false, response: unauthorizedResponse() };
  }

  // Fire-and-forget lastUsedAt bump; we don't want a slow write to
  // block the actual request.
  void prisma.agentKey
    .update({ where: { id: kid }, data: { lastUsedAt: new Date() } })
    .catch((err) => {
      console.error("[agent-auth] failed to update lastUsedAt", err);
    });

  return {
    ok: true,
    identity: {
      type: "keyed",
      keyId: key.id,
      name: key.name,
      scopes: (key.scopes as AgentScope[]) ?? [],
    },
  };
}

function authenticateLegacy(token: string):
  | { ok: true; identity: AgentIdentity }
  | { ok: false; response: NextResponse } {
  const legacy = process.env.BWN_AGENT_TOKEN;
  if (!legacy) {
    return { ok: false, response: notConfiguredResponse() };
  }
  if (!constantTimeEqual(token, legacy)) {
    return { ok: false, response: unauthorizedResponse() };
  }
  console.warn(
    "[agent-auth] BWN_AGENT_TOKEN (legacy) accepted. Migrate callers to keyed tokens via `npx tsx scripts/mint-agent-key.ts`."
  );
  return { ok: true, identity: { type: "legacy", keyId: null } };
}

export async function requireAgentScope(
  req: NextRequest,
  scope: AgentScope
): Promise<
  | { ok: true; identity: AgentIdentity }
  | { ok: false; response: NextResponse }
> {
  const result = await authenticateAgent(req);
  if (!result.ok) return result;
  const { identity } = result;
  if (identity.type === "legacy") return { ok: true, identity };
  if (!identity.scopes.includes(scope)) {
    return { ok: false, response: forbiddenResponse(scope) };
  }
  return { ok: true, identity };
}

/**
 * Emit a one-line audit log for an agent write. Keep this cheap and
 * structured so a log sink can index on `keyId` and `op`.
 */
export function logAgentOp(
  identity: AgentIdentity,
  op: string,
  extra: Record<string, unknown> = {}
): void {
  const label = identity.type === "keyed" ? identity.name : "legacy";
  const keyId = identity.type === "keyed" ? identity.keyId : null;
  console.log(
    `[agent] op=${op} key=${label} keyId=${keyId ?? "-"} ${JSON.stringify(extra)}`
  );
}
