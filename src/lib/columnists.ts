import { createClient } from "@/lib/supabase/server";
import type { Columnist } from "@/lib/types";
import { slugify } from "@/lib/slugify";

export { slugify };

function mapRowToColumnist(row: Record<string, unknown>): Columnist {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    photoUrl: (row.photo_url as string) || undefined,
    bio: (row.bio as string) || undefined,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Public-facing: only active columnists. */
export async function getActiveColumnists(): Promise<Columnist[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("columnists")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error || !data) return [];
    return data.map(mapRowToColumnist);
  } catch {
    return [];
  }
}

/** Admin-facing: all columnists (active + inactive). */
export async function getAllColumnists(): Promise<Columnist[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("columnists")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data) return [];
    return data.map(mapRowToColumnist);
  } catch {
    return [];
  }
}

export async function getColumnistById(id: string): Promise<Columnist | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("columnists")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapRowToColumnist(data);
  } catch {
    return null;
  }
}

export async function getColumnistBySlug(slug: string): Promise<Columnist | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("columnists")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return mapRowToColumnist(data);
  } catch {
    return null;
  }
}

/** Build a unique slug from a name: lowercase, strip accents, hyphenate.
 *  Re-exported from @/lib/slugify for convenience. */