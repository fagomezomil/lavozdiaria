"use server";

import { createClient, requireEditorAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyArticleChange } from "@/lib/indexnow";
import { notifyGoogleIndexing } from "@/lib/google-indexing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.quenoticia.com.ar";

export async function deleteArticle(id: string) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  // Fetch section antes de borrar para armar URL de IndexNow
  const { data: existing } = await supabase
    .from("articles")
    .select("section")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("articles").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/opinion");
  revalidatePath("/");

  // IndexNow: notificar URL eliminada (Bing la saca del índice)
  // Google Indexing API: URL_DELETED (Google la saca del índice)
  if (existing?.section) {
    void notifyArticleChange(existing.section, id);
    void notifyGoogleIndexing(`${SITE_URL}/${existing.section}/${id}`, "URL_DELETED");
  }
  return { error: null };
}

export async function toggleArticleFeatured(
  id: string,
  featured: boolean,
  featuredAt: string | null,
) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  // Tres casos: destacar (featured=false), renovar (featured vencida, >24h)
  // o quitar destacada (featured fresca). Renovar mantiene featured=true y
  // arranca un nuevo ciclo de 24h.
  const WINDOW_MS = 24 * 60 * 60 * 1000;
  const isStale =
    featured && featuredAt && Date.now() - new Date(featuredAt).getTime() >= WINDOW_MS;

  const updates = isStale
    ? { featured: true, featured_at: new Date().toISOString() }
    : featured
      ? { featured: false, featured_at: null }
      : { featured: true, featured_at: new Date().toISOString() };

  const { error } = await supabase
    .from("articles")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/");
  return { error: null };
}

export async function toggleArticlePinned(id: string, pinned: boolean) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ pinned: !pinned })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/");
  return { error: null };
}

export async function toggleArticleBreaking(id: string, breaking: boolean) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ breaking: !breaking })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/");
  return { error: null };
}

export async function toggleArticleActive(id: string, active: boolean) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ active: !active })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/opinion");
  revalidatePath("/");

  // IndexNow + Google Indexing: notificar cambio de visibilidad
  const { data: article } = await supabase
    .from("articles")
    .select("section")
    .eq("id", id)
    .maybeSingle();
  if (article?.section) {
    void notifyArticleChange(article.section, id);
    void notifyGoogleIndexing(`${SITE_URL}/${article.section}/${id}`, "URL_UPDATED");
  }
  return { error: null };
}