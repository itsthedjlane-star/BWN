import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/invite-applications
 *
 * Public endpoint — anyone can apply. We enforce a 24-hour cooldown
 * per email so a bored bot can't spam the admin queue.
 */

const ApplySchema = z.object({
  email: z.string().trim().email().max(254),
  reason: z.string().trim().min(10).max(1000),
  source: z.string().trim().max(120).nullable().optional(),
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are 18 or over." }),
  }),
});

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const parsed = ApplySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Invalid application." },
      { status: 400 }
    );
  }

  const { email, reason, source } = parsed.data;

  const recent = await prisma.inviteApplication.findFirst({
    where: {
      email: email.toLowerCase(),
      createdAt: { gte: new Date(Date.now() - COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return NextResponse.json(
      {
        error:
          "You already applied recently — give us a day to reply before sending another.",
      },
      { status: 429 }
    );
  }

  await prisma.inviteApplication.create({
    data: {
      email: email.toLowerCase(),
      reason,
      source: source ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
