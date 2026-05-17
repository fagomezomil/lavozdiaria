import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { requireEditor } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import ArticleRow from "@/components/admin/ArticleRow";

export default async function AdminArticlesPage() {
  const { user, profile } = await requireEditor();

  const articles = await getAllArticles();

  return (
    <AdminLayout role={profile.role} email={user.email!} activeTab="notas">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Notas Periodísticas</h2>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-ink text-white text-sm font-bold rounded hover:bg-ink/80 transition-colors"
        >
          + Nueva Nota
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-border">
          <p className="text-muted">No hay notas periodísticas cargadas.</p>
          <p className="text-sm text-muted/60 mt-1">
            Hacé clic en &ldquo;Nueva Nota&rdquo; para crear la primera.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold w-16"></th>
                <th className="px-4 py-2.5 text-left font-semibold">Título</th>
                <th className="px-4 py-2.5 text-left font-semibold">Estado</th>
                <th className="px-4 py-2.5 text-left font-semibold">Comentarios</th>
                <th className="px-4 py-2.5 text-left font-semibold">Fecha</th>
                <th className="px-4 py-2.5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {articles.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}