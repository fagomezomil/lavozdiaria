import { requireEditor } from "@/lib/supabase/server";
import AdminSiteLayout from "@/components/admin/AdminSiteLayout";
import ArticleForm from "@/components/admin/ArticleForm";
import Link from "next/link";

export default async function NewArticlePage() {
  const { user, profile } = await requireEditor();

  return (
    <AdminSiteLayout role={profile.role} email={user.email!}>
      <div className="mb-6">
        <Link href="/admin/articles" className="text-sm text-muted hover:text-foreground transition-colors">
          &larr; Volver a Notas
        </Link>
      </div>

      <h2 className="text-lg font-bold mb-6">Nueva Nota</h2>
      <ArticleForm />
    </AdminSiteLayout>
  );
}