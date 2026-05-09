import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/admin/LogoutButton";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function NewArticlePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

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
          <Link href="/admin/articles" className="pb-2 border-b-2 border-ink font-bold text-sm">Notas</Link>
          <Link href="/admin/users" className="pb-2 text-sm text-muted hover:text-foreground transition-colors">Usuarios</Link>
        </div>

        <div className="mb-6">
          <Link href="/admin/articles" className="text-sm text-muted hover:text-foreground transition-colors">
            &larr; Volver a Notas
          </Link>
        </div>

        <h2 className="text-lg font-bold mb-6">Nueva Nota</h2>
        <ArticleForm />
      </main>
    </div>
  );
}