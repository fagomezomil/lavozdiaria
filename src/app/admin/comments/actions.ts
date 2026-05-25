"use server";

import { createClient, requireEditorAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteComment(commentId: string) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/comments");
  return { error: null };
}