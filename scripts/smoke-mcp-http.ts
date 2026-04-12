#!/usr/bin/env tsx
/**
 * Smoke test for /api/mcp — in-process version.
 *
 * Instead of standing up a full Next dev server, we import the
 * buildBwnMcpServer factory directly, spin up a
 * WebStandardStreamableHTTPServerTransport, connect them, and hand it
 * Web Standard Request objects. This tests the MCP SDK wiring, tool
 * registration, zod→JSON Schema conversion, and error handling
 * without needing a live HTTP server.
 *
 * STATELESS MODE NOTE: WebStandardStreamableHTTPServerTransport in
 * stateless mode (sessionIdGenerator: undefined) rejects reuse — each
 * request MUST get a fresh transport. This mirrors how the actual
 * /api/mcp route handler works (new server + transport per request).
 * The smoke test's mcpRequest() helper does exactly that.
 *
 * What this DOES test:
 *   - initialize handshake
 *   - tools/list returning all five tools with JSON schemas
 *   - unknown_tool error path
 *   - invalid_arguments error path (zod failure)
 *
 * What this does NOT test:
 *   - live Prisma queries (we stub DATABASE_URL so prisma constructs
 *     lazily but we never trigger a query)
 *   - the verifyAgentRequest middleware in the route handler (that's
 *     tested by whatever hits /api/mcp via fetch)
 *   - buildDigest / settleTipForAgent (covered by existing Prisma
 *     unit tests and the stdio smoke test against the stub server)
 *
 * Usage:
 *   cd bwn && npx tsx scripts/smoke-mcp-http.ts
 */

// Set a placeholder DATABASE_URL so @/lib/prisma can construct the
// adapter at module load. We never actually query the DB in this
// script, so the URL just needs to be present and syntactically
// plausible.
process.env.DATABASE_URL ??= "postgresql://smoke:smoke@127.0.0.1:5432/smoke";

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildBwnMcpServer } from "@/lib/mcp/server";

const TRANSPORT_OPTS = {
  sessionIdGenerator: undefined, // stateless — fresh transport per request
  enableJsonResponse: true,
} as const;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

/**
 * Fire a single JSON-RPC request through a fresh server+transport
 * pair — matching how the Next route handler works in production.
 */
async function mcpRequest(
  payload: Record<string, unknown>
): Promise<{ status: number; json: unknown; headers: Headers }> {
  const server = buildBwnMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport(TRANSPORT_OPTS);
  await server.connect(transport);

  const headers = new Headers({
    "content-type": "application/json",
    // MCP Streamable HTTP requires the client to advertise both
    // content types so the transport knows the client can handle a
    // potential SSE upgrade — even though with enableJsonResponse the
    // server stays in JSON mode.
    accept: "application/json, text/event-stream",
  });

  const req = new Request("http://localhost/api/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  try {
    const res = await transport.handleRequest(req);
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { __raw: text };
    }
    return { status: res.status, json, headers: res.headers };
  } finally {
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

async function main() {
  /* ---------------- 1. initialize ---------------- */
  {
    const { status, json } = await mcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "smoke-http", version: "0.0.0" },
      },
    });
    assert(status === 200, `initialize HTTP status should be 200, got ${status}`);
    const result = (json as { result?: { serverInfo?: { name?: string } } }).result;
    assert(
      result?.serverInfo?.name === "bwn-mcp",
      `serverInfo.name should be bwn-mcp, got ${result?.serverInfo?.name}`
    );
    console.log("✓ initialize → server name = bwn-mcp");
  }

  /* ---------------- 2. tools/list ---------------- */
  {
    const { status, json } = await mcpRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });
    assert(status === 200, `tools/list HTTP status ${status}`);
    const parsed = json as {
      result?: { tools?: Array<{ name: string; description: string; inputSchema: unknown }> };
      error?: { code: number; message: string };
    };
    if (parsed.error) {
      throw new Error(`tools/list returned JSON-RPC error: ${JSON.stringify(parsed.error)}`);
    }
    const tools = parsed.result?.tools ?? [];
    const names = tools.map((t) => t.name).sort();
    const expected = [
      "build_digest",
      "get_tip",
      "list_tips",
      "post_discord_message",
      "settle_tip",
    ];
    assert(
      JSON.stringify(names) === JSON.stringify(expected),
      `tools/list expected ${JSON.stringify(expected)}, got ${JSON.stringify(names)}`
    );
    for (const t of tools) {
      assert(
        typeof t.description === "string" && t.description.length > 10,
        `${t.name} missing description`
      );
      assert(
        typeof t.inputSchema === "object" && t.inputSchema !== null,
        `${t.name} missing inputSchema`
      );
    }
    console.log(`✓ tools/list → ${tools.length} tools (${names.join(", ")})`);
  }

  /* ---------------- 3. tools/call unknown tool ---------------- */
  {
    const { status, json } = await mcpRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "does_not_exist", arguments: {} },
    });
    assert(status === 200, `unknown tool HTTP status ${status}`);
    const parsed = json as {
      result?: { isError?: boolean; content?: Array<{ text: string }> };
    };
    assert(parsed.result?.isError === true, "unknown tool should set isError:true");
    const body = JSON.parse(parsed.result!.content![0]!.text) as {
      error: { code: string };
    };
    assert(
      body.error.code === "unknown_tool",
      `expected error.code=unknown_tool, got ${body.error.code}`
    );
    console.log("✓ tools/call does_not_exist → isError unknown_tool");
  }

  /* ---------------- 4. tools/call invalid args ---------------- */
  {
    const { status, json } = await mcpRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "settle_tip",
        arguments: { id: "", result: "MAYBE" }, // both invalid per schema
      },
    });
    assert(status === 200, `invalid-args HTTP status ${status}`);
    const parsed = json as {
      result?: { isError?: boolean; content?: Array<{ text: string }> };
    };
    assert(parsed.result?.isError === true, "invalid args should set isError:true");
    const body = JSON.parse(parsed.result!.content![0]!.text) as {
      error: { code: string };
    };
    assert(
      body.error.code === "invalid_arguments",
      `expected error.code=invalid_arguments, got ${body.error.code}`
    );
    console.log("✓ tools/call settle_tip {id:'', result:'MAYBE'} → isError invalid_arguments");
  }

  console.log("\n✓ MCP HTTP smoke test passed — transport, registration, error paths all green");
}

main().catch((err) => {
  console.error("\n✗ MCP HTTP smoke test FAILED:", err);
  process.exit(1);
});
