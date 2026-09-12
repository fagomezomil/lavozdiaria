/**
 * Script standalone: publica resultados de partidos jugados (equipos tracked)
 * como stories IG/FB (+ feed 4:5 para tucumanos) usando las placas de
 * src/lib/social/partido-placas.tsx.
 *
 * Corre cada 15 min en franja de partidos via cron-partido.sh, que ANTES
 * refresca resultados con futbol.py y después dispara este script como
 * proceso Node aparte (systemd oneshot quenoticia-partido.service, cgroup
 * propio para no estresar el proceso web con takumi+satori+sharp).
 *
 * Uso (VPS):
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/build-partido.ts
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/build-partido.ts --dry-run
 *
 * Env vars requeridas (cargadas por el wrapper bash del systemd service):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   BUFFER_API_KEY, BUFFER_CHANNEL_IDS
 */

import { buildPartido } from "@/lib/social/build-partido";

const dryRun = process.argv.includes("--dry-run");

function log(obj: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }));
}

async function main(): Promise<number> {
  console.log("=== build-partido start ===");

  const bufferKey = dryRun ? "" : process.env.BUFFER_API_KEY ?? "";
  const channelIds = dryRun
    ? []
    : (process.env.BUFFER_CHANNEL_IDS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  try {
    const result = await buildPartido(bufferKey || undefined, channelIds);

    log({
      success: result.status !== "failed",
      triggered: result.triggered,
      status: result.status,
      publicados: result.publicados.map((p) => ({
        matchId: p.matchId,
        partido: p.partido,
        kind: p.kind,
        storyUrl: p.storyUrl,
        feedUrl: p.feedUrl,
      })),
      pendientes: result.pendientes,
      error: result.error,
      dryRun,
    });
    console.log("=== build-partido end ===");
    return result.status === "failed" ? 1 : 0;
  } catch (error) {
    console.error("build-partido error:", error);
    log({ success: false, error: String(error), dryRun });
    console.log("=== build-partido end ===");
    return 1;
  }
}

main().then((code) => process.exit(code));