import { NextRequest, NextResponse } from "next/server";
import { runTipsterScrapes } from "@/lib/tipster-sources";

// Vercel Cron job — runs tipster source adapters and upserts into the DB.
// See src/lib/tipster-sources/README.md for how to enable real sources.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summaries = await runTipsterScrapes();
    return NextResponse.json({ success: true, summaries });
  } catch {
    return NextResponse.json(
      { error: "Tipster cron job failed" },
      { status: 500 }
    );
  }
}
