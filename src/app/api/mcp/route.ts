import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { verifyAgentRequest } from "@/lib/agent-auth";
import { buildBwnMcpServer } from "@/lib/mcp/server";

/**
 * /api/mcp — Streamable HTTP transport for the BWN MCP server.
 *
 * This is the endpoint Anthropic Managed Agents connects to (declared
 * in the agent YAML as `{ type: "url", name: "bwn", url: ".../api/mcp" }`
 * with a vault supplying the Authorization header). It exposes the
 * same five tools as the legacy stdio wrapper in `bwn-api-mcp/`, but
 * runs in-process: tool calls invoke Prisma / buildDigest /
 * settleTipForAgent / postDiscordMessage directly, no HTTP hop.
 *
 * Auth: `Authorization: Bearer ${BWN_AGENT_TOKEN}`, checked with the
 * same `verifyAgentRequest` helper used by /api/agent/*.
 *
 * Mode: stateless. We don't pass a sessionIdGenerator, so each
 * request is independent and no session state survives across
 * requests. That's the right shape for Vercel's short-lived serverless
 * functions and for Managed Agents' expectation of a streamable HTTP
 * endpoint.
 *
 * Transport: JSON responses (`enableJsonResponse: true`) rather than
 * SSE. Our tool responses are small and synchronous, so we don't need
 * streaming — JSON is simpler to debug and cheaper on function duration.
 */

// Force the Node.js runtime — we import Prisma and the MCP SDK, both
// of which need Node built-ins. The Edge runtime would not work.
export const runtime = "nodejs";

// Never cache MCP calls. Each invocation is a live RPC against Prisma
// and external webhooks.
export const dynamic = "force-dynamic";

async function handle(req: NextRequest): Promise<Response> {
  const unauthorized = verifyAgentRequest(req);
  if (unauthorized) return unauthorized;

  // Fresh server + transport per request. The transport doesn't hold
  // state in stateless mode, but the Server wiring happens once per
  // call so the handlers close over request-scoped context cleanly.
  const server = buildBwnMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(req as unknown as Request);
  } catch (err) {
    console.error("[api/mcp] transport error:", err);
    return NextResponse.json(
      {
        error: {
          code: "mcp_transport_error",
          message: err instanceof Error ? err.message : "Unknown transport error.",
        },
      },
      { status: 500 }
    );
  } finally {
    // Best-effort cleanup. Transport.close() is safe to call even if
    // the request already completed.
    try {
      await transport.close();
    } catch {
      /* ignore */
    }
    try {
      await server.close();
    } catch {
      /* ignore */
    }
  }
}

export { handle as GET, handle as POST, handle as DELETE };
