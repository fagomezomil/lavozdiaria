import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Section } from "@/lib/types";

/** Secciones incluidas en el carrusel (opinion queda fuera — es manual-only;
 *  actualidad también queda fuera — es contenido automático sin mirada tucumana;
 *  horoscopo fuera — cada nota es UN signo, no es noticia: la promo se publica
 *  como placa fija en carousel-builder). */
export const CAROUSEL_SECTIONS: Section[] = [
  "politica",
  "deportes",
  "tucuman",
  "economia",
  "internacionales",
  "espectaculos",
];

export interface SelectedNote {
  id: string;
  title: string;
  section: Section;
  image_url: string | null;
  original_url: string | null;
  excerpt: string | null;
  body?: string | null;
  created_at: string;
  author?: string | null;
  tags?: string[];
}

type DbRow = {
  id: string;
  title: string;
  section: Section;
  image_url: string | null;
  original_url: string | null;
  excerpt: string | null;
  body: string | null;
  created_at: string;
  author: string | null;
  tags: string[]; // NOT NULL default '{}' en DB
};

const FALLBACK_WINDOW_HOURS = 72; // 3 días

/** Construye el filtro PostgREST `id=not.in.(...)` para excluir IDs ya publicados.
 *  Devuelve string vacío si no hay IDs (para no romper la query). */
function buildExcludeFilter(excludeIds: Set<string>): string | null {
  if (excludeIds.size === 0) return null;
  // PostgREST acepta UUIDs sin comillas en el operador `in`.
  return `(${[...excludeIds].join(",")})`;
}

/** Elige 5 notas (1 por sección) para el carrusel.
 *  - Primero busca nota nueva de esa sección desde `since`, excluyendo `excludeIds`.
 *  - Si no hay, fallback: la más reciente de esa sección en los últimos 3 días (también excluye).
 *  - Si tampoco hay, retorna null para ese slot (el caller decide si saltar). */
export async function selectNotesForCarousel(
  since: Date,
  excludeIds: Set<string>,
  sections: Section[] = CAROUSEL_SECTIONS,
): Promise<(SelectedNote | null)[]> {
  const admin = await getSupabaseAdmin();
  const sinceIso = since.toISOString();
  const fallbackSince = new Date(Date.now() - FALLBACK_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const excludeFilter = buildExcludeFilter(excludeIds);

  const cols = "id, title, section, image_url, original_url, excerpt, body, created_at, author, tags";

  const results = await Promise.all(
    sections.map(async (section): Promise<SelectedNote | null> => {
      // 1. Nota nueva desde `since` (excluyendo ya publicadas)
      let freshQuery = admin
        .from("articles")
        .select(cols)
        .eq("section", section)
        .eq("active", true)
        .gt("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(1);
      if (excludeFilter) freshQuery = freshQuery.filter("id", "not.in", excludeFilter);
      const { data: fresh } = await freshQuery.maybeSingle();

      if (fresh) return fresh as DbRow;

      // 2. Fallback: más reciente de los últimos 3 días (también excluye)
      let recentQuery = admin
        .from("articles")
        .select(cols)
        .eq("section", section)
        .eq("active", true)
        .gt("created_at", fallbackSince)
        .order("created_at", { ascending: false })
        .limit(1);
      if (excludeFilter) recentQuery = recentQuery.filter("id", "not.in", excludeFilter);
      const { data: recent } = await recentQuery.maybeSingle();

      return (recent as DbRow | null) ?? null;
    }),
  );

  return results;
}

/** Elige 10 notas (2 por sección, las 2 más recientes) para stories.
 *  - La #1 de cada sección = "stories del feed" (las más recientes).
 *  - La #2 de cada sección = "stories extra" (siguientes en prioridad).
 *  - Excluye `excludeIds` (notas ya publicadas en el turno opuesto).
 *  - Fallback: si solo hay 1 nota en la sección, esa va como #1 y la #2 queda null.
 *  - Si no hay ninguna, ambos slots son null. */
export async function selectNotesForStories(
  since: Date,
  excludeIds: Set<string>,
  sections: Section[] = CAROUSEL_SECTIONS,
): Promise<Array<SelectedNote | null>> {
  const admin = await getSupabaseAdmin();
  const sinceIso = since.toISOString();
  const fallbackSince = new Date(Date.now() - FALLBACK_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const excludeFilter = buildExcludeFilter(excludeIds);

  const cols = "id, title, section, image_url, original_url, excerpt, body, created_at, author, tags";

  const results = await Promise.all(
    sections.map(async (section): Promise<(SelectedNote | null)[]> => {
      // 1. Notas nuevas desde `since`, hasta 2 (excluyendo ya publicadas)
      let freshQuery = admin
        .from("articles")
        .select(cols)
        .eq("section", section)
        .eq("active", true)
        .gt("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(2);
      if (excludeFilter) freshQuery = freshQuery.filter("id", "not.in", excludeFilter);
      const { data: fresh } = await freshQuery;
      const freshRows = (fresh as DbRow[] | null) ?? [];

      if (freshRows.length >= 2) {
        return [freshRows[0], freshRows[1]];
      }

      // 2. Si hay 1 nueva, completar con la más reciente (excluyendo la #1 y los ya publicados)
      if (freshRows.length === 1) {
        let recentQuery = admin
          .from("articles")
          .select(cols)
          .eq("section", section)
          .eq("active", true)
          .gt("created_at", fallbackSince)
          .neq("id", freshRows[0].id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (excludeFilter) recentQuery = recentQuery.filter("id", "not.in", excludeFilter);
        const { data: recent } = await recentQuery.maybeSingle();
        return [freshRows[0], (recent as DbRow | null) ?? null];
      }

      // 3. Fallback total: las 2 más recientes de los últimos 3 días (excluyendo ya publicadas)
      let recent2Query = admin
        .from("articles")
        .select(cols)
        .eq("section", section)
        .eq("active", true)
        .gt("created_at", fallbackSince)
        .order("created_at", { ascending: false })
        .limit(2);
      if (excludeFilter) recent2Query = recent2Query.filter("id", "not.in", excludeFilter);
      const { data: recent2 } = await recent2Query;
      const recentRows = (recent2 as DbRow[] | null) ?? [];
      if (recentRows.length >= 1) {
        return [recentRows[0], recentRows[1] ?? null];
      }

      return [null, null];
    }),
  );

  // Aplanar: de [[a, b], [c, d], ...] → [a, b, c, d, ...]
  return results.flat();
}