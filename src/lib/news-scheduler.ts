import { CronJob } from "cron";

let scheduler: CronJob | null = null;

async function runSync() {
  console.log("[news-scheduler] Syncing articles from API...");
  try {
    const { syncAllSections } = await import("./sync-news");
    const result = await syncAllSections();
    console.log(`[news-scheduler] Synced ${result.synced} articles, errors: ${result.errors.length}`);
  } catch (err) {
    console.error("[news-scheduler] Error syncing:", err);
  }
}

export function startNewsScheduler() {
  if (scheduler) return; // Already running

  // Run initial sync after 10 seconds (give the server time to start)
  setTimeout(runSync, 10_000);

  // Then sync every hour at minute 5 (avoid :00 to reduce API load)
  scheduler = new CronJob(
    "5 * * * *",
    runSync,
    null, // onComplete
    true,  // start immediately
    "America/Argentina/Buenos_Aires",
  );

  console.log("[news-scheduler] Started — initial sync in 10s, then every hour at :05 (Buenos Aires time)");
}

export function stopNewsScheduler() {
  if (scheduler) {
    scheduler.stop();
    scheduler = null;
    console.log("[news-scheduler] Stopped");
  }
}