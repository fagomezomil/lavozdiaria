"use server";

import { createClient, requireEditorAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateArticlePayload {
  id: string;
  title: string;
  subtitle: string | null;
  section: string;
  author: string | null;
  publisher: string;
  date: string;
  image_url: string | null;
  image_alt: string;
  excerpt: string;
  body: string | null;
  original_url: string | null;
  featured: boolean;
  breaking: boolean;
  active: boolean;
  comments_enabled: boolean;
}

export async function updateArticle(payload: UpdateArticlePayload) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  const { id, ...data } = payload;

  const { error } = await supabase
    .from("articles")
    .update(data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath(`/${payload.section}`);
  revalidatePath(`/${payload.section}/${id}`);

  return { error: null };
}

interface CreateArticlePayload {
  title: string;
  subtitle: string | null;
  section: string;
  author: string | null;
  publisher: string;
  date: string;
  image_url: string | null;
  image_alt: string;
  excerpt: string;
  body: string | null;
  original_url: string | null;
  featured: boolean;
  breaking: boolean;
  layout: string;
  active: boolean;
  comments_enabled: boolean;
}

export async function createArticle(payload: CreateArticlePayload) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado", id: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { error: error.message, id: null };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath(`/${payload.section}`);

  return { error: null, id: data.id };
}

export async function uploadArticleImage(formData: FormData) {
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

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Tipo de archivo no permitido. Solo JPG, PNG, WebP, GIF.", url: null };
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "La imagen no puede superar 5MB.", url: null };
  }

  const ext = file.name.split(".").pop();
  const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("articles")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message, url: null };
  }

  const { data: urlData } = supabase.storage.from("articles").getPublicUrl(path);
  return { error: null, url: urlData.publicUrl };
}