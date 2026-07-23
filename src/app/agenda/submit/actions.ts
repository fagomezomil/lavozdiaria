"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireEditorAction } from "@/lib/supabase/server";
import type { AgendaCategory } from "@/lib/types";

const VALID_CATS: AgendaCategory[] = ["cultural", "turistico", "deportivo"];
const MAX_TITLE = 200;
const MAX_TEXT = 5000;
const MAX_SHORT = 200;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SUBMIT_RATE_LIMIT_PER_HOUR = 10;

/** Solo permite URLs http(s)://. Rechaza javascript:, data:, vbscript:, etc. */
function safeUrl(u?: string): string | null {
  if (!u) return null;
  const s = u.trim();
  if (/^https?:\/\//i.test(s) && s.length <= 2000) return s;
  return null;
}

function truncate(u: string | undefined | null, max: number): string | null {
  if (!u) return null;
  const s = u.trim();
  if (s.length > max) return s.slice(0, max);
  return s || null;
}

/** Usuario autenticado: envia propuesta de evento a la cola de moderación. */
export async function submitEventProposal(payload: {
  title: string;
  category: AgendaCategory;
  subcategory?: string;
  date_iso: string;
  time?: string;
  end_date?: string;
  venue_name?: string;
  venue_city?: string;
  venue_address?: string;
  image_url?: string;
  description?: string;
  price_range?: string;
  ticket_url?: string;
  contact_email?: string;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión para enviar una propuesta." };

  // Validaciones de input
  const title = payload.title.trim();
  if (title.length < 3) return { error: "El título es muy corto." };
  if (title.length > MAX_TITLE) return { error: `El título no puede superar ${MAX_TITLE} caracteres.` };
  if (!VALID_CATS.includes(payload.category)) return { error: "Categoría inválida." };
  if (!payload.date_iso || !/^\d{4}-\d{2}-\d{2}$/.test(payload.date_iso)) return { error: "La fecha es obligatoria (YYYY-MM-DD)." };
  if (payload.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(payload.end_date)) return { error: "Fecha fin inválida." };
  if (payload.contact_email && !EMAIL_RE.test(payload.contact_email.trim())) return { error: "Email de contacto inválido." };
  if (payload.description && payload.description.length > MAX_TEXT) return { error: `La descripción no puede superar ${MAX_TEXT} caracteres.` };

  // Rate limit suave: contar propuestas del user en la última hora
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("event_submissions")
    .select("id", { count: "exact", head: true })
    .eq("submitted_by", user.id)
    .gte("submitted_at", oneHourAgo);
  if ((count ?? 0) >= SUBMIT_RATE_LIMIT_PER_HOUR) {
    return { error: "Ya enviaste varias propuestas en la última hora. Esperá un rato." };
  }

  const { data, error } = await supabase
    .from("event_submissions")
    .insert({
      title,
      category: payload.category,
      subcategory: truncate(payload.subcategory, MAX_SHORT),
      date_iso: payload.date_iso,
      time: truncate(payload.time, 20),
      end_date: payload.end_date || null,
      venue_name: truncate(payload.venue_name, MAX_SHORT),
      venue_city: truncate(payload.venue_city, MAX_SHORT),
      venue_address: truncate(payload.venue_address, MAX_SHORT),
      image_url: safeUrl(payload.image_url),
      description: truncate(payload.description, MAX_TEXT),
      price_range: truncate(payload.price_range, 80),
      ticket_url: safeUrl(payload.ticket_url),
      contact_email: truncate(payload.contact_email, 254),
      submitted_by: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[submissions] insert error:", error.message);
    return { error: "No se pudo guardar la propuesta. Intentá de nuevo." };
  }

  revalidatePath("/admin/agenda/submissions");
  revalidatePath("/mis-propuestas");
  return { id: data.id };
}

/** Admin/editor: aprueba propuesta → crea event en tabla events + marca approved. */
export async function approveSubmission(
  submissionId: string,
  overrides?: Partial<{
    title: string;
    category: AgendaCategory;
    subcategory: string;
    date_iso: string;
    time: string;
    end_date: string;
    venue_name: string;
    venue_city: string;
    venue_address: string;
    image_url: string;
    excerpt: string;
    description: string;
    price_range: string;
    ticket_url: string;
    featured: boolean;
  }>,
): Promise<{ error?: string }> {
  await requireEditorAction();
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("event_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub) return { error: "Propuesta no encontrada." };
  if (sub.status === "approved") return { error: "Ya estaba aprobada." };

  const title = (overrides?.title ?? sub.title).trim();
  const category = (overrides?.category ?? sub.category) as AgendaCategory;
  if (!VALID_CATS.includes(category)) return { error: "Categoría inválida." };
  const date_iso = overrides?.date_iso ?? sub.date_iso;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_iso)) return { error: "Fecha inválida." };
  const time = overrides?.time ?? sub.time;
  const end_date = overrides?.end_date ?? sub.end_date;
  if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) return { error: "Fecha fin inválida." };
  const venue_name = overrides?.venue_name ?? sub.venue_name;
  const venue_city = overrides?.venue_city ?? sub.venue_city;
  const venue_address = overrides?.venue_address ?? sub.venue_address;
  const image_url = safeUrl(overrides?.image_url ?? sub.image_url ?? undefined);
  const excerpt = overrides?.excerpt ?? null;
  const description = overrides?.description ?? sub.description;
  const price_range = overrides?.price_range ?? sub.price_range;
  const ticket_url = safeUrl(overrides?.ticket_url ?? sub.ticket_url ?? undefined);
  const featured = overrides?.featured ?? false;

  // date_label_num / date_label_name (mismo cálculo que createManualEvent)
  const d = new Date(`${date_iso}T00:00:00Z`);
  const date_label_num = String(d.getUTCDate()).padStart(2, "0");
  const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const date_label_name = MES[d.getUTCMonth()];
  const sort_date = time ? `${date_iso}T${time.padStart(5, "0")}:00Z` : `${date_iso}T00:00:00Z`;

  const { data: eventRow, error: evErr } = await supabase
    .from("events")
    .insert({
      title,
      category,
      subcategory: overrides?.subcategory ?? sub.subcategory,
      date_iso,
      date_label_num,
      date_label_name,
      time,
      end_date,
      venue_name,
      venue_city,
      venue_address,
      image_url,
      image_alt: title,
      excerpt,
      description,
      price_range,
      ticket_url,
      source_name: "propuesta",
      source_url: null,
      active: true,
      featured,
      sort_date,
    })
    .select("id")
    .single();

  if (evErr) {
    console.warn("[submissions] events insert error:", evErr.message);
    return { error: "No se pudo crear el evento: " + evErr.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { error: upErr } = await supabase
    .from("event_submissions")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null,
      published_event_id: eventRow.id,
    })
    .eq("id", submissionId);

  if (upErr) {
    // Compensación: el evento quedó creado pero no se pudo marcar la propuesta.
    // Eliminar el evento huérfano para evitar duplicados en un reintento.
    console.warn("[submissions] approve update error, rolling back event:", upErr.message);
    await supabase.from("events").delete().eq("id", eventRow.id);
    return { error: "No se pudo marcar la propuesta. Se canceló la creación del evento." };
  }

  revalidatePath("/admin/agenda/submissions");
  revalidatePath("/admin/agenda");
  revalidatePath("/agenda");
  return {};
}

/** Admin/editor: rechaza propuesta con motivo opcional. */
export async function rejectSubmission(
  submissionId: string,
  rejectionReason?: string,
): Promise<{ error?: string }> {
  await requireEditorAction();
  const supabase = await createClient();

  const reason = rejectionReason?.trim() || null;
  if (reason && reason.length > 500) return { error: "El motivo no puede superar 500 caracteres." };

  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("event_submissions")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null,
      rejection_reason: reason,
    })
    .eq("id", submissionId);

  if (error) {
    console.warn("[submissions] reject error:", error.message);
    return { error: "No se pudo rechazar la propuesta." };
  }

  revalidatePath("/admin/agenda/submissions");
  revalidatePath("/mis-propuestas");
  return {};
}

/** Admin/editor: elimina propuesta. */
export async function deleteSubmission(submissionId: string): Promise<{ error?: string }> {
  await requireEditorAction();
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_submissions")
    .delete()
    .eq("id", submissionId);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/admin/agenda/submissions");
  revalidatePath("/mis-propuestas");
  return {};
}