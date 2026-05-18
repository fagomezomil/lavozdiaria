import { createClient } from "@/lib/supabase/server";
import type { Ad, AdType, Section } from "@/lib/types";

export async function getActiveAds(type?: AdType, section?: Section): Promise<Ad[]> {
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

    // Section filtering: global ads (section IS NULL) + section-specific ads
    if (section) {
      query = query.or(`section.is.null,section.eq.${section}`);
    } else {
      // No section specified = homepage, show only global ads
      query = query.is("section", null);
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
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((ad: Record<string, unknown>) => {
    const { clients, ...rest } = ad;
    return { ...rest, client_name: (clients as Record<string, unknown>)?.name as string | null };
  }) as Ad[];
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

/** Pick a single ad of the given type, weighted random by priority */
export function pickAd(ads: Ad[], type: AdType): Ad | undefined {
  const matching = ads.filter((a) => a.type === type);
  if (matching.length === 0) return undefined;
  if (matching.length === 1) return matching[0];

  const weights = matching.map((a) => a.priority + 1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < matching.length; i++) {
    random -= weights[i];
    if (random <= 0) return matching[i];
  }
  return matching[matching.length - 1];
}

/** Pick multiple unique ads of the given type, weighted random by priority */
export function pickAds(ads: Ad[], type: AdType, count: number): Ad[] {
  const matching = ads.filter((a) => a.type === type);
  if (matching.length <= count) return matching;

  const result: Ad[] = [];
  const remaining = [...matching];
  for (let i = 0; i < count; i++) {
    const weights = remaining.map((a) => a.priority + 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    let picked = remaining[remaining.length - 1];
    for (let j = 0; j < remaining.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        picked = remaining[j];
        break;
      }
    }
    result.push(picked);
    remaining.splice(remaining.indexOf(picked), 1);
  }
  return result;
}