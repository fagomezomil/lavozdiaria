"use server";

import { createClient, requireEditorAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyArticleChange } from "@/lib/indexnow";
import { notifyArticleChangeGoogle } from "@/lib/google-indexing";
import { r2Upload } from "@/lib/r2";

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

const ALLOWED_SECTIONS = ["politica", "deportes", "economia", "internacionales", "tucuman", "opinion", "actualidad", "espectaculos", "horoscopo"];

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

  // Si la nota fue enhanced por el agente LLM y el editor la modifica manualmente,
  // marcamos manually_edited=true para que el agente no la re-procese en el futuro.
  const { data: existing } = await supabase
    .from("articles")
    .select("enhanced_at, featured, featured_at")
    .eq("id", id)
    .maybeSingle();
  if (existing?.enhanced_at) {
    (data as Record<string, unknown>).manually_edited = true;
  }

  // featured_at (migración 039): si pasa a destacada (desde no destacada o vencida)
  // arranca ciclo de 24h; si se desdestaca se limpia; si ya está fresca no se toca
  // (guardar el form no resetea el ciclo).
  if (payload.featured) {
    const wasFresh =
      existing?.featured && existing.featured_at &&
      Date.now() - new Date(existing.featured_at).getTime() < 24 * 60 * 60 * 1000;
    if (!wasFresh) {
      (data as Record<string, unknown>).featured_at = new Date().toISOString();
    }
  } else {
    (data as Record<string, unknown>).featured_at = null;
  }

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

  // IndexNow: notificar push a Bing/Yandex (best-effort, no bloqueante)
  void notifyArticleChange(payload.section, id);
  // Google Indexing API: notificar push a Google Web Search
  void notifyArticleChangeGoogle(payload.section, id);

  return { error: null };
}

/** Aprueba una nota enhanced por el agente LLM: la publica (active=true) y
 *  quita el flag manual_review_required. Revalida + notifica IndexNow/Google. */
export async function approveEnhancedArticle(id: string, section: string) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  if (!ALLOWED_SECTIONS.includes(section)) {
    return { error: "Sección no válida" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("articles")
    .update({
      active: true,
      manual_review_required: false,
      section,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/revision");
  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath(`/${section}`);
  revalidatePath(`/${section}/${id}`);

  void notifyArticleChange(section, id);
  void notifyArticleChangeGoogle(section, id);

  return { error: null };
}

/** Rechaza el enhancement: revierte body/title al original, limpia campos del
 *  agente y deja la nota como draft (active=false). Fede decide después qué hacer. */
export async function rejectEnhancedArticle(id: string) {
  try {
    await requireEditorAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  // Traer original_body y original_title para revertir.
  const { data: art, error: fetchErr } = await supabase
    .from("articles")
    .select("original_body, original_title, section")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !art) {
    return { error: fetchErr?.message ?? "Nota no encontrada" };
  }

  const { error } = await supabase
    .from("articles")
    .update({
      title: art.original_title,
      body: art.original_body,
      volanta: null,
      excerpt: "",
      original_body: null,
      original_title: null,
      enhanced_at: null,
      enhancer_version: null,
      manual_review_required: false,
      manually_edited: true,
      active: false,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/revision");
  revalidatePath("/admin/articles");
  revalidatePath("/");
  if (art.section) {
    revalidatePath(`/${art.section}`);
    revalidatePath(`/${art.section}/${id}`);
  }

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

  // featured_at: nota nueva destacada arranca su ciclo de 24h.
  if (payload.featured) {
    (data as Record<string, unknown>).featured_at = new Date().toISOString();
  }

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

  // IndexNow: notificar push a Bing/Yandex (best-effort, no bloqueante)
  void notifyArticleChange(payload.section, result.id);
  // Google Indexing API: notificar push a Google Web Search
  void notifyArticleChangeGoogle(payload.section, result.id);

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const publicUrl = await r2Upload("articles", path, buffer, file.type);

  if (!publicUrl) {
    return { error: "Error al subir imagen a R2.", url: null };
  }
  return { error: null, url: publicUrl };
}