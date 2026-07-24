import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ComentariosDashboard from "@/components/admin/ComentariosDashboard";

export const dynamic = "force-dynamic";

async function getComments() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("id, article_id, user_id, content, created_at, status, toxicity_score, report_count, profiles!comments_user_id_fkey(full_name, avatar_url), articles(title)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  const rows = data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    article_id: row.article_id as string,
    user_id: (row.user_id as string) || null,
    content: row.content as string,
    created_at: row.created_at as string,
    status: row.status as string,
    toxicity_score: row.toxicity_score as number | null,
    report_count: (row.report_count as number) || 0,
    user_name: ((row.profiles as Record<string, unknown>)?.full_name as string) || "Anónimo",
    user_avatar_url: ((row.profiles as Record<string, unknown>)?.avatar_url as string) || null,
    article_title: ((row.articles as Record<string, unknown>)?.title as string) || "Nota eliminada",
  }));

  // Ordenar: pending primero, flagged segundo, luego resto por fecha
  const statusWeight: Record<string, number> = { pending: 0, flagged: 1, approved: 2, rejected: 3 };
  rows.sort((a, b) => {
    const wa = statusWeight[a.status] ?? 5;
    const wb = statusWeight[b.status] ?? 5;
    if (wa !== wb) return wa - wb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return rows;
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