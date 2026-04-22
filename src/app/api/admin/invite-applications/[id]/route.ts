import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/invite-codes";

/**
 * POST /api/admin/invite-applications/[id]
 *
 * Admin review action. Body:
 *   { action: "approve", reviewNotes?: string }  → mints an InviteCode
 *   { action: "reject",  reviewNotes?: string }
 *
 * Idempotent: applying the same action twice returns the existing
 * state without side effects.
 */

const ReviewSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    reviewNotes: z.string().max(1000).optional(),
  }),
  z.object({
    action: z.literal("reject"),
    reviewNotes: z.string().max(1000).optional(),
  }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const parsed = ReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Body must be { action: 'approve' | 'reject', reviewNotes? }" },
      { status: 400 }
    );
  }
  const { action, reviewNotes } = parsed.data;

  const app = await prisma.inviteApplication.findUnique({
    where: { id },
    include: { inviteCode: { select: { code: true } } },
  });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (app.status !== "PENDING") {
    // Idempotent: return current state.
    return NextResponse.json({ ok: true, alreadyReviewed: true, application: app });
  }

  const now = new Date();
  const adminId = session.user.id;

  if (action === "reject") {
    const updated = await prisma.inviteApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: now,
        reviewedBy: adminId,
        reviewNotes: reviewNotes ?? null,
      },
    });
    return NextResponse.json({ ok: true, application: updated });
  }

  // Approve: mint a single-use InviteCode and link it.
  const [code, updated] = await prisma.$transaction(async (tx) => {
    const code = await tx.inviteCode.create({
      data: { code: generateInviteCode() },
    });
    const updated = await tx.inviteApplication.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: now,
        reviewedBy: adminId,
        reviewNotes: reviewNotes ?? null,
        inviteCodeId: code.id,
      },
      include: { inviteCode: { select: { code: true } } },
    });
    return [code, updated];
  });

  return NextResponse.json({ ok: true, application: updated, code: code.code });
}
