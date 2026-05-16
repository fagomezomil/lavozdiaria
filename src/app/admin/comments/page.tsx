import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/server";
import LogoutButton from "@/components/admin/LogoutButton";
import CommentRow from "@/components/admin/CommentRow";

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
  const { user } = await requireAdmin();
  const comments = await getComments();

  return (
    <div className="min-h-screen bg-[#f0efed]">
      <header className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="group">
            <h1 className="text-xl font-bold font-[family-name:var(--font-heading)]">
              La<span className="text-[#c8102e]">Voz</span>Diaria
            </h1>
            <p className="text-xs text-white/60">Panel de Administración</p>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/60">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6 border-b border-border">
          <Link href="/admin" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Avisos</Link>
          <Link href="/admin/articles" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Notas</Link>
          <span className="pb-2 border-b-2 border-ink font-bold text-sm">Comentarios</span>
          <Link href="/admin/users" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Usuarios</Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Comentarios</h2>
          <span className="text-sm text-muted">{comments.length} comentarios</span>
        </div>

        {comments.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-border">
            <p className="text-muted">No hay comentarios aún.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink text-white">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Nota</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Usuario</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Comentario</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comments.map((comment: { id: string; article_id: string; user_name: string; content: string; created_at: string; article_title: string }) => (
                  <CommentRow key={comment.id} comment={comment} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}