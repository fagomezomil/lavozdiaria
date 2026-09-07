/** Helpers de formato de fecha para cards y artículos. */

import type { Article } from "@/lib/types";
import { displaySource } from "@/lib/types";

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Fecha compacta: "2 sep 2026" */
export function formatCompactDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Tiempo relativo: "hace 5min", "hace 2h", "hace 3d", "hace 1sem".
 *  Para >30d cae a fecha compacta. */
export function formatRelativeTime(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "recién";
  if (diffMin < 60) return `hace ${diffMin}min`;
  if (diffH < 24) return `hace ${diffH}h`;
  if (diffD < 7) return `hace ${diffD}d`;
  if (diffD < 30) return `hace ${Math.floor(diffD / 7)}sem`;
  return formatCompactDate(isoDate);
}

/** Construye el byline de la card: línea de fecha (relativa + compacta) +
 *  fuente (solo si la nota NO pasó por el LLM). */
export function cardByline(article: Article): { dateLine: string; source?: string } {
  const isEnhanced = !!article.enhancedAt;
  const source = isEnhanced
    ? "¡Qué Noticia!"
    : displaySource(article.author ?? article.publisher);
  // Usamos nuestra hora de publicación (enhancedAt para notas que pasaron por el
  // enhancer, createdAt para notas directas/admin) en vez del sort_date de la
  // fuente, que muchas veces es impreciso (Contexto usa 00:00 UTC).
  const ts =
    article.enhancedAt ??
    ('created_at' in article ? (article as { created_at: string }).created_at : undefined) ??
    article.sortDate;
  const relative = ts ? formatRelativeTime(ts) : "";
  const compact = ts ? formatCompactDate(ts) : article.date;
  const dateLine = [relative, compact].filter(Boolean).join(" · ");
  return { dateLine, source };
}