/** Orquestador de las 3 placas separadoras del feed IG/FB.
 *  Se publica cada 9 carruseles via cron (cron-separador.sh).
 *
 *  Lógica:
 *  1. Cuenta kind='carrusel' status='published' desde el último kind='separador'.
 *  2. Si count < 9 → no-op (log "esperando {count}/9").
 *  3. Si count >= 9 → genera 3 PNGs (branding, secciones, cta), sube a R2,
 *     publica 3 posts Buffer con 30min offset entre cada uno, guarda 3 social_posts.
 *
 *  Las 3 placas son publicaciones SEPARADAS (no un carrusel swipe) para que
 *  ocupen 3 posiciones del feed IG y rompan la monotonía del mosaico. */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { r2Upload } from "@/lib/r2";
import { bufferPublish } from "@/lib/social/buffer-client";
import { generateSeparadorPng } from "@/lib/social/generate-slide";
import type { SeparadorLayout } from "@/lib/social/separador-template";
import type { ChannelTarget } from "@/lib/social/daily-limits";

const SEPARADOR_THRESHOLD = 9;
const OFFSET_MINUTES = 5;

export interface SeparadorPlaca {
  layout: SeparadorLayout;
  imageUrl: string;
  caption: string;
  scheduled: Date;
  channelTargets: ChannelTarget[];
  bufferUpdateIds: string[];
  status: "published" | "failed" | "pending";
  error: string | null;
}

export interface SeparadorResult {
  triggered: boolean;
  count: number;
  threshold: number;
  placas: SeparadorPlaca[];
}

const PLACA_DEFS: Array<{ layout: SeparadorLayout; caption: string }> = [
  {
    layout: "branding",
    caption:
      "El universo de las noticias en un click. ¡QUE NOTICIA! — tu medio de Tucumán. 📰",
  },
  {
    layout: "secciones",
    caption:
      "Las 6 secciones que nos importan: política, deportes, economía, internacionales, tucumán y opinión. Encontrá la tuya en quenoticia.com.ar.",
  },
  {
    layout: "cta",
    caption:
      "No te pierdas las noticias de Tucumán. Entrá a quenoticia.com.ar y seguinos para no perderte nada.",
  },
];

/** Devuelve cuántos carruseles se publicaron desde el último separador.
 *  Si no hay separador previo, cuenta desde epoch (arranca desde 0). */
async function countCarruselesSinceLastSeparador(): Promise<number> {
  const admin = await getSupabaseAdmin();

  const { data: lastSep } = await admin
    .from("social_posts")
    .select("created_at")
    .eq("kind", "separador")
    .in("status", ["published", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const since = lastSep?.created_at ?? "1970-01-01T00:00:00Z";

  const { count, error } = await admin
    .from("social_posts")
    .select("*", { count: "exact", head: true })
    .eq("kind", "carrusel")
    .in("status", ["published", "pending"])
    .gt("created_at", since);

  if (error) {
    console.error("countCarruselesSinceLastSeparador error:", error);
    return 0;
  }

  return count ?? 0;
}

/** Sube un PNG de separador a R2 y devuelve la URL pública. */
async function uploadSeparadorPng(
  png: Buffer,
  layout: SeparadorLayout,
  timestamp: number,
): Promise<string> {
  const path = `social/separador-${timestamp}-${layout}.png`;
  const uploaded = await r2Upload("media", path, png, "image/png");
  if (!uploaded) throw new Error(`upload separador ${path} failed`);
  return uploaded;
}

async function saveSeparadorPost(placa: SeparadorPlaca): Promise<void> {
  const admin = await getSupabaseAdmin();
  const { error } = await admin.from("social_posts").insert({
    status: placa.status,
    kind: "separador",
    article_ids: [],
    sections: [],
    slide_image_urls: [placa.imageUrl],
    caption: placa.caption,
    channel_targets: placa.channelTargets,
    buffer_update_ids: placa.bufferUpdateIds.length > 0 ? placa.bufferUpdateIds : null,
    error_message: placa.error,
    published_at: placa.status === "published" ? new Date().toISOString() : null,
  });
  if (error) console.error("saveSeparadorPost error:", error);
}

/** Orquesta: chequea count, si >= threshold genera + sube + publica 3 placas.
 *  Si count < threshold → no-op.
 *  `bufferKey` y `channelIds` opcionales (si vacío, no publica a Buffer, solo guarda pending). */
export async function buildSeparador(
  bufferKey?: string,
  channelIds?: string[],
): Promise<SeparadorResult> {
  const count = await countCarruselesSinceLastSeparador();

  if (count < SEPARADOR_THRESHOLD) {
    console.log(
      `buildSeparador: esperando ${count}/${SEPARADOR_THRESHOLD} carruseles — no-op`,
    );
    return { triggered: false, count, threshold: SEPARADOR_THRESHOLD, placas: [] };
  }

  console.log(
    `buildSeparador: ${count}/${SEPARADOR_THRESHOLD} carruseles — generando 3 placas`,
  );

  const timestamp = Date.now();
  const now = new Date();

  const placas: SeparadorPlaca[] = [];

  for (let i = 0; i < PLACA_DEFS.length; i++) {
    const def = PLACA_DEFS[i];
    const scheduled = new Date(now.getTime() + OFFSET_MINUTES * 60 * 1000 * (i + 1));

    try {
      const png = await generateSeparadorPng(def.layout);
      const imageUrl = await uploadSeparadorPng(png, def.layout, timestamp);

      let channelTargets: ChannelTarget[] = [];
      let status: "published" | "failed" | "pending" = "pending";
      let errorMsg: string | null = null;

      if (bufferKey) {
        const result = await bufferPublish(
          bufferKey,
          channelIds ?? [],
          def.caption,
          [imageUrl],
          scheduled,
        );
        channelTargets = result.channelTargets ?? [];
        status = result.success ? "published" : "failed";
        errorMsg = result.success ? null : result.error ?? "buffer publish failed";
      } else {
        errorMsg = "BUFFER_API_KEY missing — guardado como pending";
      }

      const bufferUpdateIds = channelTargets
        .map((t) => t.postId)
        .filter((id): id is string => id !== null);

      const placa: SeparadorPlaca = {
        layout: def.layout,
        imageUrl,
        caption: def.caption,
        scheduled,
        channelTargets,
        bufferUpdateIds,
        status,
        error: errorMsg,
      };

      await saveSeparadorPost(placa);
      placas.push(placa);

      console.log(
        `buildSeparador: placa ${def.layout} ${status} → ${imageUrl}`,
      );
    } catch (err) {
      console.error(`buildSeparador: placa ${def.layout} falló:`, err);
      const placa: SeparadorPlaca = {
        layout: def.layout,
        imageUrl: "",
        caption: def.caption,
        scheduled,
        channelTargets: [],
        bufferUpdateIds: [],
        status: "failed",
        error: String(err),
      };
      await saveSeparadorPost(placa);
      placas.push(placa);
    }
  }

  return { triggered: true, count, threshold: SEPARADOR_THRESHOLD, placas };
}