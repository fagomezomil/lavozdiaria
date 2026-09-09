import type { SelectedNote } from "./select-notes";
import { sectionConfig } from "@/lib/types";
import { AGENDA_LABELS } from "./slide-template";

const SITE_URL = "https://www.quenoticia.com.ar";

/** Construye el caption del carrusel (1 link por sección, count dinámico).
 *  Formato:
 *    📰 Las {n} noticias de ¡QUE NOTICIA! — {turno}
 *
 *    1️⃣ {sección}: {título}
 *       {link}
 *    ...
 *
 *    📲 Leé la noticia completa en quenoticia.com.ar */
export function buildCaption(
  notes: (SelectedNote | null)[],
  turno: "mañana" | "noche",
): string {
  const lines: string[] = [];
  const valid = notes.filter(Boolean).length;
  lines.push(`📰 Las ${valid} noticias de ¡QUE NOTICIA! — ${turno === "mañana" ? "edición mañana" : "edición noche"}`);
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
  return lines.join("\n");
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