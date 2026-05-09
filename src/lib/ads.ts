import { createClient } from "@/lib/supabase/server";
import type { Ad, AdType } from "@/lib/types";

export async function getActiveAds(type?: AdType): Promise<Ad[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("ads")
      .select("*")
      .eq("active", true)
      .order("priority", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    // Filter by date range
    const now = new Date().toISOString();
    return data.filter((ad) => {
      if (ad.starts_at && ad.starts_at > now) return false;
      if (ad.expires_at && ad.expires_at < now) return false;
      return true;
    });
  } catch {
    return [];
  }
}

export async function getAllAds(): Promise<Ad[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getAdById(id: string): Promise<Ad | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}