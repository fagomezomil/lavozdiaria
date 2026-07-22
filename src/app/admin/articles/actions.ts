"use server";

import { createClient, requireEditorAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Whitelist de campos permitidos en create/update — todo lo que no esté acá se descarta.
const ARTICLE_FIELDS = [
  "title", "subtitle", "section", "author", "publisher", "date",
  "image_url", "image_alt", "excerpt", "body", "original_url",
  "featured", "breaking", "active", "comments_enabled",
  "volanta", "columnist_id",
] as const;

function pickAllowedFields(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of ARTICLE_FIELDS) {
    if (key in payload) {
      out[key] = payload[key];
    }
  }
  return out;
}

const ALLOWED_SECTIONS = ["politica", "deportes", "economia", "internacionales", "tucuman", "opinion"];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

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
  volanta?: string | null;
  columnist_id?: string | null;
}

export async function updateArticle(payload: UpdateArticlePayload) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  // Validar section contra whitelist
  if (!ALLOWED_SECTIONS.includes(payload.section)) {
    return { error: "Sección no válida" };
  }

  const supabase = await createClient();

  // Validar columnist_id activo si viene
  if (payload.columnist_id) {
    const { data: col } = await supabase
      .from("columnists")
      .select("id, active")
      .eq("id", payload.columnist_id)
      .maybeSingle();
    if (!col || !col.active) {
      return { error: "El columnista seleccionado no existe o está inactivo." };
    }
  }

  const { id, ...raw } = payload;
  const data = pickAllowedFields(raw);

  const { error } = await supabase
    .from("articles")
    .update(data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/opinion");
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
  volanta?: string | null;
  columnist_id?: string | null;
}

export async function createArticle(payload: CreateArticlePayload) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado", id: null };
  }

  // Validar section contra whitelist
  if (!ALLOWED_SECTIONS.includes(payload.section)) {
    return { error: "Sección no válida", id: null };
  }

  const supabase = await createClient();

  // Validar columnist_id activo si viene
  if (payload.columnist_id) {
    const { data: col } = await supabase
      .from("columnists")
      .select("id, active")
      .eq("id", payload.columnist_id)
      .maybeSingle();
    if (!col || !col.active) {
      return { error: "El columnista seleccionado no existe o está inactivo.", id: null };
    }
  }

  const data = pickAllowedFields(payload as unknown as Record<string, unknown>);

  const { data: result, error } = await supabase
    .from("articles")
    .insert(data)
    .select("id")
    .single();

  if (error) {
    return { error: error.message, id: null };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/admin/opinion");
  revalidatePath("/");
  revalidatePath(`/${payload.section}`);

  return { error: null, id: result.id };
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

  // Ext derivada del MIME (whitelist) — nunca del filename del user
  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    return { error: "Tipo de archivo no permitido.", url: null };
  }
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