/** Orquestador de las 3 placas separadoras del feed IG/FB.
 *  Se publica cada 9 carruseles via cron (cron-separador.sh).
 *
 *  Lógica:
 *  1. Cuenta kind='carrusel' status='published' desde el último kind='separador'.
 *  2. Si count < 9 → no-op (log "esperando {count}/9").
 *  3. Si count >= 9 → publica un SET según alternancia (count de separadores mod 2):
 *     - Set A (par): genera 3 PNGs (branding, secciones, cta), sube a R2 y publica
 *       3 posts a IG+FB con offset entre cada uno.
 *     - Set B (impar): PUZZLE de venta de espacios — 3 PNGs fijas en R2 publicadas
 *       como 3 posts SEPARADOS en orden INVERSO (derecha → centro → izquierda)
 *       para que armen el panorama en la grid de IG. Solo IG (en FB el puzzle
 *       no tiene sentido). Sin offsets se pierde el orden relativo del feed.
 *
 *  Las 3 placas son publicaciones SEPARADAS (no un carrusel swipe) para que
 *  ocupen 3 posiciones del feed IG y rompan la monotonía del mosaico. */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { r2Upload } from "@/lib/r2";
import { bufferPublish, listChannels } from "@/lib/social/buffer-client";
import { generateSeparadorPng } from "@/lib/social/generate-slide";
import type { ChannelTarget } from "@/lib/social/daily-limits";

const SEPARADOR_THRESHOLD = 9;
const OFFSET_MINUTES = 5;

const R2_PUBLIC_BASE = "https://pub-7d90620b77a845bcbb1bf3fee8f467a2.r2.dev/media";

export interface SeparadorPlaca {
  layout: string;
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
  variant: "placas" | "puzzle";
  placas: SeparadorPlaca[];
}

const PLACA_DEFS: Array<{ layout: string; caption: string }> = [
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

/** Puzzle de venta de espacios (Set B). Publicación en orden INVERSO:
 *  primera la pieza DERECHA (venta), luego la CENTRO (actualidad) y última la
 *  IZQUIERDA (branding) — así la grid de IG arma el panorama de izquierda a
 *  derecha. URLs fijas en R2 (assets permanentes, no se re-generan). */
const PUZZLE_DEFS: Array<{ layout: string; imageUrl: string; caption: string }> = [
  {
    layout: "puzzle-3-derecha",
    imageUrl: `${R2_PUBLIC_BASE}/social/placas-venta-3.png`,
    caption:
      "📢 Publicá tu marca en ¡QUE NOTICIA!\nBanners, rectángulos, sticky móvil y contenidos patrocinados: tu negocio frente a miles de tucumanos todos los días.\n📲 WhatsApp 381 562 7057 · quenoticia.com.ar/contrata-aqui",
  },
  {
    layout: "puzzle-2-centro",
    imageUrl: `${R2_PUBLIC_BASE}/social/placas-venta-2.png`,
    caption:
      "Toda la actualidad de Tucumán, todos los días. 📰 quenoticia.com.ar",
  },
  {
    layout: "puzzle-1-izquierda",
    imageUrl: `${R2_PUBLIC_BASE}/social/placas-venta-1.png`,
    caption: "¡QUE NOTICIA! — Tu medio de Tucumán. 📰 quenoticia.com.ar",
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

/** Total de separadores publicados/pendientes. Su paridad define el set:
 *  impar → puzzle (Set B), par → placas renderizadas (Set A). */
async function countSeparadores(): Promise<number> {
  const admin = await getSupabaseAdmin();
  const { count, error } = await admin
    .from("social_posts")
    .select("*", { count: "exact", head: true })
    .eq("kind", "separador")
    .in("status", ["published", "pending"]);
  if (error) {
    console.error("countSeparadores error:", error);
    return 0;
  }
  return count ?? 0;
}

/** Sube un PNG de separador a R2 y devuelve la URL pública. */
async function uploadSeparadorPng(
  png: Buffer,
  layout: string,
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

/** Publica una placa (set A o B) a los canales indicados y la guarda en DB.
 *  Si def.imageUrl está definido usa esa URL fija (puzzle); si no, llama a
 *  renderPng() para generar + subir la placa. El render queda dentro del try:
 *  un fallo de render guarda la placa como failed y no aborta el resto. */
async function publishPlaca(
  def: { layout: string; caption: string; imageUrl?: string },
  renderPng: (() => Promise<Buffer>) | null,
  scheduled: Date,
  timestamp: number,
  bufferKey: string | undefined,
  targetChannelIds: string[],
): Promise<SeparadorPlaca> {
  try {
    const imageUrl = def.imageUrl
      ? def.imageUrl
      : await uploadSeparadorPng(await (renderPng as () => Promise<Buffer>)(), def.layout, timestamp);

    let channelTargets: ChannelTarget[] = [];
    let status: "published" | "failed" | "pending" = "pending";
    let errorMsg: string | null = null;

    if (bufferKey && targetChannelIds.length > 0) {
      const result = await bufferPublish(
        bufferKey,
        targetChannelIds,
        def.caption,
        [imageUrl],
        scheduled,
      );
      channelTargets = result.channelTargets ?? [];
      status = result.success ? "published" : "failed";
      errorMsg = result.success ? null : result.error ?? "buffer publish failed";
    } else if (!bufferKey) {
      errorMsg = "BUFFER_API_KEY missing — guardado como pending";
    } else {
      errorMsg = "sin canales destino — guardado como pending";
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
    console.log(`buildSeparador: placa ${def.layout} ${status} → ${imageUrl}`);
    return placa;
  } catch (err) {
    console.error(`buildSeparador: placa ${def.layout} falló:`, err);
    const placa: SeparadorPlaca = {
      layout: def.layout,
      imageUrl: def.imageUrl ?? "",
      caption: def.caption,
      scheduled,
      channelTargets: [],
      bufferUpdateIds: [],
      status: "failed",
      error: String(err),
    };
    await saveSeparadorPost(placa);
    return placa;
  }
}

/** Orquesta: chequea count, si >= threshold publica un set (puzzle o placas).
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
    return {
      triggered: false,
      count,
      threshold: SEPARADOR_THRESHOLD,
      variant: "placas",
      placas: [],
    };
  }

  const sepCount = await countSeparadores();
  const usePuzzle = sepCount % 2 === 1;
  const variant: "placas" | "puzzle" = usePuzzle ? "puzzle" : "placas";

  console.log(
    `buildSeparador: ${count}/${SEPARADOR_THRESHOLD} carruseles — set ${variant} (${sepCount} separadores previos)`,
  );

  const timestamp = Date.now();
  const now = new Date();
  const placas: SeparadorPlaca[] = [];

  if (usePuzzle) {
    // Set B: solo IG — el puzzle solo arma panorama en la grid de Instagram.
    let igChannelIds: string[] = [];
    if (bufferKey) {
      const channels = await listChannels(bufferKey);
      igChannelIds = channels
        .filter((c) => c.service === "instagram")
        .map((c) => c.id);
      if (igChannelIds.length === 0) {
        console.error("buildSeparador: no se encontró canal IG en Buffer");
      }
    }

    for (let i = 0; i < PUZZLE_DEFS.length; i++) {
      const def = PUZZLE_DEFS[i];
      const scheduled = new Date(now.getTime() + OFFSET_MINUTES * 60 * 1000 * (i + 1));
      const placa = await publishPlaca(
        def,
        null,
        scheduled,
        timestamp,
        bufferKey,
        igChannelIds,
      );
      placas.push(placa);
    }
  } else {
    // Set A: placas renderizadas a IG+FB.
    for (let i = 0; i < PLACA_DEFS.length; i++) {
      const def = PLACA_DEFS[i];
      const scheduled = new Date(now.getTime() + OFFSET_MINUTES * 60 * 1000 * (i + 1));
      const placa = await publishPlaca(
        { layout: def.layout, caption: def.caption },
        () => generateSeparadorPng(def.layout as "branding" | "secciones" | "cta"),
        scheduled,
        timestamp,
        bufferKey,
        channelIds ?? [],
      );
      placas.push(placa);
    }
  }

  return { triggered: true, count, threshold: SEPARADOR_THRESHOLD, variant, placas };
}