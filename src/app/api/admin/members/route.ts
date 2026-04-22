import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POLICY_VERSION } from "@/lib/legal";

const RedeemSchema = z.object({
  inviteCode: z.string().trim().min(1).max(64),
  ageConfirmed: z.literal(true, {
    errorMap: () => ({
      message: "You must confirm you are 18 or over to join.",
    }),
  }),
  policyAccepted: z.literal(true, {
    errorMap: () => ({
      message:
        "You must agree to the Terms of Service and Privacy Notice to join.",
    }),
  }),
});

// POST: Validate invite code and approve user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = RedeemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { inviteCode } = parsed.data;

  const code = await prisma.inviteCode.findUnique({
    where: { code: inviteCode },
  });

  if (!code || code.used) {
    return NextResponse.json(
      { error: "Invalid or used invite code" },
      { status: 400 }
    );
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.inviteCode.update({
      where: { id: code.id },
      data: { used: true, usedBy: session.user.id },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        approved: true,
        inviteCode: inviteCode,
        ageConfirmedAt: now,
        policyAcceptedAt: now,
        policyVersionAccepted: POLICY_VERSION,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}

// GET: List members (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      approved: true,
      joinedAt: true,
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(members);
}
