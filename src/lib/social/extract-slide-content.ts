/** Extracción de contenido para los layouts cita/dato de los slides v2.
 *  Heurísticas con regex sobre el body de la nota — sin LLM, server-side en build time.
 *  Si no encuentra nada, devuelve null y el caller cae al fallback (titular XL). */

import type { SlideLayout } from "./slide-template-v2";
import type { Section } from "@/lib/types";

export interface PlannedSlide {
  layout: SlideLayout;
  quote?: { text: string; author?: string };
  stat?: { value: string; label: string };
}

/** Composición deseada para una tanda de slides. */
export interface SlideComposition {
  fullbleedCount: number;
  mixCount: number;
  ctaCount: number;
  /** Orden permutado de layouts mix a aplicar (cita/dato/titular). */
  mixLayouts: SlideLayout[];
}

/** Asigna layouts por composición (v3).
 *
 *  Algoritmo:
 *  1. De las notas con imagen, asignar fullbleed a las primeras N, una por sección.
 *  2. Las restantes → mix. Iterar mixLayouts en orden; cita si hay quote, dato si
 *     hay stat, titular como fallback. Si una nota no tiene contenido para el
 *     layout actual, salta al siguiente en la permutación.
 *  3. CTA al final (ctaCount veces).
 *
 *  Fallback: si hay menos notas con imagen que fullbleedCount, las que falcan
 *  se asignan como mix (titular). Si hay menos notas que el total esperado,
 *  se asigna lo que haya. */
export function planSlidesV3(
  notes: Array<{ body?: string | null; image_url: string | null; title: string; section: Section }>,
  composition: SlideComposition,
): PlannedSlide[] {
  const { fullbleedCount, ctaCount, mixLayouts } = composition;
  const total = notes.length;
  const results: PlannedSlide[] = new Array(total);

  // 1. Asignar fullbleed: notas con imagen, una por sección (distintas secciones).
  const usedSections = new Set<Section>();
  const fbIndices: number[] = [];
  for (let i = 0; i < total && fbIndices.length < fullbleedCount; i++) {
    const note = notes[i];
    if (note.image_url && !usedSections.has(note.section)) {
      fbIndices.push(i);
      usedSections.add(note.section);
      results[i] = { layout: "fullbleed" };
    }
  }

  // 2. Asignar mix a las restantes (excepto los últimos ctaCount slots que son CTA).
  const ctaStartIndex = total - ctaCount;
  let mixLayoutIdx = 0;
  for (let i = 0; i < total; i++) {
    if (results[i] !== undefined) continue; // ya asignado (fullbleed)
    if (i >= ctaStartIndex && ctaCount > 0) {
      results[i] = { layout: "cta" };
      continue;
    }

    const note = notes[i];
    const quote = extractQuote(note.body);
    const stat = extractStat(note.body, note.title);

    // Iterar mixLayouts desde el offset actual hasta encontrar uno que calce.
    let chosen: SlideLayout | null = null;
    for (let attempt = 0; attempt < mixLayouts.length; attempt++) {
      const layout = mixLayouts[(mixLayoutIdx + attempt) % mixLayouts.length];
      if (layout === "cita" && quote) { chosen = "cita"; break; }
      if (layout === "dato" && stat) { chosen = "dato"; break; }
      if (layout === "titular") { chosen = "titular"; break; }
    }
    // Fallback: si ningún mixLayout calce con contenido, usar titular.
    chosen = chosen ?? "titular";
    mixLayoutIdx = (mixLayoutIdx + 1) % mixLayouts.length;

    results[i] = {
      layout: chosen,
      quote: chosen === "cita" ? quote ?? undefined : undefined,
      stat: chosen === "dato" ? stat ?? undefined : undefined,
    };
  }

  return results;
}

/** Permuta un array usando un seed determinístico (Fisher-Yates con PRNG lineal). */
export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    // PRNG lineal congruencial (Numerical Recipes)
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Asigna layouts content-aware con dedup.
 *
 *  Prioridad por nota: cita (si hay quote en body) > dato (si hay stat) > fullbleed (si hay foto) > titular.
 *  Cada layout se usa una sola vez antes de repetir (dedup) → máxima variedad.
 *  Si forceLastCta=true, el último slot es siempre "cta" (cierre del carrusel).
 *  Si todos los layouts ya se usaron (stories > 5 notas), se resetea el ciclo. */
export function planSlides(
  notes: Array<{ body?: string | null; image_url: string | null; title: string }>,
  options: { forceLastCta?: boolean } = {},
): PlannedSlide[] {
  const { forceLastCta = false } = options;
  const used = new Set<SlideLayout>();
  const results: PlannedSlide[] = [];

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];

    if (forceLastCta && i === notes.length - 1) {
      results.push({ layout: "cta" });
      continue;
    }

    // Reset si los 4 layouts no-cta ya se usaron (para stories de 10 notas)
    if (used.size >= 4) used.clear();

    const quote = extractQuote(note.body);
    const stat = extractStat(note.body, note.title);

    let chosen: SlideLayout;
    if (quote && !used.has("cita")) chosen = "cita";
    else if (stat && !used.has("dato")) chosen = "dato";
    else if (note.image_url && !used.has("fullbleed")) chosen = "fullbleed";
    else if (!used.has("titular")) chosen = "titular";
    else chosen = "titular";

    used.add(chosen);
    results.push({
      layout: chosen,
      quote: chosen === "cita" ? quote ?? undefined : undefined,
      stat: chosen === "dato" ? stat ?? undefined : undefined,
    });
  }

  return results;
}

/** Extrae una cita del body buscando texto entre comillas.
 *  Acepta "…", «…», '…' (inglés). Rango 20–180 chars.
 *  Devuelve { text, author } o null si no hay cita válida. */
export function extractQuote(
  body: string | null | undefined,
): { text: string; author?: string } | null {
  if (!body) return null;
  const clean = body.replace(/\s+/g, " ").trim();
  if (!clean) return null;

  // Patrones de comillas: «…», "…", "…", '…'
  const patterns = [
    /«([^»]{20,180})»/g,
    /\u201C([^\u201D]{20,180})\u201D/g, // "…"
    /"([^"]{20,180})"/g,
    /\u2018([^\u2019]{20,180})\u2019/g, // '…'
  ];

  for (const re of patterns) {
    re.lastIndex = 0;
    const match = re.exec(clean);
    if (match) {
      const text = match[1].trim();
      // Buscar autor después de la cita: "— Autor", "dijo Autor", "expresó Autor"
      const afterIdx = clean.indexOf(match[0]) + match[0].length;
      const after = clean.slice(afterIdx, afterIdx + 120);
      const authorMatch =
        after.match(/(?:—|\-)\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/) ||
        after.match(/(?:dijo|expresó|señaló|afirmó|indicó|remarcó)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/);
      return { text, author: authorMatch?.[1]?.trim() };
    }
  }

  return null;
}

/** Extrae un dato numérico del body para el layout "dato".
 *  Busca patrones: $X, X%, X mil, X millones, X mil millones, X años, X personas.
 *  Devuelve { value, label } o null. */
export function extractStat(
  body: string | null | undefined,
  title: string,
): { value: string; label: string } | null {
  if (!body) return null;
  const clean = body.replace(/\s+/g, " ").trim();
  if (!clean) return null;

  // Patrones de números con contexto. Orden: más específico primero.
  const patterns: Array<{ re: RegExp; valueGroup: number; labelGroup?: number }> = [
    // $X millones / $X mil millones / $X mil
    { re: /\$\s?(\d[\d.,]*)\s+(mil millones|millones|mil|billones)/g, valueGroup: 0, labelGroup: -1 },
    // X% de/algo
    { re: /(\d[\d.,]*)\s?%\s*(?:de|del|de los|de las|de la)?\s+([a-záéíóúñ ,]{5,60})/g, valueGroup: 1, labelGroup: 2 },
    // X millones de algo
    { re: /(\d[\d.,]*)\s+millones\s+(?:de\s+)?([a-záéíóúñ ,]{5,60})/g, valueGroup: 1, labelGroup: 2 },
    // X mil de algo
    { re: /(\d[\d.,]*)\s+mil\s+(?:de\s+)?([a-záéíóúñ ,]{5,60})/g, valueGroup: 1, labelGroup: 2 },
    // X personas
    { re: /(\d[\d.,]*)\s+(personas|habitantes|casos|muertos|heridos|detenidos|vehículos|unidades)/g, valueGroup: 1, labelGroup: 2 },
  ];

  for (const { re, valueGroup, labelGroup } of patterns) {
    re.lastIndex = 0;
    const match = re.exec(clean);
    if (match) {
      const value = match[valueGroup].trim();
      if (labelGroup && labelGroup > 0 && match[labelGroup]) {
        const label = match[labelGroup].trim().replace(/\s+/g, " ").slice(0, 80);
        return { value, label: capitalize(label) };
      }
      // Para patrones sin labelGroup, construir label del contexto siguiente
      const afterIdx = clean.indexOf(match[0]) + match[0].length;
      const after = clean.slice(afterIdx, afterIdx + 80).trim();
      const label = after.split(/[.,;]/)[0].trim().slice(0, 80);
      if (label.length >= 5) {
        return { value, label: capitalize(label) };
      }
      // Fallback: usar el title como label
      return { value, label: title.slice(0, 80) };
    }
  }

  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}