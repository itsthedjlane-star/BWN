import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/agent-keys/[id]
 *
 * Revokes an agent key. Body: `{ action: "revoke" }`. Revoked keys
 * remain in the table (for audit) but fail auth immediately.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = (await req.json().catch(() => null)) as
    | { action?: unknown }
    | null;

  if (!body || body.action !== "revoke") {
    return NextResponse.json(
      { error: "Body must be { action: 'revoke' }" },
      { status: 400 }
    );
  }

  const existing = await prisma.agentKey.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.revokedAt) {
    return NextResponse.json({
      ok: true,
      alreadyRevoked: true,
      revokedAt: existing.revokedAt,
    });
  }

  const updated = await prisma.agentKey.update({
    where: { id },
    data: { revokedAt: new Date() },
    select: { id: true, name: true, revokedAt: true },
  });

  return NextResponse.json({ ok: true, ...updated });
}
