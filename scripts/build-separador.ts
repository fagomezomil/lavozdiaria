/**
 * Script standalone: genera 3 placas separadoras del feed IG/FB y las publica
 * via Buffer como 3 publicaciones SEPARADAS (no carrusel swipe).
 *
 * Se publica cada 9 carruseles (threshold). Si el count de carruseles desde el
 * último separador es < 9, no hace nada (no-op).
 *
 * Reemplaza a un endpoint /api/social-separador. Corre como proceso Node aparte
 * con su propio cgroup (systemd oneshot service) para no estresar el proceso web
 * Next.js con el render Satori+Resvg+sharp.
 *
 * Uso (VPS):
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/build-separador.ts
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/build-separador.ts --dry-run
 *
 * Env vars requeridas (cargadas por el wrapper bash del systemd service):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   BUFFER_API_KEY, BUFFER_CHANNEL_IDS
 *
 * Cron del VPS dispara 2x/día después del carrusel via cron-separador.sh.
 */

import { buildSeparador } from "@/lib/social/build-separador";

const dryRun = process.argv.includes("--dry-run");

function log(obj: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }));
}

async function main(): Promise<number> {
  console.log("=== build-separador start ===");

  const bufferKey = dryRun ? "" : process.env.BUFFER_API_KEY ?? "";
  const channelIds = dryRun
    ? []
    : (process.env.BUFFER_CHANNEL_IDS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  try {
    const result = await buildSeparador(
      bufferKey || undefined,
      channelIds,
    );

    if (!result.triggered) {
      log({
        success: true,
        triggered: false,
        count: result.count,
        threshold: result.threshold,
        message: `esperando ${result.count}/${result.threshold} carruseles`,
        dryRun,
      });
      console.log("=== build-separador end ===");
      return 0;
    }

    log({
      success: true,
      triggered: true,
      count: result.count,
      threshold: result.threshold,
      placas: result.placas.map((p) => ({
        layout: p.layout,
        status: p.status,
        imageUrl: p.imageUrl,
        scheduled: p.scheduled.toISOString(),
        error: p.error,
      })),
      dryRun,
    });
    console.log("=== build-separador end ===");
    return 0;
  } catch (error) {
    console.error("build-separador error:", error);
    log({ success: false, error: String(error), dryRun });
    console.log("=== build-separador end ===");
    return 1;
  }
}

main().then((code) => process.exit(code));