/** Orquestador de las stories de agenda: 4 placas 9:16 estilo EventModal
 *  (3 eventos por categoría + listado del día) publicadas a IG/FB.
 *
 *  Se publica 2x/día via cron (cron-agenda-social.sh):
 *  - Mediodía (12:30 ART): todos los eventos de hoy.
 *  - Tarde (17:15 ART, AGENDA_MIN_HOUR=17): solo eventos con hora >= 17:00,
 *    dedupeando las placas ya destacadas al mediodía.
 *
 *  Lógica de cobertura:
 *  - Placas por categoría (cultural → deportivo → turístico): si falta un tipo
 *    se cubre con un cultural de hoy; si no hay, con un evento de días siguientes.
 *  - Listado de 8: eventos de hoy por hora; si hay menos se completa con
 *    eventos de días siguientes (separador "MAÑANA — ...").
 *  - Si hoy no hay NINGÚN evento → no-op (skipped).
 *
 *  Corre como proceso Node aparte con cgroup propio (systemd oneshot) para no
 *  estresar el proceso web con el render takumi+satori.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bufferPublishStories } from "@/lib/social/buffer-client";
import { r2Upload } from "@/lib/r2";
import {
  generarPlacasPng,
  hoyArtIso,
  limpiarTitulo,
  normalizarTitulo,
  seleccionarContenido,
  type AgendaEventSrc,
} from "@/lib/social/agenda-placas";
import type { ChannelTarget } from "@/lib/social/daily-limits";

const EVENT_COLUMNS =
  "id, title, category, date_iso, end_date, time, venue_name, venue_city, " +
  "image_url, description, excerpt, price_range, price_min, price_max, is_free";

export interface AgendaResult {
  triggered: boolean;
  status: "published" | "failed" | "pending" | "skipped";
  countHoy: number;
  countTarde: number | null;
  slides: Array<{ slug: string; url: string; caption: string }>;
  error: string | null;
}

/** IDs de eventos ya destacados en placas publicadas HOY (para el dedupe de la tarde). */
async function idsDestacadosHoy(hoyIso: string): Promise<Set<string>> {
  const admin = await getSupabaseAdmin();
  const desde = `${hoyIso}T00:00:00-03:00`;
  const { data, error } = await admin
    .from("social_posts")
    .select("article_ids")
    .eq("kind", "evento")
    .in("status", ["published", "pending"])
    .gte("created_at", desde);
  if (error) {
    console.error("buildAgenda idsDestacadosHoy error:", error);
    return new Set();
  }
  const ids = new Set<string>();
  for (const row of (data as Array<{ article_ids: (string | null)[] }> | null) ?? []) {
    for (const id of row.article_ids ?? []) {
      if (id) ids.add(id);
    }
  }
  return ids;
}

function captionEvento(e: AgendaEventSrc, fechaDia: string, fechaNum: string): string {
  const titulo = limpiarTitulo(e.title);
  const hora = e.time ? ` · ${e.time.slice(0, 5)} hs` : "";
  const lugar = e.venue_name ? ` · ${e.venue_name}` : "";
  return `${titulo}\n${fechaDia} ${fechaNum}${hora}${lugar}\n\n🗓 Toda la agenda de Tucumán: quenoticia.com.ar/agenda`;
}

function captionListado(fechaHeader: string): string {
  const fecha = fechaHeader.replace(" · Tucumán", "");
  return `Agenda Tucumana · ${fecha}\n\nLo que hay para hacer hoy en Tucumán 🗓\nToda la agenda: quenoticia.com.ar/agenda`;
}

/** Orquesta: query eventos → selección → render → R2 → Buffer stories → social_posts.
 *  `minHour`: run de la tarde (ej. 17 = solo eventos con hora >= 17:00). */
export async function buildAgenda(
  bufferKey?: string,
  channelIds?: string[],
  opts?: { minHour?: number },
): Promise<AgendaResult> {
  const admin = await getSupabaseAdmin();
  const hoy = hoyArtIso();

  // Eventos que suceden HOY: date_iso = hoy, o multi-día activo (date_iso <= hoy <= end_date).
  const { data: hoyRows, error: errHoy } = await admin
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("active", true)
    .lte("date_iso", hoy)
    .or(`date_iso.eq.${hoy},end_date.gte.${hoy}`);
  if (errHoy) {
    console.error("buildAgenda query hoy error:", errHoy);
    return {
      triggered: false,
      status: "failed",
      countHoy: 0,
      countTarde: null,
      slides: [],
      error: errHoy.message,
    };
  }

  // Eventos futuros (para completar placas y listado): más cercanos primero.
  const { data: futurosRows, error: errFut } = await admin
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("active", true)
    .gt("date_iso", hoy)
    .order("date_iso", { ascending: true })
    .order("time", { ascending: true, nullsFirst: false })
    .limit(30);
  if (errFut) {
    console.error("buildAgenda query futuros error:", errFut);
    return {
      triggered: false,
      status: "failed",
      countHoy: hoyRows?.length ?? 0,
      countTarde: null,
      slides: [],
      error: errFut.message,
    };
  }

  const eventosHoy = (hoyRows ?? []) as unknown as AgendaEventSrc[];
  const eventosFuturos = (futurosRows ?? []) as unknown as AgendaEventSrc[];
  const minHour = opts?.minHour ?? null;

  // Run de la tarde: dedupe de placas contra lo publicado al mediodía.
  // Por id y por título normalizado (el mismo evento puede tener 2 rows en DB
  // desde fuentes distintas → el dedupe por id solo no alcanza).
  const excluirIds = minHour != null ? await idsDestacadosHoy(hoy) : new Set<string>();
  const excluirTitulos = new Set(
    eventosHoy
      .filter((e) => excluirIds.has(e.id))
      .map((e) => normalizarTitulo(e.title)),
  );

  const sel = seleccionarContenido(
    eventosHoy,
    eventosFuturos,
    minHour,
    excluirIds,
    excluirTitulos,
  );

  if (sel.listado.length === 0) {
    console.log(
      `buildAgenda: 0 eventos hoy (${hoy}) — no-op` +
        (minHour != null ? ` (run tarde >= ${minHour}:00)` : ""),
    );
    await admin.from("social_posts").insert({
      status: "skipped",
      kind: "evento",
      article_ids: [],
      sections: [],
      slide_image_urls: [],
      caption: null,
      channel_targets: [],
      buffer_update_ids: null,
      error_message:
        minHour != null
          ? `sin eventos hoy con hora >= ${minHour}:00`
          : "sin eventos hoy en la tabla events",
    });
    return {
      triggered: false,
      status: "skipped",
      countHoy: eventosHoy.length,
      countTarde: minHour != null ? sel.listado.length : null,
      slides: [],
      error: null,
    };
  }

  console.log(
    `buildAgenda: ${eventosHoy.length} eventos hoy, ${eventosFuturos.length} futuros — ` +
      `${sel.eventoPlacas.length} placas + listado (${sel.listado.length} filas)` +
      (minHour != null ? ` [tarde >= ${minHour}:00, excluidas ${excluirIds.size}]` : " [mediodía]"),
  );

  // Render takumi → PNG buffers.
  const placas = await generarPlacasPng(sel);

  // Upload a R2 y captions por placa.
  const ts = Date.now();
  const slides: Array<{ slug: string; url: string; caption: string }> = [];
  for (const placa of placas) {
    const path = `social/agenda-${ts}-${placa.slug}.png`;
    const url = await r2Upload("media", path, placa.png, "image/png");
    if (!url) {
      throw new Error(`upload R2 falló: ${path}`);
    }
    if (placa.slug === "listado") {
      slides.push({ slug: placa.slug, url, caption: captionListado(sel.fechaHeader) });
    } else {
      const idx = Number(placa.slug.split("-")[1]) - 1;
      const ev = sel.eventoPlacas[idx];
      slides.push({
        slug: placa.slug,
        url,
        caption: ev ? captionEvento(ev, sel.fechaDia, sel.fechaNum) : captionListado(sel.fechaHeader),
      });
    }
  }

  // Publicar a Buffer (stories IG+FB). Sin key → queda pending en DB.
  let channelTargets: ChannelTarget[] = [];
  let status: "published" | "failed" | "pending" = "pending";
  let errorMsg: string | null = null;

  if (bufferKey && bufferKey.length > 0) {
    const result = await bufferPublishStories(
      bufferKey,
      channelIds ?? [],
      slides.map((s) => ({ url: s.url, caption: s.caption })),
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

  const { error: errSave } = await admin.from("social_posts").insert({
    status,
    kind: "evento",
    article_ids: sel.eventoPlacas.map((e) => e.id),
    sections: [...new Set(sel.eventoPlacas.map((e) => e.category))],
    slide_image_urls: slides.map((s) => s.url),
    caption: `Agenda ${hoy}${minHour != null ? ` tarde>=${minHour}h` : ""}: ${slides.map((s) => s.slug).join(", ")}`,
    channel_targets: channelTargets,
    buffer_update_ids: bufferUpdateIds.length > 0 ? bufferUpdateIds : null,
    error_message: errorMsg,
    published_at: status === "published" ? new Date().toISOString() : null,
  });
  if (errSave) console.error("buildAgenda save error:", errSave);

  console.log(
    `buildAgenda: ${slides.length} placas ${status} → R2 social/agenda-${ts}-*`,
  );

  return {
    triggered: true,
    status,
    countHoy: eventosHoy.length,
    countTarde: minHour != null ? sel.listado.length : null,
    slides,
    error: errorMsg,
  };
}