"use server";

import { createClient, requireAdminAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleRole(userId: string, newRole: string) {
  try {
    await requireAdminAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { error: null };
}