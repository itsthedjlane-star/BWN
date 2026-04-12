import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchRacingMeetings, RacingDiscipline } from "@/lib/racing";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const discipline = req.nextUrl.searchParams.get("discipline");
  if (discipline !== "horses" && discipline !== "greyhounds") {
    return NextResponse.json(
      { error: "discipline must be 'horses' or 'greyhounds'" },
      { status: 400 }
    );
  }

  try {
    const meetings = await fetchRacingMeetings(discipline as RacingDiscipline);
    return NextResponse.json(meetings);
  } catch (err) {
    console.error("Failed to fetch racing meetings:", err);
    return NextResponse.json(
      { error: "Failed to fetch racing meetings" },
      { status: 500 }
    );
  }
}
