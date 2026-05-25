import { requireEditor } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ArticleForm from "@/components/admin/ArticleForm";
import { getArticleById } from "@/lib/articles";
import Link from "next/link";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { user, profile } = await requireEditor();

  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) redirect("/admin/articles");

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <div className="mb-6">
        <Link href="/admin/articles" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Notas
        </Link>
      </div>

      <h2 className="text-lg font-bold mb-6">Editar Nota</h2>
      <ArticleForm article={article} />
    </AdminSiteLayout>
  );
}