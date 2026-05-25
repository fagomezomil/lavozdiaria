"use server";

import { createClient, requireAdminAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteAd(id: string) {
  try {
    await requireAdminAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ads").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients/[id]");
  return { error: null };
}