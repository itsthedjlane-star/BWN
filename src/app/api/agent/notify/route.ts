import { NextRequest, NextResponse } from "next/server";
import { verifyAgentRequest } from "@/lib/agent-auth";
import {
  AGENT_NOTIFY_SOURCES,
  DISCORD_CONTENT_LIMIT,
  postDiscordMessage,
  type AgentNotifySource,
} from "@/lib/agent-notify";

/**
 * POST /api/agent/notify
 *
 * Thin HTTP wrapper around `postDiscordMessage` from
 * `@/lib/agent-notify`. The same helper is used by the in-process MCP
 * route (/api/mcp → post_discord_message tool) so behavior stays
 * identical across both transports.
 *
 * We route notifications through BWN rather than handing the webhook
 * URL directly to the agent host for three reasons:
 *   1. the webhook URL stays in one place (BWN's env)
 *   2. BWN can add rate limiting and audit logging in one spot
 *   3. the agent host stays stateless and has no secrets beyond the
 *      bearer token
 *
 * Request body:
 *   {
 *     "content"?: string,              // <= 2000 chars (Discord hard cap)
 *     "embeds"?: unknown[],            // Discord-shaped embeds
 *     "username"?: string,             // optional override, default "BWN Agents"
 *     "source": "daily-digest" | "tip-settler" | "odds-mover"
 *               | "strategy-drafter" | "weekly-leaderboard"
 *   }
 *
 * At least one of `content` or `embeds` must be present.
 *
 * Auth: `Authorization: Bearer ${BWN_AGENT_TOKEN}`.
 */

const ALLOWED_SOURCES = new Set<string>(AGENT_NOTIFY_SOURCES);

export async function POST(req: NextRequest) {
  const unauthorized = verifyAgentRequest(req);
  if (unauthorized) return unauthorized;

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
      {
        error: {
          code: "invalid_body",
          message: "Request body must be a JSON object.",
        },
      },
      { status: 400 }
    );
  }

  const { content, embeds, username, source } = body as {
    content?: unknown;
    embeds?: unknown;
    username?: unknown;
    source?: unknown;
  };

  if (typeof source !== "string" || !ALLOWED_SOURCES.has(source)) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_source",
          message: `'source' must be one of: ${AGENT_NOTIFY_SOURCES.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  if (content !== undefined && typeof content !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "invalid_content",
          message: "'content' must be a string when provided.",
        },
      },
      { status: 400 }
    );
  }

  if (embeds !== undefined && !Array.isArray(embeds)) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_embeds",
          message: "'embeds' must be an array when provided.",
        },
      },
      { status: 400 }
    );
  }

  if (username !== undefined && typeof username !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "invalid_username",
          message: "'username' must be a string when provided.",
        },
      },
      { status: 400 }
    );
  }

  const result = await postDiscordMessage({
    source: source as AgentNotifySource,
    content: typeof content === "string" ? content : undefined,
    embeds: Array.isArray(embeds) ? (embeds as unknown[]) : undefined,
    username: typeof username === "string" ? username : undefined,
  });

  switch (result.status) {
    case "ok":
      return NextResponse.json({ ok: true, source: result.source });
    case "webhook_not_configured":
      return NextResponse.json(
        {
          error: {
            code: "webhook_not_configured",
            message:
              "DISCORD_TIP_WEBHOOK_URL is not set; agent notifications are disabled.",
          },
        },
        { status: 503 }
      );
    case "empty_message":
      return NextResponse.json(
        {
          error: {
            code: "empty_message",
            message: "Either 'content' or 'embeds' must be provided.",
          },
        },
        { status: 400 }
      );
    case "content_too_long":
      return NextResponse.json(
        {
          error: {
            code: "content_too_long",
            message: `'content' must be <= ${DISCORD_CONTENT_LIMIT} characters (Discord hard cap).`,
            length: result.length,
          },
        },
        { status: 400 }
      );
    case "webhook_failed":
      return NextResponse.json(
        {
          error: {
            code: "webhook_failed",
            message: `Discord webhook returned ${result.httpStatus}.`,
            upstream: result.upstream,
          },
        },
        { status: 502 }
      );
    case "webhook_error":
      return NextResponse.json(
        { error: { code: "webhook_error", message: result.message } },
        { status: 502 }
      );
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      return NextResponse.json(
        { error: { code: "internal_error", message: "Unhandled result status." } },
        { status: 500 }
      );
    }
  }
}
