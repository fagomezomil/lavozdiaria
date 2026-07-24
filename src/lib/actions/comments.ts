"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { containsBannedWord } from "@/lib/moderation/banned-words";
import { containsUrl } from "@/lib/moderation/url-filter";
import { analyzeToxicity, verdictFromScore } from "@/lib/moderation/groq-moderation";
import { rateLimitCommentByUser } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export type CommentStatus = "pending" | "approved" | "rejected" | "flagged";

export interface SubmitCommentResult {
  ok: boolean;
  error?: string;
  comment?: {
    id: string;
    article_id: string;
    user_id: string | null;
    user_name: string;
    user_avatar_url: string | null;
    content: string;
    created_at: string;
    status: CommentStatus;
    toxicity_score: number | null;
  };
  status?: CommentStatus;
}

const REPORT_THRESHOLD = 3; // comentarios con >= 3 reportes pasan a 'flagged'

/** Envía un comentario con moderación híbrida:
 *  1. Auth + suspended check
 *  2. Banned-words local → rechazo directo
 *  3. Perspective API (toxicity score) → status pending si >= 0.7
 *  4. Insert con service_role (permite status calculado) */
export async function submitComment(
  articleId: string,
  content: string,
): Promise<SubmitCommentResult> {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Comentario vacío" };
  if (trimmed.length > 1000) return { ok: false, error: "Excede 1000 caracteres" };

  // 1. Auth + suspended check via cookie client
  const cookieClient = await createClient();
  const { data: { user } } = await cookieClient.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión" };

  // 1b. Rate limit por usuario (5 comentarios/min) — en proceso
  if (!rateLimitCommentByUser(user.id)) {
    return { ok: false, error: "Estás comentando muy rápido. Esperá un minuto e intentá de nuevo." };
  }

  const { data: profile } = await cookieClient
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role === "suspended") {
    return { ok: false, error: "Tu cuenta está suspendida" };
  }

  // 1c. Verificar que el artículo existe y tiene comments habilitados
  // (el CommentSection no renderiza si está apagado, pero un atacante puede
  // llamar la server action directo con un articleId deshabilitado)
  const { data: article } = await cookieClient
    .from("articles")
    .select("comments_enabled")
    .eq("id", articleId)
    .single();

  if (!article) {
    return { ok: false, error: "La nota no existe" };
  }
  if (article.comments_enabled === false) {
    return { ok: false, error: "Los comentarios están desactivados para esta nota" };
  }

  // 2. Banned-words local → rechazo
  const { banned, matched } = containsBannedWord(trimmed);
  if (banned) {
    // No revelar la palabra exacta al usuario para no ayudar a evadir
    void matched;
    return { ok: false, error: "Tu comentario contiene lenguaje no permitido. Revisá el texto y volvé a intentarlo." };
  }

  // 3. Filtro de URLs — comentarios con links van a pending siempre (típico spam)
  const { hasUrl } = containsUrl(trimmed);

  // 4. Groq + Llama 3.3
  let toxicityScore: number | null = null;
  let status: CommentStatus = "pending"; // fail-safe

  const moderation = await analyzeToxicity(trimmed);
  if (moderation) {
    toxicityScore = moderation.score;
    const verdict = verdictFromScore(moderation.score);
    status = verdict === "pending" ? "pending" : "approved";
  }
  // Si Groq falla, queda 'pending' (fail-safe: cola moderación)

  // Override: si tiene URL, forzar pending sin importar toxicity
  if (hasUrl) {
    status = "pending";
  }

  // 4. Insert con service_role
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("comments")
    .insert({
      article_id: articleId,
      user_id: user.id,
      content: trimmed,
      status,
      toxicity_score: toxicityScore,
    })
    .select("id, article_id, user_id, content, created_at, status, toxicity_score")
    .single();

  if (error || !data) {
    console.error("submitComment insert error:", error);
    return { ok: false, error: "Error al guardar el comentario" };
  }

  const userName = profile?.full_name || user.email || "Anónimo";
  const userAvatar = profile?.avatar_url ?? null;

  return {
    ok: true,
    status,
    comment: {
      id: data.id as string,
      article_id: data.article_id as string,
      user_id: (data.user_id as string) || null,
      user_name: userName,
      user_avatar_url: userAvatar,
      content: data.content as string,
      created_at: data.created_at as string,
      status: data.status as CommentStatus,
      toxicity_score: data.toxicity_score as number | null,
    },
  };
}

export interface ReportCommentResult {
  ok: boolean;
  error?: string;
  flagged?: boolean;
}

/** Usuario reporta un comentario. Sube report_count; si llega a 3 → flagged. */
export async function reportComment(
  commentId: string,
  reason: string,
): Promise<ReportCommentResult> {
  const trimmed = reason.trim();
  if (!trimmed) return { ok: false, error: "Razón vacía" };
  if (trimmed.length > 200) return { ok: false, error: "Razón demasiado larga" };

  const cookieClient = await createClient();
  const { data: { user } } = await cookieClient.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión" };

  // Insert en comment_reports (UNIQUE previene reportes dobles del mismo user)
  const admin = await getSupabaseAdmin();
  const { error: insertError } = await admin.from("comment_reports").insert({
    comment_id: commentId,
    user_id: user.id,
    reason: trimmed,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "Ya reportaste este comentario" };
    }
    console.error("reportComment insert error:", insertError);
    return { ok: false, error: "Error al reportar" };
  }

  // Subir report_count + flagged si >= threshold
  const { data: comment } = await admin
    .from("comments")
    .select("report_count, status")
    .eq("id", commentId)
    .single();

  if (!comment) return { ok: true };

  const newCount = (comment.report_count as number) + 1;
  const shouldFlag = newCount >= REPORT_THRESHOLD && comment.status === "approved";

  const update: Record<string, unknown> = { report_count: newCount };
  if (shouldFlag) update.status = "flagged";

  await admin.from("comments").update(update).eq("id", commentId);

  return { ok: true, flagged: shouldFlag };
}

export interface ModerateCommentResult {
  ok: boolean;
  error?: string;
}

/** Admin/editor aprueba, rechaza o marca un comentario. */
export async function moderateComment(
  commentId: string,
  action: "approve" | "reject" | "flag",
): Promise<ModerateCommentResult> {
  // Validar action en runtime (TypeScript no se aplica si llaman por fetch directo)
  if (action !== "approve" && action !== "reject" && action !== "flag") {
    return { ok: false, error: "Acción inválida" };
  }

  const cookieClient = await createClient();
  const { data: { user } } = await cookieClient.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await cookieClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "editor") {
    return { ok: false, error: "No autorizado" };
  }

  const statusMap: Record<typeof action, CommentStatus> = {
    approve: "approved",
    reject: "rejected",
    flag: "flagged",
  };

  const admin = await getSupabaseAdmin();
  const { error } = await admin
    .from("comments")
    .update({ status: statusMap[action] })
    .eq("id", commentId);

  if (error) {
    console.error("moderateComment error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/comments");
  return { ok: true };
}

export interface DeleteCommentResult {
  ok: boolean;
  error?: string;
}

/** Admin/editor elimina un comentario (cualquiera). */
export async function deleteComment(commentId: string): Promise<DeleteCommentResult> {
  const cookieClient = await createClient();
  const { data: { user } } = await cookieClient.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await cookieClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "editor") {
    return { ok: false, error: "No autorizado" };
  }

  const admin = await getSupabaseAdmin();
  const { error } = await admin.from("comments").delete().eq("id", commentId);

  if (error) {
    console.error("deleteComment error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/comments");
  return { ok: true };
}