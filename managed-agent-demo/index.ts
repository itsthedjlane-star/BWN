import Anthropic from "@anthropic-ai/sdk";

const AGENT_ID = "agent_011CZvYqX6TFYYinCSDYatq7";
const ENVIRONMENT_ID = "env_01UQtgajE9ZSRUKp55XNmi9F";
const BETAS = ["managed-agents-2026-04-01"];

async function main(): Promise<void> {
  const userInput =
    process.argv.slice(2).join(" ").trim() || "Hello, agent!";

  const client = new Anthropic();
  const sessions = (client as any).beta.sessions;

  // 1. Create a session tied to the managed agent's environment.
  const session = await sessions.create({
    agent_id: AGENT_ID,
    environment_id: ENVIRONMENT_ID,
    betas: BETAS,
  });

  console.error(`[session ${session.id} created]`);

  // 2. Open the event stream BEFORE sending so we don't miss the response.
  const stream = await sessions.events.stream(session.id, { betas: BETAS });

  // 3. Send the user's message as a user.message event.
  await sessions.events.send(session.id, {
    event: {
      type: "user.message",
      content: [{ type: "text", text: userInput }],
    },
    betas: BETAS,
  });

  // 4. Print agent.message text as it streams; stop on session.status_idle.
  try {
    for await (const event of stream as AsyncIterable<any>) {
      const type: string | undefined = event?.type;

      if (type === "agent.message") {
        const delta = event.delta ?? event.message?.delta;
        const text =
          typeof delta?.text === "string"
            ? delta.text
            : typeof event.text === "string"
            ? event.text
            : extractText(event.message?.content);
        if (text) process.stdout.write(text);
        continue;
      }

      if (type === "session.status_idle") {
        process.stdout.write("\n");
        console.error("[session idle — done]");
        break;
      }

      if (type === "error" || event?.error) {
        console.error("\n[stream error]", event.error ?? event);
        process.exit(1);
      }
    }
  } catch (err) {
    console.error("\n[fatal stream error]", err);
    process.exit(1);
  }
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .map((block: any) =>
      block?.type === "text" && typeof block.text === "string" ? block.text : ""
    )
    .join("");
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
