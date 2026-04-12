import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { approved } = body;

  if (typeof approved !== "boolean") {
    return NextResponse.json(
      { error: "approved must be a boolean" },
      { status: 400 }
    );
  }

  if (!approved && id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot revoke your own approval" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { approved },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      approved: true,
      joinedAt: true,
    },
  });

  return NextResponse.json(updated);
}
