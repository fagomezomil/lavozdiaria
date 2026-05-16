import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfilePageClient from "@/components/ProfilePageClient";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch likes for custom articles
  const { data: likes } = await supabase
    .from("likes")
    .select("article_id, created_at, articles(title, section, image_url, image_alt, date, excerpt)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch favorites for custom articles
  const { data: favorites } = await supabase
    .from("favorites")
    .select("article_id, created_at, articles(title, section, image_url, image_alt, date, excerpt)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch user's comments with article info
  const { data: comments } = await supabase
    .from("comments")
    .select("id, article_id, content, created_at, articles(title, section)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Transform to Article-like objects
  const likedArticles = (likes ?? []).map((l: any) => ({
    id: l.article_id,
    title: l.articles?.title ?? "",
    section: l.articles?.section ?? "",
    imageUrl: l.articles?.image_url,
    imageAlt: l.articles?.image_alt ?? "",
    date: l.articles?.date ?? "",
    excerpt: l.articles?.excerpt ?? "",
  }));

  const favoritedArticles = (favorites ?? []).map((f: any) => ({
    id: f.article_id,
    title: f.articles?.title ?? "",
    section: f.articles?.section ?? "",
    imageUrl: f.articles?.image_url,
    imageAlt: f.articles?.image_alt ?? "",
    date: f.articles?.date ?? "",
    excerpt: f.articles?.excerpt ?? "",
  }));

  const userComments = (comments ?? []).map((c: any) => ({
    id: c.id,
    articleId: c.article_id,
    articleTitle: c.articles?.title ?? "Nota eliminada",
    articleSection: c.articles?.section ?? "",
    content: c.content,
    createdAt: c.created_at,
  }));

  return (
    <>
      <Header />
      <Navbar />
      <ProfilePageClient
        likedArticles={likedArticles}
        favoritedArticles={favoritedArticles}
        userComments={userComments}
      />
      <Footer />
    </>
  );
}