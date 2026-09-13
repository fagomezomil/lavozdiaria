import { NextResponse } from "next/server";
import { buildCarousel } from "@/lib/social/carousel-builder";
import { bufferPublish } from "@/lib/social/buffer-client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/cron-auth";
import type { ChannelTarget } from "@/lib/social/daily-limits";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Endpoint cron: genera un carrusel de 5 noticias y lo publica via Buffer al FEED.
 *
 *  Header:
 *    - X-Cron-Secret: CRON_SECRET (obligatorio)
 *
 *  Query params:
 *    - dry_run: "true" → genera y guarda en social_posts sin publicar a Buffer
 *
 *  Cron del VPS dispara 2x/día a las 09:00 y 20:30 AR (vía scripts/cron-social.sh).
 *  Para stories IG/FB ver /api/social-publish-stories (cron 15:00 y 21:00).
 *  Respeta DAILY_LIMITS_FEED por servicio (saltea canales que ya publicaron su cupo diario). */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "true";
  const bufferKey = process.env.BUFFER_API_KEY ?? "";
  const channelIds = (process.env.BUFFER_CHANNEL_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const carousel = await buildCarousel();

    if (carousel.slideImageUrls.length === 0) {
      await saveSocialPost({
        status: "skipped",
        kind: "carrusel",
        articleIds: carousel.articleIds,
        sections: carousel.sections,
        slideImageUrls: [],
        caption: carousel.caption,
        channelTargets: [],
        errorMessage: "Sin notas nuevas ni fallback disponibles",
      });
      return NextResponse.json({
        success: true,
        status: "skipped",
        reason: "no slides generated",
        timestamp: new Date().toISOString(),
      });
    }

    let bufferResult;
    if (dryRun || !bufferKey) {
      bufferResult = {
        success: false,
        channelTargets: [] as ChannelTarget[],
        skippedByLimit: [],
        error: dryRun ? "dry_run mode" : "BUFFER_API_KEY missing",
      };
    } else {
      bufferResult = await bufferPublish(
        bufferKey,
        channelIds,
        carousel.caption,
        carousel.slideImageUrls,
        undefined,
        "image",
        carousel.captions,
      );
    }

    const status: "published" | "failed" | "pending" =
      dryRun || !bufferKey
        ? "pending"
        : bufferResult.success
          ? "published"
          : "failed";

    await saveSocialPost({
      status,
      kind: "carrusel",
      articleIds: carousel.articleIds,
      sections: carousel.sections,
      slideImageUrls: carousel.slideImageUrls,
      caption: carousel.caption,
      channelTargets: bufferResult.channelTargets ?? [],
      errorMessage: bufferResult.success ? null : bufferResult.error ?? null,
    });

    return NextResponse.json({
      success: bufferResult.success || dryRun || !bufferKey,
      status,
      slides: carousel.slideImageUrls.length,
      sections: carousel.sections,
      dryRun,
      skippedByLimit: bufferResult.skippedByLimit ?? [],
      bufferError: bufferResult.success ? null : bufferResult.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("social-publish error:", error);
    return NextResponse.json(
      { error: "publish failed", details: String(error) },
      { status: 500 },
    );
  }
}

interface SaveSocialPostInput {
  status: "published" | "failed" | "pending" | "skipped";
  kind: "carrusel";
  articleIds: (string | null)[];
  sections: string[];
  slideImageUrls: string[];
  caption: string;
  channelTargets: ChannelTarget[];
  errorMessage: string | null;
}

async function saveSocialPost(input: SaveSocialPostInput): Promise<void> {
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
    caption: input.caption,
    channel_targets: input.channelTargets,
    buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
    error_message: input.errorMessage,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  });
  if (error) console.error("saveSocialPost error:", error);
}