/**
 * Shared Discord-posting helper for agent-facing code paths.
 *
 * Called by both the legacy HTTP endpoint (/api/agent/notify) and the
 * new in-process MCP route (/api/mcp) so they stay in lockstep. The
 * webhook URL lives in DISCORD_TIP_WEBHOOK_URL and is deliberately
 * owned by BWN — agents never see it.
 */

export const AGENT_NOTIFY_SOURCES = [
  "daily-digest",
  "tip-settler",
  "odds-mover",
  "strategy-drafter",
  "weekly-leaderboard",
] as const;

export type AgentNotifySource = (typeof AGENT_NOTIFY_SOURCES)[number];

export const DISCORD_CONTENT_LIMIT = 2000;

export interface PostDiscordInput {
  source: AgentNotifySource;
  content?: string;
  embeds?: unknown[]; // Discord-shaped; we don't validate the interior
  username?: string;
}

export type PostDiscordResult =
  | { status: "ok"; source: AgentNotifySource }
  | { status: "webhook_not_configured" }
  | { status: "empty_message" }
  | { status: "content_too_long"; length: number }
  | {
      status: "webhook_failed";
      httpStatus: number;
      upstream: string;
    }
  | { status: "webhook_error"; message: string };

/**
 * Posts a prebuilt Discord message via the DISCORD_TIP_WEBHOOK_URL.
 *
 * Returns a discriminated union describing the outcome. All validation
 * errors return structured statuses rather than throwing so both HTTP
 * route handlers and MCP tool runners can map them into their native
 * response shapes (HTTP status codes vs. MCP tool errors).
 */
export async function postDiscordMessage(
  input: PostDiscordInput
): Promise<PostDiscordResult> {
  const webhookUrl = process.env.DISCORD_TIP_WEBHOOK_URL;
  if (!webhookUrl) {
    return { status: "webhook_not_configured" };
  }

  if (input.content === undefined && input.embeds === undefined) {
    return { status: "empty_message" };
  }

  if (
    typeof input.content === "string" &&
    input.content.length > DISCORD_CONTENT_LIMIT
  ) {
    return { status: "content_too_long", length: input.content.length };
  }

  const body: Record<string, unknown> = {
    username:
      typeof input.username === "string" && input.username.length > 0
        ? input.username
        : "BWN Agents",
  };
  if (typeof input.content === "string") body.content = input.content;
  if (Array.isArray(input.embeds)) body.embeds = input.embeds;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[agent-notify] Discord webhook failed (${res.status}) from source=${input.source}: ${text}`
      );
      return {
        status: "webhook_failed",
        httpStatus: res.status,
        upstream: text.slice(0, 500),
      };
    }
    return { status: "ok", source: input.source };
  } catch (err) {
    console.error("[agent-notify] Discord webhook error:", err);
    return {
      status: "webhook_error",
      message:
        err instanceof Error ? err.message : "Unknown error posting to Discord.",
    };
  }
}
