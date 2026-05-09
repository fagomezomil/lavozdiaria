import { createClient } from "@/lib/supabase/server";
import type { Section, CustomArticle } from "@/lib/types";

function mapRowToArticle(row: Record<string, unknown>): CustomArticle {
  return {
    id: row.id as string,
    title: row.title as string,
    subtitle: (row.subtitle as string) || undefined,
    section: row.section as Section,
    author: (row.author as string) || undefined,
    publisher: row.publisher as string,
    date: row.date as string,
    imageUrl: (row.image_url as string) || undefined,
    imageAlt: (row.image_alt as string) || "",
    excerpt: (row.excerpt as string) || "",
    body: (row.body as string) || undefined,
    originalUrl: (row.original_url as string) || undefined,
    featured: (row.featured as boolean) ?? false,
    breaking: (row.breaking as boolean) ?? false,
    active: row.active as boolean,
    created_by: (row.created_by as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getActiveArticles(section?: Section): Promise<CustomArticle[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("articles")
      .select("*")
      .eq("active", true)
      .order("sort_date", { ascending: false });

    if (section) {
      query = query.eq("section", section);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapRowToArticle);
  } catch {
    return [];
  }
}

export async function getAllArticles(): Promise<CustomArticle[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("sort_date", { ascending: false });

    if (error || !data) return [];
    return data.map(mapRowToArticle);
  } catch {
    return [];
  }
}

export async function getArticleById(id: string): Promise<CustomArticle | null> {
  try {
    const supabase = await createClient();
    // Try fetching without active filter first (admin can see all articles)
    // If RLS only allows active, this will still work for public articles
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapRowToArticle(data);
  } catch {
    return null;
  }
}