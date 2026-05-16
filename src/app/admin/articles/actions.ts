"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
}

export async function updateArticle(payload: UpdateArticlePayload) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado" };
  }

  const { id, ...data } = payload;

  const { error } = await supabase
    .from("articles")
    .update(data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath(`/${payload.section}`);
  revalidatePath(`/${payload.section}/${id}`);

  return { error: null };
}