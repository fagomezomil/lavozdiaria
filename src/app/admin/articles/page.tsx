import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/admin/LogoutButton";
import ArticleRow from "@/components/admin/ArticleRow";

export default async function AdminArticlesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const articles = await getAllArticles();

  return (
    <div className="min-h-screen bg-[#f0efed]">
      {/* Header */}
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
        {/* Nav tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <Link href="/admin" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Avisos</Link>
          <span className="pb-2 border-b-2 border-ink font-bold text-sm">Notas</span>
          <Link href="/admin/users" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Usuarios</Link>
        </div>

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
      </main>
    </div>
  );
}