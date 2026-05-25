"use server";

import { createClient, requireEditorAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteArticle(id: string) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);

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
  revalidatePath("/");
  return { error: null };
}