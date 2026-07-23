import { createClient } from "@/lib/supabase/server";
import { requireEditorAction } from "@/lib/supabase/server";
import type { EventSubmission, SubmissionStatus, AgendaCategory } from "@/lib/types";

interface SubmissionRow {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  date_iso: string | null;
  time: string | null;
  end_date: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_address: string | null;
  image_url: string | null;
  description: string | null;
  price_range: string | null;
  ticket_url: string | null;
  contact_email: string | null;
  submitted_by: string | null;
  submitted_at: string;
  status: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  published_event_id: string | null;
}

function mapRowToSubmission(row: SubmissionRow): EventSubmission {
  return {
    id: row.id,
    title: row.title,
    category: row.category as AgendaCategory,
    subcategory: row.subcategory || undefined,
    date: row.date_iso || "",
    time: row.time || undefined,
    endDate: row.end_date || undefined,
    venueName: row.venue_name || undefined,
    venueCity: row.venue_city || undefined,
    venueAddress: row.venue_address || undefined,
    imageUrl: row.image_url || undefined,
    description: row.description || undefined,
    priceRange: row.price_range || undefined,
    ticketUrl: row.ticket_url || undefined,
    contactEmail: row.contact_email || undefined,
    submittedBy: row.submitted_by || undefined,
    submittedAt: row.submitted_at,
    status: row.status as SubmissionStatus,
    reviewedAt: row.reviewed_at || undefined,
    rejectionReason: row.rejection_reason || undefined,
    publishedEventId: row.published_event_id || undefined,
  };
}

/** User: fetch own submissions (requiere user logueado). */
export async function getMySubmissions(): Promise<EventSubmission[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // sin user → sin propuestas

  const { data, error } = await supabase
    .from("event_submissions")
    .select("*")
    .eq("submitted_by", user.id)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.warn("[submissions] getMySubmissions error:", error.message);
    return [];
  }
  // Doble check: RLS ya filtra a las del user, pero por safety filtramos acá también
  return (data as SubmissionRow[])
    .filter((r) => r.submitted_by === user.id)
    .map(mapRowToSubmission);
}

/** Admin/editor: fetch all submissions, optional status filter. */
export async function getAllSubmissions(status?: SubmissionStatus): Promise<EventSubmission[]> {
  await requireEditorAction();
  const supabase = await createClient();
  let query = supabase.from("event_submissions").select("*");
  if (status) query = query.eq("status", status);
  query = query.order("submitted_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.warn("[submissions] getAllSubmissions error:", error.message);
    return [];
  }
  return (data as SubmissionRow[]).map(mapRowToSubmission);
}

/** Admin/editor: fetch single submission by id. */
export async function getSubmissionById(id: string): Promise<EventSubmission | null> {
  await requireEditorAction();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToSubmission(data as SubmissionRow);
}