import { NextResponse } from "next/server";
import { syncAllSections } from "@/lib/sync-news";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const secret = process.env.CRON_SECRET;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllSections();
    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      details: result.details,
      timestamp: new Date().toISOString(),
      note: "List sync only. Call /api/backfill-details?token=TOKEN to fill images/content.",
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}