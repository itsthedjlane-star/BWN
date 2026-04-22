import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/invite-applications — list applications for review.
 * Admins only. Query `?status=PENDING|APPROVED|REJECTED` to filter;
 * default is no filter.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statusParam = new URL(req.url).searchParams.get("status");
  const status =
    statusParam === "PENDING" ||
    statusParam === "APPROVED" ||
    statusParam === "REJECTED"
      ? statusParam
      : undefined;

  const applications = await prisma.inviteApplication.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { inviteCode: { select: { code: true } } },
  });

  return NextResponse.json(applications);
}
