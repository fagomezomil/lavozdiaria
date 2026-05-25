import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ComentariosDashboard from "@/components/admin/ComentariosDashboard";

export const dynamic = "force-dynamic";

async function getComments() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("id, article_id, user_id, content, created_at, profiles!comments_user_id_fkey(full_name, avatar_url), articles(title)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    article_id: row.article_id as string,
    user_id: (row.user_id as string) || null,
    content: row.content as string,
    created_at: row.created_at as string,
    user_name: ((row.profiles as Record<string, unknown>)?.full_name as string) || "Anónimo",
    user_avatar_url: ((row.profiles as Record<string, unknown>)?.avatar_url as string) || null,
    article_title: ((row.articles as Record<string, unknown>)?.title as string) || "Nota eliminada",
  }));
}

export default async function AdminCommentsPage() {
  const { user, profile } = await requireEditor();
  const comments = await getComments();

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <ComentariosDashboard comments={comments} />
    </AdminSiteLayout>
  );
}