/**
 * Script standalone: genera 10 stories 9:16 (2 por sección) y las publica a Buffer.
 *
 * Reemplaza a /api/social-publish-stories. Corre como proceso Node aparte con
 * su propio cgroup (systemd oneshot service) para no estresar el proceso web
 * Next.js con el render Satori+Resvg+sharp (~2GB working set).
 *
 * Uso (VPS):
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/build-stories.ts
 *   NODE_OPTIONS="--import ./scripts/polyfill-ws.cjs" node_modules/.bin/tsx scripts/build-stories.ts --dry-run
 *
 * El polyfill-ws.cjs se carga via --import antes de tsx, seteando globalThis.WebSocket
 * para que supabase-js (que lo requiere en el constructor del RealtimeClient) no
 * rompa en Node 20 sin native WebSocket.
 *
 * IMPORTANTE: el `--import` inline NO funciona con tsx (su binario spawnea un child
 * process que no hereda flags inline). Pasarlo via NODE_OPTIONS env var sí llega.
 *
 * Env vars requeridas (cargadas por el wrapper bash del systemd service):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   BUFFER_API_KEY, BUFFER_CHANNEL_IDS
 *
 * Cron del VPS dispara 2x/día a las 15:00 y 21:30 AR via cron-stories.sh.
 * Log a stdout/stderr → /var/log/quenoticia/stories.log (via systemd StandardOutput).
 */

import { buildStories } from "@/lib/social/carousel-builder";
import { publishStoriesIgFb, type StoriesPublishResult } from "@/lib/social/stories-publish";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ChannelTarget } from "@/lib/social/daily-limits";
import { SITE_URL } from "@/lib/site";

const dryRun = process.argv.includes("--dry-run");

function log(obj: Record<string, unknown>): void {
  console.log(JSON.stringify({ ...obj, timestamp: new Date().toISOString() }));
}

async function saveSocialPost(input: {
  status: "published" | "failed" | "pending" | "skipped";
  kind: "stories";
  articleIds: (string | null)[];
  sections: string[];
  slideImageUrls: string[];
  channelTargets: ChannelTarget[];
  errorMessage: string | null;
}): Promise<void> {
  const admin = await getSupabaseAdmin();
  const bufferUpdateIds = input.channelTargets
    .map((t) => t.postId)
    .filter((id): id is string => id !== null);

  const { error } = await admin.from("social_posts").insert({
    status: input.status,
    kind: input.kind,
    article_ids: input.articleIds,
    sections: input.sections,
    slide_image_urls: input.slideImageUrls,
    caption: "Stories automáticas 9:16 (10 slides, 2 por sección)",
    channel_targets: input.channelTargets,
    buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
    error_message: input.errorMessage,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  });
  if (error) console.error("saveSocialPost stories error:", error);
}

/** Caption corto para stories: branding + hashtag rotado por slide. */
function buildStoryCaption(index: number): string {
  const hashtags = ["#Politica", "#Deportes", "#Tucuman", "#Economia", "#Internacionales"];
  const tag = hashtags[index % hashtags.length];
  return `¡QUE NOTICIA! ${tag}\n\nLas noticias más importantes de Tucumán y el mundo. Lee más en quenoticia.com.ar`;
}

async function main(): Promise<number> {
  console.log("=== build-stories start ===");
  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  // BUFFER_CHANNEL_IDS no se usa: los canales IG/FB se descubren via listChannels.

  try {
    const stories = await buildStories();

    if (stories.slideImageUrls.length === 0) {
      await saveSocialPost({
        status: "skipped",
        kind: "stories",
        articleIds: stories.articleIds,
        sections: stories.sections,
        slideImageUrls: [],
        channelTargets: [],
        errorMessage: "Sin notas nuevas ni fallback disponibles para stories",
      });
      log({ success: true, status: "skipped", reason: "no slides generated", dryRun });
      console.log("=== build-stories end ===");
      return 0;
    }

    const slideEntries = stories.slideImageUrls.map((url, i) => ({
      url,
      caption: buildStoryCaption(i),
      link: stories.slideLinks[i] ?? SITE_URL,
    }));

    let publishResult: StoriesPublishResult;
    if (dryRun || !bufferKey) {
      publishResult = {
        channelTargets: [] as ChannelTarget[],
        bufferUpdateIds: [],
        success: false,
        error: dryRun ? "dry_run mode" : "BUFFER_API_KEY missing",
        igVia: "ninguno",
        igPublished: 0,
      };
    } else {
      // IG via instagrapi con link sticker + FB via Buffer; fallback Buffer si
      // la sesión de IG está muerta.
      publishResult = await publishStoriesIgFb(bufferKey, slideEntries);
    }

    const status: "published" | "failed" | "pending" =
      dryRun || !bufferKey
        ? "pending"
        : publishResult.success
          ? "published"
          : "failed";

    await saveSocialPost({
      status,
      kind: "stories",
      articleIds: stories.articleIds,
      sections: stories.sections,
      slideImageUrls: stories.slideImageUrls,
      channelTargets: publishResult.channelTargets,
      errorMessage: publishResult.success ? null : publishResult.error,
    });

    log({
      success: publishResult.success || dryRun || !bufferKey,
      status,
      slides: stories.slideImageUrls.length,
      sections: stories.sections,
      igVia: publishResult.igVia,
      igPublished: publishResult.igPublished,
      dryRun,
      bufferError: publishResult.success ? null : publishResult.error,
    });
    console.log("=== build-stories end ===");
    return 0;
  } catch (error) {
    console.error("build-stories error:", error);
    log({ success: false, status: "failed", error: String(error), dryRun });
    console.log("=== build-stories end ===");
    return 1;
  }
}

main().then((code) => process.exit(code));