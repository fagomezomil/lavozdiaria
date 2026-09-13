/**
 * Script standalone: publica el reel MP4 generado en la PC de Fede.
 *
 * build-reel.mjs (local) hace: query DB → guion → TTS → render Remotion →
 * scp mp4+manifest a /opt/scraper/reels-incoming/. Este script (VPS) hace:
 *
 *   1. Toma el par reel-{ts}.mp4 + reel-{ts}.json más nuevo de reels-incoming.
 *   2. Sube el MP4 a R2 (media/social/reel-{ts}.mp4).
 *   3. Publica via Buffer (video asset) a IG + FB.
 *   4. Inserta social_posts kind="reel" (article_ids → dedupe 72h en local).
 *   5. Mueve los archivos a /opt/scraper/reels-done/.
 *
 * Disparado por systemd oneshot quenoticia-reels.service desde la PC de Fede
 * (ssh systemctl start). Sin archivo en incoming → no-op limpio (exit 0).
 *
 * Uso (VPS):
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/publish-reel.ts [--dry-run]
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BUFFER_API_KEY,
 * R2_* (.env.production, cargado por el unit).
 */

import fs from "node:fs";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bufferPublish } from "@/lib/social/buffer-client";
import { r2Upload } from "@/lib/r2";

const INCOMING = "/opt/scraper/reels-incoming";
const DONE = "/opt/scraper/reels-done";

const dryRun = process.argv.includes("--dry-run");

function log(obj: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }));
}

interface ReelManifest {
  ts: number;
  mp4: string;
  caption: string;
  articleIds: string[];
  sections: string[];
}

/** Hashtags fijos del reel (IG SEO). Si el caption del manifest ya trae alguno,
 *  no se duplica. */
const REEL_HASHTAGS = ["#Tucuman", "#QueNoticia"];

function captionConHashtags(caption: string): string {
  const yaTiene = REEL_HASHTAGS.some((h) =>
    caption.toLowerCase().includes(h.toLowerCase()),
  );
  return yaTiene ? caption : `${caption}\n\n${REEL_HASHTAGS.join(" ")}`;
}

/** Par mp4+manifest más nuevo en reels-incoming (o null si no hay). */
function encontrarPar(): { mp4: string; manifest: string } | null {
  if (!fs.existsSync(INCOMING)) return null;
  const jsons = fs
    .readdirSync(INCOMING)
    .filter((f) => /^reel-\d+\.json$/.test(f))
    .sort();
  for (let i = jsons.length - 1; i >= 0; i--) {
    const manifest = path.join(INCOMING, jsons[i]);
    const mp4 = manifest.replace(/\.json$/, ".mp4");
    if (fs.existsSync(mp4)) return { mp4, manifest };
    console.error(`publish-reel: manifest sin mp4 (se ignora): ${jsons[i]}`);
  }
  return null;
}

async function main(): Promise<number> {
  console.log("=== publish-reel start ===");

  const par = encontrarPar();
  if (!par) {
    log({ success: true, noop: true, message: "sin reels en incoming" });
    console.log("=== publish-reel end ===");
    return 0;
  }

  const manifest: ReelManifest = JSON.parse(fs.readFileSync(par.manifest, "utf-8"));
  const ts = manifest.ts;
  const caption = captionConHashtags(manifest.caption);
  log({ reelTs: ts, mp4: path.basename(par.mp4), sections: manifest.sections });

  // 1. MP4 → Buffer de memoria → R2
  const mp4Buffer = fs.readFileSync(par.mp4);
  if (mp4Buffer.length < 100_000) {
    log({ success: false, error: `mp4 sospechosamente chico: ${mp4Buffer.length} bytes` });
    return 1;
  }

  let mp4Url: string | null = null;
  if (!dryRun) {
    mp4Url = await r2Upload("media", `social/reel-${ts}.mp4`, mp4Buffer, "video/mp4");
    if (!mp4Url) {
      log({ success: false, error: "upload R2 falló" });
      return 1;
    }
    log({ r2: mp4Url, bytes: mp4Buffer.length });
  }

  // 2. Buffer: video a IG (Reel) + FB
  let status: "published" | "pending" | "failed" = "pending";
  let errorMsg: string | null = dryRun ? "dry-run" : null;
  let channelTargets: unknown[] = [];
  let bufferUpdateIds: string[] = [];

  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  if (!dryRun && bufferKey) {
    const res = await bufferPublish(bufferKey, [], caption, [mp4Url!], undefined, "video");
    channelTargets = res.channelTargets;
    bufferUpdateIds = res.channelTargets
      .filter((t) => t.postId)
      .map((t) => t.postId as string);
    status = res.success ? "published" : "failed";
    errorMsg = res.success ? null : (res.error ?? "buffer falló");
    log({ buffer: { status, skipped: res.skippedByLimit, error: errorMsg } });
  } else if (!dryRun) {
    errorMsg = "BUFFER_API_KEY missing — guardado como pending";
  }

  // 3. social_posts kind="reel" (dedupe + métricas + grid)
  if (!dryRun) {
    const admin = await getSupabaseAdmin();
    const { error: errSave } = await admin.from("social_posts").insert({
      status,
      kind: "reel",
      article_ids: manifest.articleIds,
      sections: manifest.sections,
      slide_image_urls: mp4Url ? [mp4Url] : [],
      caption,
      channel_targets: channelTargets,
      buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
      error_message: errorMsg,
      scheduled_at: new Date().toISOString(),
      published_at: status === "published" ? new Date().toISOString() : null,
    });
    if (errSave) {
      log({ success: false, error: `social_posts insert: ${errSave.message}` });
      return 1;
    }
    log({ db: "social_posts insert ok", status });
  }

  // 4. Mover a done/
  if (!dryRun) {
    fs.mkdirSync(DONE, { recursive: true });
    fs.renameSync(par.mp4, path.join(DONE, path.basename(par.mp4)));
    fs.renameSync(par.manifest, path.join(DONE, path.basename(par.manifest)));
  }

  log({ success: true, status, dryRun });
  console.log("=== publish-reel end ===");
  return 0;
}

main().then((code) => process.exit(code));