"use server";

import { createClient, requireEditorAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface SponsoredPayload {
  id?: string;
  title: string;
  subtitle: string | null;
  section: string;
  author: string | null;
  publisher: string | null;
  date: string;
  image_url: string | null;
  image_alt: string;
  excerpt: string | null;
  body: string | null;
  original_url: string | null;
  active: boolean;
  show_on_homepage: boolean;
  show_in_sidebar: boolean;
  client_id: string | null;
  starts_at: string | null;
  expires_at: string | null;
}

export async function saveSponsored(payload: SponsoredPayload) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  if (payload.id) {
    const { id, ...data } = payload;
    const { error } = await supabase
      .from("sponsored_contents")
      .update(data)
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("sponsored_contents")
      .insert(payload);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/admin/sponsored");
  revalidatePath("/");
  revalidatePath("/patrocinado");
  for (const key of ["politica", "deportes", "economia", "internacionales", "tucuman"]) {
    revalidatePath(`/${key}`);
  }

  return { error: null };
}

export async function uploadSponsoredImage(formData: FormData) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado", url: null };
  }

  const supabase = await createClient();

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No se seleccionó archivo", url: null };
  }

  const ext = file.name.split(".").pop();
  const path = `sponsored/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("articles")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message, url: null };
  }

  const { data: urlData } = supabase.storage.from("articles").getPublicUrl(path);
  return { error: null, url: urlData.publicUrl };
}