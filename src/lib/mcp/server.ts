/**
 * MCP server builder for /api/mcp.
 *
 * The streamable HTTP transport is stateless in our deploy (Vercel
 * functions), so we construct a fresh `Server` instance per request
 * and tear it down after `handleRequest` resolves. This matches the
 * pattern in the MCP SDK docs for Cloudflare Workers / Hono.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";

import { BWN_MCP_TOOLS, McpToolError } from "@/lib/mcp/tools";

export function buildBwnMcpServer(): Server {
  const server = new Server(
    {
      name: "bwn-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: BWN_MCP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.schema, { target: "jsonSchema7" }),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const tool = BWN_MCP_TOOLS.find((t) => t.name === name);
    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: { code: "unknown_tool", message: `Unknown tool: ${name}` },
            }),
          },
        ],
      };
    }

    let parsed: unknown;
    try {
      parsed = tool.schema.parse(args ?? {});
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: {
                code: "invalid_arguments",
                message:
                  err instanceof Error ? err.message : "Invalid tool arguments.",
                status: 400,
              },
            }),
          },
        ],
      };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tool.run as (i: any) => Promise<unknown>)(parsed);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      if (err instanceof McpToolError) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: err.failure }, null, 2),
            },
          ],
        };
      }
      console.error(`[bwn-mcp] tool ${name} threw:`, err);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: {
                code: "internal_error",
                message:
                  err instanceof Error ? err.message : "Unknown tool failure.",
                status: 500,
              },
            }),
          },
        ],
      };
    }
  });

  return server;
}
