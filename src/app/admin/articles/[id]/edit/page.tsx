import { requireEditor } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ArticleForm from "@/components/admin/ArticleForm";
import { getArticleById } from "@/lib/articles";
import { getActiveColumnists } from "@/lib/columnists";
import Link from "next/link";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}

export default async function EditArticlePage({ params, searchParams }: EditArticlePageProps) {
  const { user, profile } = await requireEditor();

  const { id } = await params;
  const sp = await searchParams;
  const article = await getArticleById(id);

  if (!article) redirect("/admin/articles");

  const backHref = sp.ref === "opinion" || article.section === "opinion" ? "/admin/opinion" : "/admin/articles";
  const backLabel = sp.ref === "opinion" || article.section === "opinion" ? "Volver a Notas de Opinión" : "Volver a Notas";
  const columnists = await getActiveColumnists();

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <div className="mb-6">
        <Link href={backHref} className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; {backLabel}
        </Link>
      </div>

      <h2 className="text-lg font-bold mb-6">
        {article.section === "opinion" ? "Editar Nota de Opinión" : "Editar Nota"}
      </h2>
      <ArticleForm article={article} columnists={columnists} />
    </AdminSiteLayout>
  );
}