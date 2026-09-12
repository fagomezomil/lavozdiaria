/** Orquestador de los puzzles separadores del feed IG.
 *  Se publica cada 9 carruseles via cron (cron-separador.sh).
 *
 *  Lógica:
 *  1. Cuenta kind='carrusel' status='published' desde el último kind='separador'.
 *  2. Si count < 9 → no-op (log "esperando {count}/9").
 *  3. Si count >= 9 → publica un PUZZLE según alternancia (count de separadores / 3):
 *     - Set branding: logo ink / chips secciones / cta naranja.
 *     - Set venta: aviso clasificado / bento formatos / naranja directo.
 *
 *  Cada puzzle son 3 posts SEPARADOS en orden INVERSO (derecha → centro →
 *  izquierda) con offset entre cada uno, para que la grid de IG arme el
 *  panorama de izquierda a derecha. Solo IG — en FB el puzzle no tiene sentido.
 *
 *  Las placas son PNGs fijas en R2 (assets permanentes diseñados por Fede);
 *  no se renderizan al vuelo. Captions editables acá abajo. */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bufferPublish, listChannels } from "@/lib/social/buffer-client";
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
  variant: "branding" | "venta";
  placas: SeparadorPlaca[];
}

interface PuzzleDef {
  variant: "branding" | "venta";
  layout: string;
  imageUrl: string;
  caption: string;
}

/** Set BRANDING (panorama: izq logo / centro secciones / der venta cta).
 *  Publicación en orden INVERSO: primera la pieza DERECHA, última la IZQUIERDA. */
const PUZZLE_BRANDING: PuzzleDef[] = [
  {
    variant: "branding",
    layout: "branding-3-derecha",
    imageUrl: `${R2_PUBLIC_BASE}/social/placas-branding-3.png`,
    caption:
      "📢 Publicá tu marca en ¡QUE NOTICIA!\nBanners, rectángulos, sticky móvil y contenidos patrocinados: tu negocio frente a miles de tucumanos todos los días.\n📲 WhatsApp 381 562 7057 · quenoticia.com.ar/contrata-aqui",
  },
  {
    variant: "branding",
    layout: "branding-2-centro",
    imageUrl: `${R2_PUBLIC_BASE}/social/placas-branding-2.png`,
    caption:
      "Las 10 secciones de ¡QUE NOTICIA!: política, deportes, economía, internacionales, tucumán, actualidad, opinión, agenda, espectáculos y horóscopo. 📰 quenoticia.com.ar",
  },
  {
    variant: "branding",
    layout: "branding-1-izquierda",
    imageUrl: `${R2_PUBLIC_BASE}/social/placas-branding-1.png`,
    caption:
      "¡QUE NOTICIA! — El universo de las noticias en un click. Tu medio de Tucumán. 📰 quenoticia.com.ar",
  },
];

/** Set VENTA (panorama: izq aviso clasificado / centro bento formatos / der naranja). */
const PUZZLE_VENTA: PuzzleDef[] = [
  {
    variant: "venta",
    layout: "venta-3-derecha",
    imageUrl: `${R2_PUBLIC_BASE}/social/placas-venta-3.png`,
    caption:
      "📢 Publicá tu marca en ¡QUE NOTICIA!\nBanners, rectángulos, sticky móvil y contenidos patrocinados: tu negocio frente a miles de tucumanos todos los días.\n📲 WhatsApp 381 562 7057 · quenoticia.com.ar/contrata-aqui",
  },
  {
    variant: "venta",
    layout: "venta-2-centro",
    imageUrl: `${R2_PUBLIC_BASE}/social/placas-venta-2.png`,
    caption:
      "Banner superior, rectángulo lateral, sticky móvil y contenidos patrocinados. Espacios publicitarios de ¡QUE NOTICIA! 📰 quenoticia.com.ar/contrata-aqui",
  },
  {
    variant: "venta",
    layout: "venta-1-izquierda",
    imageUrl: `${R2_PUBLIC_BASE}/social/placas-venta-1.png`,
    caption:
      "Espacios publicitarios para tu negocio en ¡QUE NOTICIA! 📰 Escribinos al WhatsApp 381 562 7057 · quenoticia.com.ar/contrata-aqui",
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

/** Total de separadores publicados/pendientes. Divide por 3 (piezas por puzzle)
 *  para saber cuántos puzzles salieron y alternar el próximo. */
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

/** Publica una pieza del puzzle a los canales indicados y la guarda en DB. */
async function publishPlaca(
  def: PuzzleDef,
  scheduled: Date,
  bufferKey: string | undefined,
  targetChannelIds: string[],
): Promise<SeparadorPlaca> {
  const placaBase: SeparadorPlaca = {
    layout: def.layout,
    imageUrl: def.imageUrl,
    caption: def.caption,
    scheduled,
    channelTargets: [],
    bufferUpdateIds: [],
    status: "pending",
    error: null,
  };

  try {
    let channelTargets: ChannelTarget[] = [];
    let status: "published" | "failed" | "pending" = "pending";
    let errorMsg: string | null = null;

    if (bufferKey && targetChannelIds.length > 0) {
      const result = await bufferPublish(
        bufferKey,
        targetChannelIds,
        def.caption,
        [def.imageUrl],
        scheduled,
      );
      channelTargets = result.channelTargets ?? [];
      status = result.success ? "published" : "failed";
      errorMsg = result.success ? null : result.error ?? "buffer publish failed";
    } else if (!bufferKey) {
      errorMsg = "BUFFER_API_KEY missing — guardado como pending";
    } else {
      errorMsg = "sin canal IG — guardado como pending";
    }

    const bufferUpdateIds = channelTargets
      .map((t) => t.postId)
      .filter((id): id is string => id !== null);

    const placa: SeparadorPlaca = {
      ...placaBase,
      channelTargets,
      bufferUpdateIds,
      status,
      error: errorMsg,
    };

    await saveSeparadorPost(placa);
    console.log(`buildSeparador: placa ${def.layout} ${status} → ${def.imageUrl}`);
    return placa;
  } catch (err) {
    console.error(`buildSeparador: placa ${def.layout} falló:`, err);
    const placa: SeparadorPlaca = {
      ...placaBase,
      status: "failed",
      error: String(err),
    };
    await saveSeparadorPost(placa);
    return placa;
  }
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

/** Orquesta: chequea count, si >= threshold publica un puzzle (branding o venta).
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
      variant: "branding",
      placas: [],
    };
  }

  const sepCount = await countSeparadores();
  const useVenta = Math.floor(sepCount / 3) % 2 === 1;
  const variant: "branding" | "venta" = useVenta ? "venta" : "branding";

  console.log(
    `buildSeparador: ${count}/${SEPARADOR_THRESHOLD} carruseles — set ${variant} (${sepCount} separadores previos)`,
  );

  // Solo IG — el puzzle solo arma panorama en la grid de Instagram.
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

  const now = new Date();
  const defs = useVenta ? PUZZLE_VENTA : PUZZLE_BRANDING;
  const placas: SeparadorPlaca[] = [];

  for (let i = 0; i < defs.length; i++) {
    const scheduled = new Date(now.getTime() + OFFSET_MINUTES * 60 * 1000 * (i + 1));
    placas.push(await publishPlaca(defs[i], scheduled, bufferKey, igChannelIds));
  }

  return { triggered: true, count, threshold: SEPARADOR_THRESHOLD, variant, placas };
}