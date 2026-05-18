import { createClient } from "@/lib/supabase/server";
import type { SponsoredContent, Section } from "@/lib/types";

function mapRow(row: Record<string, unknown>): SponsoredContent {
  return {
    id: row.id as string,
    title: row.title as string,
    subtitle: (row.subtitle as string) || "",
    section: row.section as Section,
    author: (row.author as string) || null,
    publisher: (row.publisher as string) || "",
    date: (row.date as string) || "",
    imageUrl: (row.image_url as string) || null,
    imageAlt: (row.image_alt as string) || "",
    excerpt: (row.excerpt as string) || "",
    body: (row.body as string) || null,
    originalUrl: (row.original_url as string) || null,
    active: (row.active as boolean) ?? true,
    showOnHomepage: (row.show_on_homepage as boolean) ?? true,
    showInSidebar: (row.show_in_sidebar as boolean) ?? true,
    clientId: (row.client_id as string) || null,
    clientName: (row.client_name as string) || null,
    startsAt: (row.starts_at as string) || null,
    expiresAt: (row.expires_at as string) || null,
    createdBy: (row.created_by as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAllSponsored(): Promise<SponsoredContent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsored_contents")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => {
    const { clients, ...rest } = row;
    const merged = { ...rest, client_name: (clients as Record<string, unknown>)?.name as string | null };
    return mapRow(merged);
  });
}

export async function getActiveSponsored(section?: Section, homepageOnly?: boolean, sidebarOnly?: boolean): Promise<SponsoredContent[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("sponsored_contents")
    .select("*")
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .order("created_at", { ascending: false });

  if (section) {
    query = query.eq("section", section);
  }

  if (homepageOnly) {
    query = query.eq("show_on_homepage", true);
  }

  if (sidebarOnly) {
    query = query.eq("show_in_sidebar", true);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function getSponsoredById(id: string): Promise<SponsoredContent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsored_contents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapRow(data);
}

export async function getClientSponsored(clientId: string): Promise<SponsoredContent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsored_contents")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapRow);
}