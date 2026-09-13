import type { SelectedNote } from "./select-notes";
import { sectionConfig } from "@/lib/types";
import { AGENDA_LABELS } from "./slide-template";

const SITE_URL = "https://www.quenoticia.com.ar";

/** Normaliza un tag (lowercase, sin acentos) a hashtag CamelCase: "san miguel" → #SanMiguel. */
function toHashtag(tag: string): string {
  const deaccented = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return deaccented
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

/** Hashtags del carrusel: #QueNoticia #Tucuman + tags de las notas (dedupe,
 *  máx 5 — IG recomienda 3-5 relevantes, no 30). Fallback sin tags en DB:
 *  hashtags por sección de las notas seleccionadas. */
export function buildHashtags(notes: (SelectedNote | null)[], max = 5): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (tag: string) => {
    const h = toHashtag(tag);
    if (!h) return;
    const key = h.toLowerCase();
    if (seen.has(key) || out.length >= max) return;
    seen.add(key);
    out.push(`#${h}`);
  };

  push("que noticia");
  push("tucuman");

  for (const note of notes) {
    if (!note) continue;
    for (const tag of note.tags ?? []) push(tag);
  }
  // Fallback: notas sin tags (pre-migración) → hashtag por sección
  if (out.length < max) {
    for (const note of notes) {
      if (!note) continue;
      push(sectionConfig[note.section].label);
      if (out.length >= max) break;
    }
  }
  return out;
}

/** Construye el caption del carrusel (1 link por sección, count dinámico).
 *  Formato (keyword-first: el título principal abre el caption — IG indexa los
 *  primeros ~125 chars y la marca genérica no aporta keywords):
 *    {título nota principal}
 *    📰 Las {n} noticias de ¡QUE NOTICIA! — {turno}
 *
 *    1️⃣ {sección}: {título}
 *       {link}
 *    ...
 *
 *    📲 Leé la noticia completa en quenoticia.com.ar
 *
 *  channel="instagram" agrega bloque de hashtags al final (3-5). facebook queda
 *  limpio (los hashtags casi no impactan en FB). Sin channel = sin hashtags
 *  (compat con otros call sites). */
export function buildCaption(
  notes: (SelectedNote | null)[],
  turno: "mañana" | "noche",
  channel?: "instagram" | "facebook",
): string {
  const lines: string[] = [];
  const valid = notes.filter(Boolean).length;
  const turnoLabel = turno === "mañana" ? "edición mañana" : "edición noche";
  const headline = notes.find((n) => n?.title)?.title ?? "";

  if (headline) {
    lines.push(headline);
    lines.push(`📰 Las ${valid} noticias de ¡QUE NOTICIA! — ${turnoLabel}`);
  } else {
    lines.push(`📰 Las ${valid} noticias de ¡QUE NOTICIA! — ${turnoLabel}`);
  }
  lines.push("");

  const numbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"];
  notes.forEach((note, i) => {
    if (!note) {
      lines.push(`${numbers[i]} (sin novedades en esta sección)`);
      lines.push("");
      return;
    }
    const label = sectionConfig[note.section].label;
    lines.push(`${numbers[i]} ${label}: ${note.title}`);
    lines.push(`${SITE_URL}/${note.section}/${note.id}`);
    lines.push("");
  });

  lines.push("📲 Leé la noticia completa en quenoticia.com.ar");
  if (channel === "instagram") {
    const hashtags = buildHashtags(notes);
    if (hashtags.length > 0) lines.push("", hashtags.join(" "));
  }
  return lines.join("\n");
}

/** Caption por slide de story: título de la nota (keywords) + CTA genérico.
 *  Las stories no indexan hashtags como el feed → caption limpio. */
export function buildStoryNoteCaption(note: SelectedNote): string {
  const label = sectionConfig[note.section].label;
  return [
    `${label}: ${note.title}`,
    "",
    "📖 Nota completa en quenoticia.com.ar",
  ].join("\n");
}

/** Caption genérico para slides sin nota (CTA de cierre, promo horóscopo). */
export function buildStoryGenericCaption(): string {
  return "¡QUE NOTICIA!\n\nLas noticias más importantes de Tucumán y el mundo. Leé más en quenoticia.com.ar";
}

/** Caption para la publicación manual de un evento de agenda. */
export function buildEventCaption(event: {
  title: string;
  category: string;
  venueName?: string | null;
  dateLabel?: string | null;
  excerpt?: string | null;
}): string {
  const lines: string[] = [];
  const catLabel = AGENDA_LABELS[event.category] ?? event.category;
  lines.push(`📅 ${catLabel} en ¡QUE NOTICIA! Agenda`);
  lines.push("");
  lines.push(event.title);
  if (event.venueName) lines.push(`📍 ${event.venueName}`);
  if (event.dateLabel) lines.push(`🗓️ ${event.dateLabel}`);
  if (event.excerpt) {
    const ex = event.excerpt.replace(/\s+/g, " ").trim();
    if (ex.length > 200) lines.push("", ex.slice(0, 197) + "…");
    else if (ex) lines.push("", ex);
  }
  lines.push("");
  lines.push(`👉 Ver agenda completa en ${SITE_URL}/agenda`);
  return lines.join("\n");
}