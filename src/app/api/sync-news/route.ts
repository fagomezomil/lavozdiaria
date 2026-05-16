import { NextResponse } from "next/server";
import { syncAllSections } from "@/lib/sync-news";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Allow up to 5 minutes for sync

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (token !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllSections();
    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}