/**
 * Mint a new AgentKey and print the token exactly once.
 *
 *   npx tsx scripts/mint-agent-key.ts \
 *     --name tip-settler \
 *     --scopes tips:read,tips:settle,notify:send \
 *     --notes "Production Tip Settler agent"
 *
 * The printed token has the shape `<kid>.<secret>`; we only store
 * `sha256(secret)` in the DB, so this is the only moment the caller
 * sees it. Copy it into the secrets manager for the agent host.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash, randomBytes } from "node:crypto";
import dotenv from "dotenv";

import { AGENT_SCOPES, type AgentScope } from "../src/lib/agent-auth";

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

function parseArgs(): {
  name: string;
  scopes: AgentScope[];
  notes: string | null;
} {
  const args = process.argv.slice(2);
  const get = (flag: string): string | null => {
    const i = args.indexOf(flag);
    if (i === -1 || i === args.length - 1) return null;
    return args[i + 1];
  };

  const name = get("--name");
  const scopesRaw = get("--scopes");
  const notes = get("--notes");

  if (!name || !scopesRaw) {
    console.error(
      "Usage: npx tsx scripts/mint-agent-key.ts --name <label> --scopes <csv> [--notes <string>]"
    );
    console.error(`  Available scopes: ${AGENT_SCOPES.join(", ")}`);
    process.exit(1);
  }

  const scopes = scopesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const invalid = scopes.filter(
    (s): s is string => !(AGENT_SCOPES as readonly string[]).includes(s)
  );
  if (invalid.length > 0) {
    console.error(`Unknown scope(s): ${invalid.join(", ")}`);
    console.error(`Available: ${AGENT_SCOPES.join(", ")}`);
    process.exit(1);
  }

  return { name, scopes: scopes as AgentScope[], notes: notes ?? null };
}

async function main() {
  const { name, scopes, notes } = parseArgs();

  const secret = randomBytes(32).toString("base64url");
  const hashedSecret = createHash("sha256").update(secret).digest("base64url");

  const key = await prisma.agentKey.create({
    data: { name, hashedSecret, scopes, notes },
  });

  const token = `${key.id}.${secret}`;

  console.log("");
  console.log("  ╔══ AgentKey minted ═════════════════════════════════════════");
  console.log(`  ║ id:     ${key.id}`);
  console.log(`  ║ name:   ${key.name}`);
  console.log(`  ║ scopes: ${scopes.join(", ")}`);
  if (notes) console.log(`  ║ notes:  ${notes}`);
  console.log(`  ║`);
  console.log(`  ║ TOKEN (shown once — store it now):`);
  console.log(`  ║   ${token}`);
  console.log("  ╚════════════════════════════════════════════════════════════");
  console.log("");
  console.log(
    "Send as:   Authorization: Bearer " + token.slice(0, 12) + "…"
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
