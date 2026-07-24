import { createClient } from "@/lib/supabase/server";
import type { AgendaCategory, AgendaEvent } from "@/lib/types";

interface EventRow {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  date_iso: string | null;
  date_label_num: string | null;
  date_label_name: string | null;
  time: string | null;
  venue_name: string | null;
  venue_city: string | null;
  image_url: string | null;
  image_alt: string | null;
  excerpt: string | null;
  description: string | null;
  price_range: string | null;
  price_min: number | null;
  price_max: number | null;
  is_free: boolean;
  source_name: string;
  source_url: string | null;
  ticket_url: string | null;
  active: boolean;
  featured: boolean;
  sort_date: string | null;
  end_date: string | null;
  venue_address: string | null;
  created_at: string;
}

export interface AdminEvent extends AgendaEvent {
  active: boolean;
  sourceUrl?: string;
  venueAddress?: string;
  endDate?: string;
  priceMin?: number;
  priceMax?: number;
  createdAt: string;
}

function mapRowToEvent(row: EventRow): AgendaEvent {
  const isFree = row.is_free || (row.price_min === 0 && row.price_max === 0);
  return {
    id: row.id,
    title: row.title,
    category: row.category as AgendaCategory,
    subcategory: row.subcategory || undefined,
    date: row.date_iso || "",
    dateLabel: {
      num: row.date_label_num || "",
      name: row.date_label_name || "",
    },
    time: row.time || "",
    venueName: row.venue_name || "",
    venueCity: row.venue_city || "",
    imageUrl: row.image_url || undefined,
    imageAlt: row.image_alt || undefined,
    excerpt: row.excerpt || undefined,
    description: row.description || undefined,
    price: row.price_range || (isFree ? "Gratis" : undefined),
    isFree,
    ticketUrl: row.ticket_url || undefined,
    sourceName: row.source_name,
    featured: row.featured,
  };
}

function mapRowToAdminEvent(row: EventRow): AdminEvent {
  return {
    ...mapRowToEvent(row),
    active: row.active,
    sourceUrl: row.source_url || undefined,
    venueAddress: row.venue_address || undefined,
    endDate: row.end_date || undefined,
    priceMin: row.price_min ?? undefined,
    priceMax: row.price_max ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Fetch all active events, ordered by sort_date (proximos primero).
 * Returns empty array on error (layout shows empty state).
 */
export async function getActiveEvents(): Promise<AgendaEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("active", true)
    .order("sort_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.warn("[agenda] getActiveEvents error:", error.message);
    return [];
  }
  return (data as EventRow[]).map(mapRowToEvent);
}

/**
 * Admin: fetch all events (active + inactive), newest sort_date first.
 */
export async function getAllEventsAdmin(): Promise<AdminEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("sort_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.warn("[agenda] getAllEventsAdmin error:", error.message);
    return [];
  }
  return (data as EventRow[]).map(mapRowToAdminEvent);
}

/**
 * Admin: fetch single event by id (active or not).
 */
export async function getEventByIdAdmin(id: string): Promise<AdminEvent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToAdminEvent(data as EventRow);
}