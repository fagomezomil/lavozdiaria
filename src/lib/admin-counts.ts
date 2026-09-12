import { createClient } from "@/lib/supabase/server";

export interface AdminCounts {
  revision: number;
  propuestas: number;
  comentarios: number;
}

/** Counts de ítems pendientes de revisión para los badges de la nav admin.
 *  Best-effort: cualquier error → 0 (el badge simplemente no aparece). */
export async function getPendingCounts(): Promise<AdminCounts> {
  const empty: AdminCounts = { revision: 0, propuestas: 0, comentarios: 0 };
  try {
    const supabase = await createClient();

    // Revisión LLM: notas del agente esperando aprobación humana
    const revisionQuery = supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .filter("source", "in", '("contextotucuman","ambito","tycsports")')
      .eq("manual_review_required", true)
      .not("enhanced_at", "is", null);

    // Propuestas de agenda pendientes
    const propuestasQuery = supabase
      .from("event_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    // Comentarios por moderar (nuevos + reportados)
    const comentariosQuery = supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "flagged"]);

    const [revision, propuestas, comentarios] = await Promise.all([
      revisionQuery,
      propuestasQuery,
      comentariosQuery,
    ]);

    return {
      revision: revision.count ?? 0,
      propuestas: propuestas.count ?? 0,
      comentarios: comentarios.count ?? 0,
    };
  } catch (e) {
    console.warn("[admin-counts] error:", e instanceof Error ? e.message : e);
    return empty;
  }
}