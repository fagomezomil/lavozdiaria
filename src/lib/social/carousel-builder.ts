import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { selectNotesForCarousel, selectNotesForStories, CAROUSEL_SECTIONS, type SelectedNote } from "./select-notes";
import { generateSlidePng, generateStoryPng } from "./generate-slide";
import { buildCaption } from "./caption-builder";
import type { Section } from "@/lib/types";
import { r2Upload } from "@/lib/r2";
import { generateHoroscopoPromoPng } from "./generate-slide";
import { planSlidesV3, shuffleWithSeed, type SlideComposition } from "./extract-slide-content";
import type { SlideDataV2, SlideLayout } from "./slide-template-v2";

// Concurrency de generación de PNGs — satori/resvg son CPU-intensivos. VPS 4 vCPU,
// 10 PNGs en paralelo saturan. Limitamos a 3 para no matar la app.
const PNG_GEN_CONCURRENCY = 3;

export interface CarouselResult {
  notes: (SelectedNote | null)[];
  slideImageUrls: string[];
  caption: string;
  articleIds: (string | null)[];
  sections: Section[];
}

export interface StoriesResult {
  notes: (SelectedNote | null)[];
  slideImageUrls: string[];
  articleIds: (string | null)[];
  sections: Section[];
}

type Turno = "mañana" | "noche";

function turnoFromDate(d: Date): Turno {
  // Convertir a ART (UTC-3). Corte: 18:00 ART.
  // Turno mañana = 06:00–17:59 ART, turno noche = 18:00–05:59 ART.
  const artHour = (d.getUTCHours() - 3 + 24) % 24;
  return artHour >= 6 && artHour < 18 ? "mañana" : "noche";
}

/** Calcula el `since` para el turno actual:
 *  - mañana → 08:00 ART de hoy (= 11:00 UTC)
 *  - noche  → 20:00 ART de hoy (= 23:00 UTC)
 *  Coincide con el horario del scraper correspondiente. */
function getSinceForTurno(now: Date, turno: Turno): Date {
  const artOffsetMs = -3 * 60 * 60 * 1000;
  const artNow = new Date(now.getTime() + artOffsetMs);
  const y = artNow.getUTCFullYear();
  const m = artNow.getUTCMonth();
  const d = artNow.getUTCDate();
  const hourArt = turno === "mañana" ? 8 : 20;
  const sinceArt = new Date(Date.UTC(y, m, d, hourArt, 0, 0));
  // Convertir de ART a UTC: restar el offset (artOffsetMs es negativo → resta suma)
  return new Date(sinceArt.getTime() - artOffsetMs);
}

/** Devuelve los article_ids ya publicados en el TURNO OPUESTO dentro de las últimas 24h.
 *  Las publicaciones del mismo turno NO se excluyen (así stories puede reusar las del
 *  carrusel del mismo turno). Las del turno opuesto sí (no se repite entre mañana y noche). */
async function getRecentlyPublishedArticleIds(currentTurno: Turno): Promise<Set<string>> {
  const admin = await getSupabaseAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("social_posts")
    .select("article_ids, published_at, created_at")
    .in("status", ["published", "pending"])
    .gte("created_at", since);
  if (error) {
    console.error("getRecentlyPublishedArticleIds error:", error);
    return new Set();
  }

  const excludeIds = new Set<string>();
  for (const post of (data as Array<{ article_ids: (string | null)[]; published_at: string | null; created_at: string }> | null) ?? []) {
    const ts = post.published_at ? new Date(post.published_at) : new Date(post.created_at);
    const postTurno = turnoFromDate(ts);
    if (postTurno !== currentTurno) {
      for (const id of post.article_ids ?? []) {
        if (id) excludeIds.add(id);
      }
    }
  }
  return excludeIds;
}

/** Formatea created_at (ISO) → DD/MM/YYYY para mostrar en el slide. */
function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return "";
  }
}

/** Sube un PNG a R2 con path `social/{timestamp}-{section}.png`
 *  y devuelve la URL pública. */
async function uploadSlidePng(png: Buffer, section: string, timestamp: number): Promise<string> {
  const path = `social/${timestamp}-${section}.png`;
  const uploaded = await r2Upload("media", path, png, "image/png");
  if (!uploaded) throw new Error(`upload slide ${path} failed`);
  return uploaded;
}

/** Sube el PNG del story 9:16 a R2 con path `social/stories-{timestamp}-{section}-{n}.png`
 *  y devuelve la URL pública. Se publica directo como imagen de story IG/FB (sin MP4). */

/** Placa promo horóscopo (estática): se genera y sube a R2 con path fijo
 *  (overwrite) → R2 queda siempre con una sola copia vigente.
 *  Si falla, devuelve null y el run sale sin la placa (no rompe la publicación). */
async function getHoroscopoPromoUrl(kind: "carrusel" | "story"): Promise<string | null> {
  try {
    const png = await generateHoroscopoPromoPng(kind);
    const path =
      kind === "story" ? "social/horoscopo-promo-story.png" : "social/horoscopo-promo.png";
    return await r2Upload("media", path, png, "image/png");
  } catch (err) {
    console.error(`getHoroscopoPromoUrl(${kind}) falló:`, err);
    return null;
  }
}
async function uploadStoryPosterPng(
  png: Buffer,
  section: string,
  n: number,
  timestamp: number,
): Promise<string> {
  const path = `social/stories-${timestamp}-${section}-${n}.png`;
  const uploaded = await r2Upload("media", path, png, "image/png");
  if (!uploaded) throw new Error(`upload story poster ${path} failed`);
  return uploaded;
}

/** Run async tasks with bounded concurrency (para no saturar CPU con 10 ffmpeg en paralelo). */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Lee el último social_post del kind dado y devuelve el orden de secciones
 *  rotado para que la primera sea distinta al último run. Ciclo cada N runs.
 *  Garantiza que el feed no arranque siempre con la misma sección/color.
 *
 *  `step` controla cuántas posiciones rotar. Carrusel rota 1, stories rota 2,
 *  así el primer slide de cada uno arranca con sección/color distinto entre sí. */
async function getRotatedSections(kind: "carrusel" | "stories", step = 1): Promise<Section[]> {
  const admin = await getSupabaseAdmin();
  const { data } = await admin
    .from("social_posts")
    .select("sections")
    .eq("kind", kind)
    .in("status", ["published", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastFirst = data?.sections?.[0] ?? CAROUSEL_SECTIONS[0];
  const lastIndex = CAROUSEL_SECTIONS.indexOf(lastFirst);
  const offset = (lastIndex + step) % CAROUSEL_SECTIONS.length;
  return [...CAROUSEL_SECTIONS.slice(offset), ...CAROUSEL_SECTIONS.slice(0, offset)];
}

/** Devuelve un orden permutado de [cita, dato, titular] distinto por run.
 *  Seed = timestamp del run. Carrusel y stories usan seeds distintos (offset +1)
 *  para que el primer layout mix de cada uno tienda a ser distinto. */
function getMixLayouts(seed: number): SlideLayout[] {
  return shuffleWithSeed(["cita", "dato", "titular"] as SlideLayout[], seed);
}

/** Orquesta: select → generate slides → upload → caption.
 *  Calcula el turno actual (mañana/noche), el `since` según scraper correspondiente
 *  (08:00 o 20:00 ART) y los `excludeIds` de publicaciones del turno opuesto.
 *
 *  Composición (Fede 2026-09-05): 3 fullbleed (de secciones distintas) + 2 mix
 *  (cita/dato/titular). CTA opcional dentro de mix (sin forceLastCta).
 *  Rotación: secciones rotadas por run (primer slide distinto al último run),
 *  mixLayouts permutados por run (seed=timestamp). */
export async function buildCarousel(): Promise<CarouselResult> {
  const now = new Date();
  const turno = turnoFromDate(now);
  const since = getSinceForTurno(now, turno);
  const excludeIds = await getRecentlyPublishedArticleIds(turno);
  const rotatedSections = await getRotatedSections("carrusel");
  const notes = await selectNotesForCarousel(since, excludeIds, rotatedSections);
  const timestamp = now.getTime();

  const sections: Section[] = notes.map((n) => (n ? n.section : ("politica" as Section)));

  // Composición v3: 3 FB + 2 mix, sin CTA fijo (opcional dentro de mix).
  const composition: SlideComposition = {
    fullbleedCount: 3,
    mixCount: 2,
    ctaCount: 0,
    mixLayouts: getMixLayouts(timestamp),
  };
  const plans = planSlidesV3(
    notes.map((n) => (n ? { body: n.body, image_url: n.image_url, title: n.title, section: n.section } : { body: null, image_url: null, title: "", section: "politica" as Section })),
    composition,
  );

  const slideResults = await Promise.all(
    notes.map(async (note, i): Promise<string | null> => {
      if (!note || !note.title) return null;
      try {
        const plan = plans[i];
        const slideData: SlideDataV2 = {
          title: note.title,
          section: note.section,
          imageDataUrl: note.image_url ?? "",
          excerpt: note.excerpt ?? undefined,
          dateLabel: formatDateLabel(note.created_at),
          sourceLabel: note.author ?? undefined,
          layout: plan.layout,
          quote: plan.quote,
          stat: plan.stat,
        };
        const png = await generateSlidePng(slideData);
        return await uploadSlidePng(png, note.section, timestamp);
      } catch (err) {
        console.error(`buildCarousel: slide falló para ${note.section}:`, err);
        return null;
      }
    }),
  );

  const slideImageUrls = slideResults.filter((u): u is string => u !== null);
  const caption = buildCaption(notes, turno);
  const articleIds = notes.map((n) => (n ? n.id : null));

  // Placa promo horóscopo al final del carrusel (no es nota: articleId null).
  const promoUrl = await getHoroscopoPromoUrl("carrusel");
  if (promoUrl) {
    slideImageUrls.push(promoUrl);
    articleIds.push(null);
    sections.push("horoscopo");
  }

  return { notes, slideImageUrls, caption, articleIds, sections };
}

/** Orquesta stories: select 10 (2 por sección) → generate 10 PNGs 9:16 → upload.
 *  Calcula turno, since y excludeIds igual que buildCarousel.
 *
 *  Composición (Fede 2026-09-05): 5 fullbleed (1 por sección, secciones distintas)
 *  + 4 mix (cita/dato/titular) + 1 CTA de cierre al final.
 *  Rotación: secciones rotadas por run (independiente del carrusel), mixLayouts
 *  permutados con seed distinto al carrusel (timestamp + 1). */
export async function buildStories(): Promise<StoriesResult> {
  const now = new Date();
  const turno = turnoFromDate(now);
  const since = getSinceForTurno(now, turno);
  const excludeIds = await getRecentlyPublishedArticleIds(turno);
  const rotatedSections = await getRotatedSections("stories", 2);
  const notes = await selectNotesForStories(since, excludeIds, rotatedSections);
  const timestamp = now.getTime();

  const sections: Section[] = notes.map((n) =>
    n ? n.section : ("politica" as Section),
  );

  // Composición v3: 5 FB (1 por sección) + 4 mix + 1 CTA al final.
  const composition: SlideComposition = {
    fullbleedCount: 5,
    mixCount: 4,
    ctaCount: 1,
    mixLayouts: getMixLayouts(timestamp + 1), // seed distinto al carrusel
  };
  const plans = planSlidesV3(
    notes.map((n) => (n ? { body: n.body, image_url: n.image_url, title: n.title, section: n.section } : { body: null, image_url: null, title: "", section: "politica" as Section })),
    composition,
  );

  const slideResults = await mapWithConcurrency(
    notes,
    PNG_GEN_CONCURRENCY,
    async (note, i): Promise<string | null> => {
      if (!note || !note.title) return null;
      try {
        const plan = plans[i];
        const slideData: SlideDataV2 = {
          title: note.title,
          section: note.section,
          imageDataUrl: note.image_url ?? "",
          excerpt: note.excerpt ?? undefined,
          dateLabel: formatDateLabel(note.created_at),
          sourceLabel: note.author ?? undefined,
          layout: plan.layout,
          quote: plan.quote,
          stat: plan.stat,
        };
        const png = await generateStoryPng(slideData);
        return await uploadStoryPosterPng(png, note.section, i + 1, timestamp);
      } catch (err) {
        console.error(`buildStories: story falló para ${note.section} #${i + 1}:`, err);
        return null;
      }
    },
  );

  const slideImageUrls = slideResults.filter((u): u is string => u !== null);
  const articleIds = notes.map((n) => (n ? n.id : null));

  // Placa promo horóscopo antes del CTA (último slide = cierre del stories).
  const promoUrl = await getHoroscopoPromoUrl("story");
  if (promoUrl && slideImageUrls.length >= 2) {
    const insertAt = slideImageUrls.length - 1;
    slideImageUrls.splice(insertAt, 0, promoUrl);
    articleIds.splice(insertAt, 0, null);
    sections.splice(insertAt, 0, "horoscopo");
  }

  return { notes, slideImageUrls, articleIds, sections };
}