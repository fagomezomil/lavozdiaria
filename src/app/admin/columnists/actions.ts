"use server";

import { createClient, requireAdminAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/columnists";

interface CreateColumnistPayload {
  name: string;
  slug: string;
  photo_url: string | null;
  bio: string | null;
  active: boolean;
}

interface UpdateColumnistPayload {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  bio: string | null;
  active: boolean;
}

async function ensureUniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, slug: string, excludeId?: string): Promise<string> {
  let candidate = slug || slugify("columnista");
  if (!candidate) candidate = "columnista";
  let suffix = 1;
  let base = candidate;
  while (true) {
    let query = supabase.from("columnists").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();
    if (error) return candidate; // let the insert fail later with a clearer error
    if (!data) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

export async function createColumnist(payload: CreateColumnistPayload) {
  try {
    await requireAdminAction();
  } catch {
    return { error: "No autorizado", id: null };
  }

  const supabase = await createClient();
  const finalSlug = await ensureUniqueSlug(supabase, payload.slug?.trim() || slugify(payload.name));

  const { data, error } = await supabase
    .from("columnists")
    .insert({
      name: payload.name.trim(),
      slug: finalSlug,
      photo_url: payload.photo_url,
      bio: payload.bio,
      active: payload.active,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message, id: null };
  }

  revalidatePath("/admin/columnists");
  revalidatePath("/");
  revalidatePath("/opinion");

  return { error: null, id: data.id };
}

export async function updateColumnist(payload: UpdateColumnistPayload) {
  try {
    await requireAdminAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const finalSlug = await ensureUniqueSlug(supabase, payload.slug?.trim() || slugify(payload.name), payload.id);

  const { error } = await supabase
    .from("columnists")
    .update({
      name: payload.name.trim(),
      slug: finalSlug,
      photo_url: payload.photo_url,
      bio: payload.bio,
      active: payload.active,
    })
    .eq("id", payload.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/columnists");
  revalidatePath("/");
  revalidatePath("/opinion");

  return { error: null };
}

export async function deleteColumnist(id: string) {
  try {
    await requireAdminAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("columnists").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/columnists");
  revalidatePath("/");
  revalidatePath("/opinion");

  return { error: null };
}

export async function uploadColumnistPhoto(formData: FormData) {
  try {
    await requireAdminAction();
  } catch {
    return { error: "No autorizado", url: null };
  }

  const supabase = await createClient();
  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No se seleccionó archivo", url: null };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Tipo de archivo no permitido. Solo JPG, PNG, WebP, GIF.", url: null };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "La imagen no puede superar 5MB.", url: null };
  }

  // Ext derivada del MIME (whitelist) — nunca del filename del user
  const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    return { error: "Tipo de archivo no permitido.", url: null };
  }
  const path = `columnists/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("articles")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message, url: null };
  }

  const { data: urlData } = supabase.storage.from("articles").getPublicUrl(path);
  return { error: null, url: urlData.publicUrl };
}