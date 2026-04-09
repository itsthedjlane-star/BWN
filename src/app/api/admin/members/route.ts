import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Validate invite code and approve user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteCode } = await req.json();

  const code = await prisma.inviteCode.findUnique({
    where: { code: inviteCode },
  });

  if (!code || code.used) {
    return NextResponse.json({ error: "Invalid or used invite code" }, { status: 400 });
  }

  // Mark code as used and approve user
  await prisma.$transaction([
    prisma.inviteCode.update({
      where: { id: code.id },
      data: { used: true, usedBy: session.user.id },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { approved: true, inviteCode: inviteCode },
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
