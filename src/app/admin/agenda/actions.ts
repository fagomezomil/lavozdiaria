"use server";

import { createClient, requireEditorAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AgendaCategory } from "@/lib/types";

export async function toggleEventActive(eventId: string, active: boolean) {
  await requireEditorAction();
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw new Error(`No se pudo cambiar active: ${error.message}`);
  revalidatePath("/admin/agenda");
  revalidatePath("/agenda");
}

export async function toggleEventFeatured(eventId: string, featured: boolean) {
  await requireEditorAction();
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw new Error(`No se pudo cambiar featured: ${error.message}`);
  revalidatePath("/admin/agenda");
  revalidatePath("/agenda");
}

export async function deleteEvent(eventId: string) {
  await requireEditorAction();
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw new Error(`No se pudo eliminar: ${error.message}`);
  revalidatePath("/admin/agenda");
  revalidatePath("/agenda");
}

interface CreateManualEventPayload {
  title: string;
  category: AgendaCategory;
  subcategory?: string;
  date_iso: string; // YYYY-MM-DD
  time?: string; // "21:00 hs"
  end_date?: string;
  venue_name?: string;
  venue_city?: string;
  venue_address?: string;
  image_url?: string;
  image_alt?: string;
  excerpt?: string;
  description?: string;
  price_range?: string;
  price_min?: number;
  price_max?: number;
  is_free?: boolean;
  ticket_url?: string;
  featured?: boolean;
  active?: boolean;
}

function buildSortDate(dateIso: string, time?: string): string | null {
  if (!dateIso) return null;
  let timePart = "00:00:00";
  if (time) {
    const m = time.trim().replace(/\s*hs\s*$/i, "").trim();
    if (m.includes(":")) {
      const parts = m.split(":");
      const hh = parts[0] || "0";
      const mm = parts[1] || "00";
      timePart = `${parseInt(hh, 10).toString().padStart(2, "0")}:${mm}:00`;
    }
  }
  return `${dateIso}T${timePart}Z`;
}

function weekdayShort(dateIso: string): string {
  const WD = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  try {
    const d = new Date(`${dateIso}T00:00:00Z`);
    return WD[d.getUTCDay()];
  } catch {
    return "";
  }
}

export async function createManualEvent(payload: CreateManualEventPayload) {
  await requireEditorAction();
  const supabase = await createClient();

  const date_iso = payload.date_iso || null;
  const sort_date = date_iso ? buildSortDate(date_iso, payload.time) : null;

  const row = {
    title: payload.title,
    category: payload.category,
    subcategory: payload.subcategory || null,
    date_iso,
    date_label_num: date_iso ? date_iso.slice(8, 10) : null,
    date_label_name: date_iso ? weekdayShort(date_iso) : null,
    time: payload.time || null,
    end_date: payload.end_date || null,
    venue_name: payload.venue_name || null,
    venue_city: payload.venue_city || null,
    venue_address: payload.venue_address || null,
    image_url: payload.image_url || null,
    image_alt: payload.image_alt || payload.title,
    excerpt: payload.excerpt || null,
    description: payload.description || null,
    price_range: payload.price_range || null,
    price_min: payload.price_min ?? null,
    price_max: payload.price_max ?? null,
    is_free: payload.is_free ?? false,
    source_name: "manual",
    source_url: null,
    ticket_url: payload.ticket_url || null,
    active: payload.active ?? true,
    featured: payload.featured ?? false,
    sort_date,
  };

  const { error } = await supabase.from("events").insert(row);
  if (error) throw new Error(`No se pudo crear el evento: ${error.message}`);
  revalidatePath("/admin/agenda");
  revalidatePath("/agenda");
}

export async function updateManualEvent(eventId: string, payload: Partial<CreateManualEventPayload>) {
  await requireEditorAction();
  const supabase = await createClient();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of Object.keys(payload) as (keyof CreateManualEventPayload)[]) {
    if (k === "date_iso") {
      const date_iso = payload.date_iso || null;
      update.date_iso = date_iso;
      update.date_label_num = date_iso ? date_iso.slice(8, 10) : null;
      update.date_label_name = date_iso ? weekdayShort(date_iso) : null;
      update.sort_date = date_iso ? buildSortDate(date_iso, payload.time) : null;
    } else if (payload[k] !== undefined) {
      update[k] = payload[k];
    }
  }

  const { error } = await supabase.from("events").update(update).eq("id", eventId);
  if (error) throw new Error(`No se pudo actualizar: ${error.message}`);
  revalidatePath("/admin/agenda");
  revalidatePath("/agenda");
}