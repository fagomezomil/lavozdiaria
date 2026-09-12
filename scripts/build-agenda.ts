/**
 * Script standalone: genera 4 placas de agenda 9:16 (3 eventos + listado del día,
 * estilo EventModal de /agenda) y las publica a Buffer como stories IG/FB.
 *
 * 2 runs por día (via cron-agenda-social.sh):
 *   - 12:30 ART: mediodía — todos los eventos de hoy.
 *   - 17:15 ART: tarde — solo eventos con hora >= 17:00 (env AGENDA_MIN_HOUR=17),
 *     dedupeando las placas ya destacadas al mediodía.
 *
 * Reemplaza a un endpoint. Corre como proceso Node aparte con su propio cgroup
 * (systemd oneshot service) para no estresar el proceso web Next.js con el render
 * takumi+satori+sharp.
 *
 * Uso (VPS):
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/build-agenda.ts
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/build-agenda.ts --dry-run
 *
 * Env vars requeridas (cargadas por el wrapper bash del systemd service):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   BUFFER_API_KEY, BUFFER_CHANNEL_IDS
 *   AGENDA_MIN_HOUR (opcional, solo en el run de la tarde: 17)
 *
 * Cron del VPS dispara 2x/día via cron-agenda-social.sh.
 * Log a stdout/stderr → /var/log/quenoticia/agenda.log (via systemd StandardOutput).
 */

import { buildAgenda } from "@/lib/social/build-agenda";

const dryRun = process.argv.includes("--dry-run");

const minHourEnv = process.env.AGENDA_MIN_HOUR;
const minHour = minHourEnv ? parseInt(minHourEnv, 10) : undefined;
if (minHourEnv && (minHour === undefined || Number.isNaN(minHour))) {
  console.error(`AGENDA_MIN_HOUR inválida: ${minHourEnv}`);
  process.exit(1);
}

function log(obj: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }));
}

async function main(): Promise<number> {
  console.log("=== build-agenda start ===");

  const bufferKey = dryRun ? "" : process.env.BUFFER_API_KEY ?? "";
  const channelIds = dryRun
    ? []
    : (process.env.BUFFER_CHANNEL_IDS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  try {
    const result = await buildAgenda(
      bufferKey || undefined,
      channelIds,
      minHour !== undefined ? { minHour } : undefined,
    );

    log({
      success: result.status !== "failed",
      triggered: result.triggered,
      status: result.status,
      countHoy: result.countHoy,
      countTarde: result.countTarde,
      slides: result.slides.map((s) => ({ slug: s.slug, url: s.url })),
      feedSlides: result.feedSlides.map((s) => ({ slug: s.slug, url: s.url })),
      error: result.error,
      dryRun,
    });
    console.log("=== build-agenda end ===");
    return result.status === "failed" ? 1 : 0;
  } catch (error) {
    console.error("build-agenda error:", error);
    log({ success: false, error: String(error), dryRun });
    console.log("=== build-agenda end ===");
    return 1;
  }
}

main().then((code) => process.exit(code));