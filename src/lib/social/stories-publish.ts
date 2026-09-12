/** Publicación de stories IG+FB con link tappable (roadmap tráfico redes).
 *
 *  IG: link sticker real via instagrapi (la API oficial de Meta NO permite
 *  stickers). FB: stories por Buffer como siempre (FB tampoco soporta links
 *  en stories via API, ahí el tráfico viene de los links en captions del feed).
 *
 *  Estrategia anti-duplicado:
 *  - instagrapi no publicó nada (sesión muerta / no configurado) → TODO va
 *    por Buffer IG+FB sin sticker, como siempre.
 *  - instagrapi publicó parcial → solo las slides fallidas van por Buffer IG.
 *  - Las stories subidas por instagrapi se registran como channel_targets con
 *    postId=null para que los daily limits de IG las cuenten igual.
 */

import { listChannels, bufferPublishStories } from "./buffer-client";
import {
  publishStoriesViaInstagrapi,
  igStoriesConfigured,
} from "./instagram-private";
import type { ChannelTarget } from "./daily-limits";

export interface StorySlide {
  url: string;
  caption: string;
  /** Destino del sticker tappable en IG (nota, agenda, fixture, sección). */
  link: string;
}

export interface StoriesPublishResult {
  /** Para social_posts.channel_targets: targets de Buffer + pseudo-targets
   *  (postId null) de las stories publicadas por instagrapi. */
  channelTargets: ChannelTarget[];
  /** postIds de Buffer (métricas). Las instagrapi no tienen. */
  bufferUpdateIds: string[];
  /** true = FB ok + IG completo (vía instagrapi o fallback Buffer). */
  success: boolean;
  error: string | null;
  igVia: "instagrapi" | "buffer" | "ninguno";
  igPublished: number;
}

export async function publishStoriesIgFb(
  bufferKey: string,
  slides: StorySlide[],
): Promise<StoriesPublishResult> {
  const errores: string[] = [];
  const channelTargets: ChannelTarget[] = [];
  const bufferUpdateIds: string[] = [];

  // Descubrir canales IG/FB (BUFFER_CHANNEL_IDS está vacío en prod: los
  // builders descubren via listChannels).
  let igIds: string[] = [];
  let fbIds: string[] = [];
  try {
    const channels = await listChannels(bufferKey);
    igIds = channels.filter((c) => c.service === "instagram").map((c) => c.id);
    fbIds = channels.filter((c) => c.service === "facebook").map((c) => c.id);
  } catch (err) {
    errores.push(`listChannels: ${String(err)}`);
  }

  // --- IG: instagrapi con link sticker.
  let igVia: StoriesPublishResult["igVia"] = "ninguno";
  let igPublished = 0;
  let igPendientes: StorySlide[] = [];

  if (igStoriesConfigured() && igIds.length > 0) {
    const igResult = await publishStoriesViaInstagrapi(
      slides.map((s) => ({ url: s.url, link: s.link, caption: s.caption })),
    );
    igPublished = igResult.published;
    if (igResult.fallback) {
      // Nada llegó a IG → todo por Buffer.
      igPendientes = slides;
      if (igResult.errors.length > 0) errores.push(`ig: ${igResult.errors.join("; ")}`);
    } else if (igResult.ok) {
      igVia = "instagrapi";
    } else {
      // Parcial: lo subido queda en IG; solo los fallidos van por Buffer.
      igVia = "instagrapi";
      errores.push(`ig parcial (${igResult.published}/${igResult.total}): ${igResult.errors.join("; ")}`);
      igPendientes = (igResult.failedIndexes ?? [])
        .map((i) => slides[i])
        .filter((s): s is StorySlide => Boolean(s));
    }
    // Pseudo-targets para daily limits (1 por story subida).
    for (let i = 0; i < igResult.published && igIds.length > 0; i++) {
      channelTargets.push({ channelId: igIds[0], service: "instagram", postId: null, error: null });
    }
  } else {
    igPendientes = slides;
  }

  // --- IG pendientes por Buffer (fallback sin sticker).
  if (igPendientes.length > 0 && igIds.length > 0) {
    const igBuffer = await bufferPublishStories(
      bufferKey,
      igIds,
      igPendientes.map((s) => ({ url: s.url, caption: s.caption })),
    );
    for (const t of igBuffer.channelTargets ?? []) {
      channelTargets.push(t);
      if (t.postId) bufferUpdateIds.push(t.postId);
    }
    if (igBuffer.success && igVia !== "instagrapi") igVia = "buffer";
    else if (!igBuffer.success) errores.push(`ig buffer: ${igBuffer.error ?? "falló"}`);
  }

  // --- FB: Buffer siempre (stories de FB no soportan links igual).
  if (fbIds.length > 0) {
    const fb = await bufferPublishStories(
      bufferKey,
      fbIds,
      slides.map((s) => ({ url: s.url, caption: s.caption })),
    );
    for (const t of fb.channelTargets ?? []) {
      channelTargets.push(t);
      if (t.postId) bufferUpdateIds.push(t.postId);
    }
    if (!fb.success) errores.push(`fb: ${fb.error ?? "falló"}`);
  }

  return {
    channelTargets,
    bufferUpdateIds,
    success: errores.length === 0,
    error: errores.length > 0 ? errores.join(" | ") : null,
    igVia,
    igPublished,
  };
}